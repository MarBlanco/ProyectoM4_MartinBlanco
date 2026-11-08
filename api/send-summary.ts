
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
    cert,
    getApp,
    getApps,
    initializeApp,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
        } catch {
            return res.status(401).json({
                error: 'Sesión inválida o expirada. Volvé a iniciar sesión.',
            });
        }

        if (!decodedToken.email) {
            return res.status(400).json({
                error: 'El usuario no tiene un email registrado.',
            });
        }

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

        return res.status(500).json({
            error: 'No se pudo enviar el resumen. Intentá nuevamente.',
        });
    }
}
