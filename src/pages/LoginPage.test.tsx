import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import LoginPage from './LoginPage';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextType } from '../contexts/AuthContext';
import { renderWithProviders } from '../test/render';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));

function renderLogin(overrides: Partial<AuthContextType> = {}) {
    const auth: AuthContextType = {
        user: null,
        loading: false,
        error: null,
        loginWithGoogle: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn(),
        ...overrides,
    };
    vi.mocked(useAuth).mockReturnValue(auth);

    renderWithProviders(
        <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
        </MemoryRouter>,
    );

    return auth;
}

describe('LoginPage', () => {
    it('muestra el título y la opción de iniciar sesión', () => {
        renderLogin();

        expect(screen.getByRole('heading', { name: 'Gestor de Tareas', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });

    it('inicia sesión con Google al hacer click', async () => {
        const user = userEvent.setup();
        const auth = renderLogin();

        await user.click(screen.getByRole('button', { name: 'Iniciar sesión con Google' }));

        expect(auth.loginWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('muestra el error de autenticación', () => {
        renderLogin({ error: 'Cerraste la ventana de inicio de sesión.' });

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Cerraste la ventana de inicio de sesión.',
        );
    });

    it('no muestra ningún error cuando no lo hay', () => {
        renderLogin();

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('muestra la verificación mientras carga la sesión', () => {
        renderLogin({ loading: true });

        expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('redirige a /tasks si ya hay sesión', () => {
        renderLogin({ user: { uid: 'user-1' } as User });

        expect(screen.queryByRole('button', { name: 'Iniciar sesión con Google' })).not.toBeInTheDocument();
    });
});
