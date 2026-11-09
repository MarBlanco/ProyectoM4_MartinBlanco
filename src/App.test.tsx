import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import App from './App';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import type { AuthContextType } from './contexts/AuthContext';
import { renderWithProviders } from './test/render';

vi.mock('./hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('./hooks/useTasks', () => ({ useTasks: vi.fn() }));

function mockAuth(overrides: Partial<AuthContextType> = {}) {
    const auth: AuthContextType = {
        user: null,
        loading: false,
        error: null,
        loginWithGoogle: vi.fn(),
        logout: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
    vi.mocked(useAuth).mockReturnValue(auth);
    return auth;
}

function renderAt(path: string) {
    return renderWithProviders(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    );
}

const loggedUser = { uid: 'user-1', email: 'ana@example.com' } as User;

describe('Rutas', () => {
    beforeEach(() => {
        vi.mocked(useTasks).mockReturnValue({
            tasks: [],
            loading: false,
            creating: false,
            updating: false,
            deleting: false,
            completing: false,
            error: null,
            createTask: vi.fn(),
            updateTask: vi.fn(),
            deleteTask: vi.fn(),
            toggleTaskCompleted: vi.fn(),
        });
    });

    it('la ruta privada muestra la verificación mientras carga la sesión', () => {
        mockAuth({ loading: true });
        renderAt('/tasks');

        expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Mis tareas' })).not.toBeInTheDocument();
    });

    it('sin sesión, / redirige al login', () => {
        mockAuth();
        renderAt('/');

        expect(screen.getByRole('heading', { name: 'Gestor de Tareas', level: 1 })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Mis tareas', level: 1 })).not.toBeInTheDocument();
    });

    it('sin sesión, /tasks redirige al login y no muestra las tareas', () => {
        mockAuth();
        renderAt('/tasks');

        expect(screen.getByRole('button', { name: 'Iniciar sesión con Google' })).toBeInTheDocument();
        expect(screen.queryByText('Todavía no tenés tareas.')).not.toBeInTheDocument();
    });

    it('con sesión, /tasks muestra las tareas dentro del layout', () => {
        mockAuth({ user: loggedUser });
        renderAt('/tasks');

        expect(screen.getByRole('heading', { name: 'Mis tareas', level: 1 })).toBeInTheDocument();
        expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    });

    it('con sesión, el botón de la barra cierra la sesión', async () => {
        const user = userEvent.setup();
        const auth = mockAuth({ user: loggedUser });
        renderAt('/tasks');

        await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

        expect(auth.logout).toHaveBeenCalledTimes(1);
    });

    it('con sesión, /login redirige a /tasks', () => {
        mockAuth({ user: loggedUser });
        renderAt('/login');

        expect(screen.getByRole('heading', { name: 'Mis tareas', level: 1 })).toBeInTheDocument();
    });

    it('una ruta inexistente muestra la página 404', () => {
        mockAuth();
        renderAt('/no-existe');

        expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ir a mis tareas' })).toHaveAttribute('href', '/tasks');
    });
});
