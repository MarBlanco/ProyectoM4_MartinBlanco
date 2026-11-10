import { useRef, useState } from 'react';
import type { User } from 'firebase/auth';

interface SendSummaryResult {
    ok: boolean;
    message: string;
}

interface SendSummaryResponse {
    success?: boolean;
    message?: string;
    error?: string;
}

interface UseSendSummaryReturn {
    sending: boolean;
    sendSummary: () => Promise<SendSummaryResult | null>;
}

// Mensajes de respaldo por código HTTP, para cuando la respuesta no trae JSON
// (por ejemplo, un error de la plataforma) y no hay `error` del servidor.
const STATUS_MESSAGES: Record<number, string> = {
    403: 'Tu email no está verificado.',
    429: 'Ya enviaste un resumen hace poco. Esperá un minuto e intentá nuevamente.',
    503: 'El servicio no está disponible en este momento. Intentá nuevamente en unos minutos.',
};

// Solicita a la Vercel Function /api/send-summary el envío del resumen por email.
// El frontend solo envía el ID token de Firebase; las credenciales de AWS SES
// viven únicamente en el servidor.
export function useSendSummary(user: User | null): UseSendSummaryReturn {
    const [sending, setSending] = useState(false);
    // La ref bloquea envíos duplicados de forma síncrona, antes de que React
    // llegue a re-renderizar con `sending = true`.
    const inFlight = useRef(false);

    async function sendSummary(): Promise<SendSummaryResult | null> {
        if (!user || inFlight.current) {
            return null;
        }

        inFlight.current = true;
        setSending(true);

        try {
            const token = await user.getIdToken();

            const response = await fetch('/api/send-summary', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result: SendSummaryResponse = await response
                .json()
                .catch(() => ({}));

            if (!response.ok || result.success !== true) {
                return {
                    ok: false,
                    message:
                        result.error ||
                        STATUS_MESSAGES[response.status] ||
                        'No se pudo enviar el resumen.',
                };
            }

            return {
                ok: true,
                message: result.message || 'Resumen enviado correctamente.',
            };
        } catch (error) {
            console.error('Error al enviar el resumen:', error);

            return {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Error al enviar el resumen.',
            };
        } finally {
            inFlight.current = false;
            setSending(false);
        }
    }

    return { sending, sendSummary };
}
