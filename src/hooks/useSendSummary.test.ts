import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import { useSendSummary } from './useSendSummary';
import { deferred } from '../test/utils';

const getIdToken = vi.fn();
const fetchMock = vi.fn();
const user = { uid: 'user-1', getIdToken } as unknown as User;

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('useSendSummary', () => {
    beforeEach(() => {
        getIdToken.mockResolvedValue('test-token');
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('no hace nada sin usuario', async () => {
        const { result } = renderHook(() => useSendSummary(null));

        let outcome: unknown = 'sin-llamar';
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(outcome).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('envía el token como Bearer y devuelve el mensaje del backend', async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({ success: true, message: 'Resumen enviado correctamente.' }),
        );
        const { result } = renderHook(() => useSendSummary(user));

        let outcome: unknown;
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(fetchMock).toHaveBeenCalledWith('/api/send-summary', {
            method: 'POST',
            headers: { Authorization: 'Bearer test-token' },
        });
        expect(outcome).toEqual({ ok: true, message: 'Resumen enviado correctamente.' });
        expect(result.current.sending).toBe(false);
    });

    it('marca sending mientras la petición está en curso', async () => {
        const pending = deferred<Response>();
        fetchMock.mockReturnValue(pending.promise);
        const { result } = renderHook(() => useSendSummary(user));

        let request!: Promise<unknown>;
        act(() => {
            request = result.current.sendSummary();
        });

        await vi.waitFor(() => expect(result.current.sending).toBe(true));

        await act(async () => {
            pending.resolve(jsonResponse({ success: true }));
            await request;
        });

        expect(result.current.sending).toBe(false);
    });

    it('bloquea un segundo envío simultáneo', async () => {
        const pending = deferred<Response>();
        fetchMock.mockReturnValue(pending.promise);
        const { result } = renderHook(() => useSendSummary(user));

        let first!: Promise<unknown>;
        let second: unknown = 'sin-llamar';
        await act(async () => {
            first = result.current.sendSummary();
            second = await result.current.sendSummary();
            pending.resolve(jsonResponse({ success: true }));
            await first;
        });

        expect(second).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getIdToken).toHaveBeenCalledTimes(1);
    });

    it('permite volver a enviar una vez terminado el envío anterior', async () => {
        fetchMock.mockImplementation(() =>
            Promise.resolve(jsonResponse({ success: true })),
        );
        const { result } = renderHook(() => useSendSummary(user));

        await act(async () => {
            await result.current.sendSummary();
        });
        await act(async () => {
            await result.current.sendSummary();
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('devuelve el error del backend', async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({ error: 'Sesión inválida o expirada. Volvé a iniciar sesión.' }, 401),
        );
        const { result } = renderHook(() => useSendSummary(user));

        let outcome: unknown;
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(outcome).toEqual({
            ok: false,
            message: 'Sesión inválida o expirada. Volvé a iniciar sesión.',
        });
    });

    it('usa un mensaje genérico si la respuesta no es JSON', async () => {
        fetchMock.mockResolvedValue(new Response('<html></html>', { status: 404 }));
        const { result } = renderHook(() => useSendSummary(user));

        let outcome: unknown;
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(outcome).toEqual({ ok: false, message: 'No se pudo enviar el resumen.' });
    });

    it('no informa éxito si un 200 no trae la confirmación del backend', async () => {
        fetchMock.mockResolvedValue(new Response('<html></html>', { status: 200 }));
        const { result } = renderHook(() => useSendSummary(user));

        let outcome: unknown;
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(outcome).toEqual({ ok: false, message: 'No se pudo enviar el resumen.' });
    });

    it.each([
        [403, 'Tu email no está verificado.'],
        [429, 'Ya enviaste un resumen hace poco. Esperá un minuto e intentá nuevamente.'],
        [503, 'El servicio no está disponible en este momento. Intentá nuevamente en unos minutos.'],
    ])('usa un mensaje específico para el estado %i si la respuesta no es JSON', async (status, message) => {
        fetchMock.mockResolvedValue(new Response('<html></html>', { status }));
        const { result } = renderHook(() => useSendSummary(user));

        let outcome: unknown;
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(outcome).toEqual({ ok: false, message });
    });

    it('prioriza el mensaje del servidor sobre el de respaldo', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ error: 'Mensaje del servidor.' }, 429));
        const { result } = renderHook(() => useSendSummary(user));

        let outcome: unknown;
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(outcome).toEqual({ ok: false, message: 'Mensaje del servidor.' });
    });

    it('devuelve el error de red', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        const { result } = renderHook(() => useSendSummary(user));

        let outcome: unknown;
        await act(async () => {
            outcome = await result.current.sendSummary();
        });

        expect(outcome).toEqual({ ok: false, message: 'Failed to fetch' });
        expect(result.current.sending).toBe(false);
    });
});
