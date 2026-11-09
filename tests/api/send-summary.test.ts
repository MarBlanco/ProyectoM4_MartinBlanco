// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase Admin y AWS SES mockeados: ninguna llamada sale a la red
// y no se usan credenciales reales.
const mocks = vi.hoisted(() => {
    const where = vi.fn();
    const get = vi.fn();
    const collection = vi.fn(() => ({ where }));
    where.mockImplementation(() => ({ get }));

    return {
        getApps: vi.fn(() => [] as unknown[]),
        getApp: vi.fn(() => ({ name: 'existing-app' })),
        initializeApp: vi.fn(() => ({ name: 'new-app' })),
        cert: vi.fn((serviceAccount: unknown) => serviceAccount),
        verifyIdToken: vi.fn(),
        collection,
        where,
        get,
        sesSend: vi.fn(),
        sesClientConfig: vi.fn(),
    };
});

vi.mock('firebase-admin/app', () => ({
    getApps: mocks.getApps,
    getApp: mocks.getApp,
    initializeApp: mocks.initializeApp,
    cert: mocks.cert,
}));

vi.mock('firebase-admin/auth', () => ({
    getAuth: () => ({ verifyIdToken: mocks.verifyIdToken }),
}));

vi.mock('firebase-admin/firestore', () => ({
    getFirestore: () => ({ collection: mocks.collection }),
}));

vi.mock('@aws-sdk/client-ses', () => ({
    SESClient: class {
        constructor(config: unknown) {
            mocks.sesClientConfig(config);
        }

        send = mocks.sesSend;
    },
    SendEmailCommand: class {
        input: unknown;

        constructor(input: unknown) {
            this.input = input;
        }
    },
}));

const TEST_ENV = {
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    AWS_REGION: 'us-east-1',
    SES_FROM_EMAIL: 'remitente@example.com',
    FIREBASE_PROJECT_ID: 'test-project',
    FIREBASE_CLIENT_EMAIL: 'admin@test-project.iam.gserviceaccount.com',
    FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
};

interface SentEmail {
    input: {
        Source: string;
        Destination: { ToAddresses: string[] };
        Message: {
            Subject: { Data: string };
            Body: { Html: { Data: string }; Text: { Data: string } };
        };
    };
}

function createResponse() {
    const res = {
        statusCode: 0,
        body: undefined as unknown,
        headers: {} as Record<string, string>,
        status: vi.fn((code: number) => {
            res.statusCode = code;
            return res;
        }),
        json: vi.fn((body: unknown) => {
            res.body = body;
            return res;
        }),
        setHeader: vi.fn((name: string, value: string) => {
            res.headers[name] = value;
            return res;
        }),
    };

    return res;
}

// El handler lee process.env al importarse: se recarga en cada test.
async function callHandler(
    req: { method: string; headers?: Record<string, string> },
    env: Partial<Record<keyof typeof TEST_ENV, string>> = TEST_ENV,
) {
    vi.unstubAllEnvs();
    for (const name of Object.keys(TEST_ENV)) {
        vi.stubEnv(name, env[name as keyof typeof TEST_ENV] ?? '');
    }

    vi.resetModules();
    const { default: handler } = await import('../../api/send-summary.js');

    const res = createResponse();
    await handler(
        { headers: {}, ...req } as unknown as Parameters<typeof handler>[0],
        res as unknown as Parameters<typeof handler>[1],
    );

    return res;
}

const authorized = {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
};

function mockTasks(tasks: Array<Record<string, unknown>>) {
    mocks.get.mockResolvedValue({
        docs: tasks.map((data) => ({ data: () => data })),
    });
}

function sentEmail(): SentEmail['input'] {
    return (mocks.sesSend.mock.calls[0][0] as SentEmail).input;
}

