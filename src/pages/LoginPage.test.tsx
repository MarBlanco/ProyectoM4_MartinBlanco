import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import LoginPage from './LoginPage';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextType } from '../contexts/AuthContext';

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

    render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>,
    );

    return auth;
}

describe('LoginPage', () => {
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

    it('muestra la verificación mientras carga la sesión', () => {
        renderLogin({ loading: true });

        expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
