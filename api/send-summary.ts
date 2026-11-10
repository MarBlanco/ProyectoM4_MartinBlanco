
import type { IncomingMessage, ServerResponse } from 'node:http';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
    cert,
    getApp,
    getApps,
    initializeApp,
} from 'firebase-admin/app';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Tipos del runtime de Node.js de Vercel Functions. Equivalen a los de
// @vercel/node (extienden http.IncomingMessage y http.ServerResponse); se
// definen acá para no depender de ese paquete, cuyas dependencias fijan
// versiones con vulnerabilidades conocidas y que solo aportaba estos tipos.
type VercelRequest = IncomingMessage & {
    query: Record<string, string | string[]>;
    cookies: Record<string, string>;
    body: unknown;
};

type VercelResponse = ServerResponse & {
    send: (body: unknown) => VercelResponse;
    json: (jsonBody: unknown) => VercelResponse;
    status: (statusCode: number) => VercelResponse;
    redirect: (statusOrUrl: string | number, url?: string) => VercelResponse;
};

const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    SES_FROM_EMAIL,
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
} = process.env;

function getFirebaseApp() {
    if (getApps().length > 0) {
        return getApp();
    }

    if (
        !FIREBASE_PROJECT_ID ||
        !FIREBASE_CLIENT_EMAIL ||
        !FIREBASE_PRIVATE_KEY
    ) {
        throw new Error('Faltan variables de Firebase Admin.');
    }

    return initializeApp({
        credential: cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

// Mínimo de tiempo entre dos resúmenes del mismo usuario. Evita que el endpoint
// se use en bucle (costo y cuota de SES). Colección solo accesible con Admin SDK:
// firestore.rules deniega todo lo que no esté listado.
const SUMMARY_COOLDOWN_MS = 60_000;

type SendSlot = 'reserved' | 'rate-limited' | 'unavailable';

// Reserva el envío de forma atómica. 'rate-limited' si el usuario envió hace
// menos de SUMMARY_COOLDOWN_MS. Falla cerrado: si no se puede verificar el
// límite, devuelve 'unavailable' y no se envía el email.
async function reserveSendSlot(db: Firestore, uid: string): Promise<SendSlot> {
    try {
        const reference = db.collection('summaryLimits').doc(uid);

        return await db.runTransaction<SendSlot>(async (transaction) => {
            const snapshot = await transaction.get(reference);
            const lastSentAt: unknown = snapshot.exists
                ? snapshot.data()?.lastSentAt
                : undefined;
            const now = Date.now();

            if (
                typeof lastSentAt === 'number' &&
                now - lastSentAt < SUMMARY_COOLDOWN_MS
            ) {
                return 'rate-limited';
            }

            transaction.set(reference, { lastSentAt: now });
            return 'reserved';
        });
    } catch (error) {
        console.error('Error en el límite de envíos:', error);
        return 'unavailable';
    }
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };

        return entities[character];
    });
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({
            error: 'Método no permitido.',
        });
    }

    // Si el envío falla después de reservar el cupo, se libera para que el
    // usuario pueda reintentar sin esperar el minuto.
    let releaseSlot: (() => Promise<void>) | null = null;

    try {
        const authorization = req.headers.authorization;

        if (!authorization?.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No estás autenticado.',
            });
        }

        if (
            !AWS_ACCESS_KEY_ID ||
            !AWS_SECRET_ACCESS_KEY ||
            !AWS_REGION ||
            !SES_FROM_EMAIL
        ) {
            throw new Error('Faltan variables de AWS SES.');
        }

        const token = authorization.slice(7);

        const firebaseApp = getFirebaseApp();
        const auth = getAuth(firebaseApp);
        const db = getFirestore(firebaseApp);

        let decodedToken: Awaited<ReturnType<typeof auth.verifyIdToken>>;

        try {
            decodedToken = await auth.verifyIdToken(token);
        } catch (error) {
            const code = (error as { code?: unknown }).code;

            // Token inválido o expirado: 401. Cualquier otro fallo (red,
            // certificados de Google) es un error del servidor: 500 con log.
            if (typeof code !== 'string' || !code.startsWith('auth/')) {
                throw error;
            }

            return res.status(401).json({
                error: 'Sesión inválida o expirada. Volvé a iniciar sesión.',
            });
        }

        if (!decodedToken.email) {
            return res.status(400).json({
                error: 'El usuario no tiene un email registrado.',
            });
        }

        if (decodedToken.email_verified !== true) {
            return res.status(403).json({
                error: 'Tu email no está verificado.',
            });
        }

        const slot = await reserveSendSlot(db, decodedToken.uid);

        if (slot === 'unavailable') {
            return res.status(503).json({
                error: 'El servicio no está disponible en este momento. Intentá nuevamente en unos minutos.',
            });
        }

        if (slot === 'rate-limited') {
            res.setHeader('Retry-After', String(SUMMARY_COOLDOWN_MS / 1000));
            return res.status(429).json({
                error: 'Ya enviaste un resumen hace poco. Esperá un minuto e intentá nuevamente.',
            });
        }

        releaseSlot = async () => {
            await db.collection('summaryLimits').doc(decodedToken.uid).delete();
        };

        const snapshot = await db
            .collection('tasks')
            .where('userId', '==', decodedToken.uid)
            .get();

        const tasks = snapshot.docs.map((document) => ({
            title: String(document.data().title),
            description: String(document.data().description),
            completed: document.data().completed === true,
        }));

        const completed = tasks.filter(
            (task) => task.completed,
        ).length;

        const pending = tasks.length - completed;

        const taskList = tasks.length
            ? tasks.map((task) => `
                <li>
                    <strong>${escapeHtml(task.title)}</strong>
                    - ${task.completed ? 'Completada' : 'Pendiente'}
                    <p>${escapeHtml(task.description)}</p>
                </li>
            `).join('')
            : '<li>No hay tareas registradas.</li>';

        const ses = new SESClient({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });

        await ses.send(
            new SendEmailCommand({
                Source: SES_FROM_EMAIL,
                Destination: {
                    ToAddresses: [decodedToken.email],
                },
                Message: {
                    Subject: {
                        Data: 'Resumen de tus tareas',
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Html: {
                            Data: `
                                <h1>Resumen de tus tareas</h1>
                                <p>Total: ${tasks.length}</p>
                                <p>Completadas: ${completed}</p>
                                <p>Pendientes: ${pending}</p>
                                <h2>Detalle de tareas</h2>
                                <ul>${taskList}</ul>
                            `,
                            Charset: 'UTF-8',
                        },
                        Text: {
                            Data: [
                                'Resumen de tus tareas',
                                `Total: ${tasks.length}`,
                                `Completadas: ${completed}`,
                                `Pendientes: ${pending}`,
                                '',
                                ...tasks.map((task) =>
                                    `${task.title} - ${
                                        task.completed
                                            ? 'Completada'
                                            : 'Pendiente'
                                    }`,
                                ),
                            ].join('\n'),
                            Charset: 'UTF-8',
                        },
                    },
                },
            }),
        );

        return res.status(200).json({
            success: true,
            message: 'Resumen enviado correctamente.',
        });
    } catch (error) {
        console.error('Error al enviar resumen:', error);

        if (releaseSlot) {
            try {
                await releaseSlot();
            } catch (releaseError) {
                console.error('No se pudo liberar el cupo de envío:', releaseError);
            }
        }

        return res.status(500).json({
            error: 'No se pudo enviar el resumen. Intentá nuevamente.',
        });
    }
}