describe('POST /api/send-summary', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        mocks.getApps.mockReturnValue([]);
        mocks.verifyIdToken.mockResolvedValue({
            uid: 'user-1',
            email: 'ana@example.com',
        });
        mocks.sesSend.mockResolvedValue({ MessageId: 'msg-1' });
        mockTasks([]);
    });

    it('rechaza métodos distintos de POST con 405', async () => {
        const res = await callHandler({ method: 'GET' });

        expect(res.statusCode).toBe(405);
        expect(res.headers.Allow).toBe('POST');
        expect(mocks.sesSend).not.toHaveBeenCalled();
    });

    it('responde 401 sin header Authorization', async () => {
        const res = await callHandler({ method: 'POST' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'No estás autenticado.' });
        expect(mocks.verifyIdToken).not.toHaveBeenCalled();
    });

    it('responde 401 si el header no es Bearer', async () => {
        const res = await callHandler({
            method: 'POST',
            headers: { authorization: 'Basic abc' },
        });

        expect(res.statusCode).toBe(401);
    });

    it('responde 401 si el token es inválido o expiró', async () => {
        mocks.verifyIdToken.mockRejectedValue(
            Object.assign(new Error('expired'), { code: 'auth/id-token-expired' }),
        );

        const res = await callHandler(authorized);

        expect(mocks.verifyIdToken).toHaveBeenCalledWith('valid-token');
        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            error: 'Sesión inválida o expirada. Volvé a iniciar sesión.',
        });
        expect(mocks.sesSend).not.toHaveBeenCalled();
    });

    it('responde 400 si el usuario no tiene email', async () => {
        mocks.verifyIdToken.mockResolvedValue({ uid: 'user-1' });

        const res = await callHandler(authorized);

        expect(res.statusCode).toBe(400);
        expect(mocks.sesSend).not.toHaveBeenCalled();
    });

    it('responde 500 sin exponer detalles si faltan variables de AWS', async () => {
        const res = await callHandler(authorized, { ...TEST_ENV, AWS_REGION: '' });

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            error: 'No se pudo enviar el resumen. Intentá nuevamente.',
        });
        expect(mocks.sesSend).not.toHaveBeenCalled();
    });

    it('responde 500 si faltan variables de Firebase Admin', async () => {
        const res = await callHandler(authorized, {
            ...TEST_ENV,
            FIREBASE_PRIVATE_KEY: '',
        });

        expect(res.statusCode).toBe(500);
        expect(mocks.initializeApp).not.toHaveBeenCalled();
    });

    it('convierte los \\n escapados de FIREBASE_PRIVATE_KEY en saltos de línea', async () => {
        await callHandler(authorized);

        expect(mocks.cert).toHaveBeenCalledWith({
            projectId: 'test-project',
            clientEmail: 'admin@test-project.iam.gserviceaccount.com',
            privateKey: '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n',
        });
    });

    it('reutiliza la app de Firebase si ya está inicializada', async () => {
        mocks.getApps.mockReturnValue([{ name: 'existing-app' }]);

        const res = await callHandler(authorized);

        expect(res.statusCode).toBe(200);
        expect(mocks.initializeApp).not.toHaveBeenCalled();
        expect(mocks.getApp).toHaveBeenCalled();
    });

    it('consulta solo las tareas del usuario y envía el resumen por SES', async () => {
        mockTasks([
            { title: 'Comprar pan', description: 'Integral', completed: true, userId: 'user-1' },
            { title: 'Estudiar', description: 'React', completed: false, userId: 'user-1' },
            { title: 'Correr', description: '5 km', completed: false, userId: 'user-1' },
        ]);

        const res = await callHandler(authorized);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'Resumen enviado correctamente.',
        });

        expect(mocks.collection).toHaveBeenCalledWith('tasks');
        expect(mocks.where).toHaveBeenCalledWith('userId', '==', 'user-1');

        expect(mocks.sesClientConfig).toHaveBeenCalledWith({
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'test-access-key',
                secretAccessKey: 'test-secret',
            },
        });

        const email = sentEmail();
        expect(email.Source).toBe('remitente@example.com');
        expect(email.Destination.ToAddresses).toEqual(['ana@example.com']);
        expect(email.Message.Subject.Data).toBe('Resumen de tus tareas');

        const text = email.Message.Body.Text.Data;
        expect(text).toContain('Total: 3');
        expect(text).toContain('Completadas: 1');
        expect(text).toContain('Pendientes: 2');
        expect(text).toContain('Comprar pan - Completada');
        expect(text).toContain('Estudiar - Pendiente');

        const html = email.Message.Body.Html.Data;
        expect(html).toContain('<strong>Comprar pan</strong>');
        expect(html).toContain('<p>React</p>');
    });

    it('indica cuando el usuario no tiene tareas', async () => {
        const res = await callHandler(authorized);

        expect(res.statusCode).toBe(200);
        expect(sentEmail().Message.Body.Html.Data).toContain('No hay tareas registradas.');
        expect(sentEmail().Message.Body.Text.Data).toContain('Total: 0');
    });

    it('escapa el HTML de títulos y descripciones', async () => {
        mockTasks([
            {
                title: '<script>alert(1)</script>',
                description: 'a & "b"',
                completed: false,
                userId: 'user-1',
            },
        ]);

        await callHandler(authorized);

        const html = sentEmail().Message.Body.Html.Data;
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).toContain('a &amp; &quot;b&quot;');
    });

    it('responde 500 si AWS SES rechaza el envío', async () => {
        mocks.sesSend.mockRejectedValue(
            Object.assign(new Error('Email address is not verified.'), {
                name: 'MessageRejected',
            }),
        );

        const res = await callHandler(authorized);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            error: 'No se pudo enviar el resumen. Intentá nuevamente.',
        });
    });

    it('responde 500 si falla la consulta a Firestore', async () => {
        mocks.get.mockRejectedValue(new Error('unavailable'));

        const res = await callHandler(authorized);

        expect(res.statusCode).toBe(500);
        expect(mocks.sesSend).not.toHaveBeenCalled();
    });
});
