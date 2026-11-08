import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';

const firebaseAuth = vi.hoisted(() => ({
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
}));

// Firebase Auth mockeado: sin red ni credenciales reales.
vi.mock('firebase/auth', () => ({
    GoogleAuthProvider: class GoogleAuthProvider {},
    ...firebaseAuth,
}));

vi.mock('../services/firebase', () => ({
    auth: { name: 'auth-mock' },
}));

function Consumer() {
    const { user, loading, error, loginWithGoogle, logout } = useAuth();

    return (
        <div>
            <p>
                {loading
                    ? 'cargando'
                    : user
                        ? `usuario: ${user.email}`
                        : 'sin usuario'}
            </p>
            {error && <p role="alert">{error}</p>}
            <button onClick={() => void loginWithGoogle()}>login</button>
            <button onClick={() => void logout()}>logout</button>
        </div>
    );
}

describe('AuthProvider', () => {
    let emitUser: (user: User | null) => void;
    let emitAuthError: (error: Error) => void;
    const unsubscribe = vi.fn();

    beforeEach(() => {
        firebaseAuth.onAuthStateChanged.mockImplementation(
            (_auth, next, onError) => {
                emitUser = next;
                emitAuthError = onError;
                return unsubscribe;
            },
        );
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('arranca cargando y luego expone el usuario autenticado', () => {
        render(<AuthProvider><Consumer /></AuthProvider>);

        expect(screen.getByText('cargando')).toBeInTheDocument();

        act(() => emitUser({ email: 'ana@example.com' } as User));

        expect(screen.getByText('usuario: ana@example.com')).toBeInTheDocument();
    });

    it('expone que no hay sesión', () => {
        render(<AuthProvider><Consumer /></AuthProvider>);

        act(() => emitUser(null));

        expect(screen.getByText('sin usuario')).toBeInTheDocument();
    });

    it('informa si no puede verificar la sesión', () => {
        render(<AuthProvider><Consumer /></AuthProvider>);

        act(() => emitAuthError(new Error('network')));

        expect(screen.getByRole('alert')).toHaveTextContent(
            'No se pudo verificar tu sesión.',
        );
    });

    it('inicia sesión con Google mediante popup', async () => {
        const user = userEvent.setup();
        firebaseAuth.signInWithPopup.mockResolvedValue({});

        render(<AuthProvider><Consumer /></AuthProvider>);
        await user.click(screen.getByRole('button', { name: 'login' }));

        expect(firebaseAuth.signInWithPopup).toHaveBeenCalledWith(
            { name: 'auth-mock' },
            expect.any(Object),
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('traduce el error de popup cerrado', async () => {
        const user = userEvent.setup();
        firebaseAuth.signInWithPopup.mockRejectedValue(
            Object.assign(new Error('closed'), {
                code: 'auth/popup-closed-by-user',
            }),
        );

        render(<AuthProvider><Consumer /></AuthProvider>);
        await user.click(screen.getByRole('button', { name: 'login' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Cerraste la ventana de inicio de sesión.',
        );
    });

    it('cierra sesión', async () => {
        const user = userEvent.setup();
        firebaseAuth.signOut.mockResolvedValue(undefined);

        render(<AuthProvider><Consumer /></AuthProvider>);
        await user.click(screen.getByRole('button', { name: 'logout' }));

        expect(firebaseAuth.signOut).toHaveBeenCalledWith({ name: 'auth-mock' });
    });

    it('informa si no puede cerrar sesión', async () => {
        const user = userEvent.setup();
        firebaseAuth.signOut.mockRejectedValue(new Error('fallo'));

        render(<AuthProvider><Consumer /></AuthProvider>);
        await user.click(screen.getByRole('button', { name: 'logout' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No se pudo cerrar la sesión. Intentá nuevamente.',
        );
    });

    it('cancela la suscripción de Auth al desmontar', () => {
        const { unmount } = render(<AuthProvider><Consumer /></AuthProvider>);

        unmount();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('useAuth falla fuera de un AuthProvider', () => {
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth debe usarse dentro de un AuthProvider',
        );
    });
});
