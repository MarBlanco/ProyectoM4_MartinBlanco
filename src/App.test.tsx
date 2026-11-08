import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import App from './App';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import type { AuthContextType } from './contexts/AuthContext';

vi.mock('./hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('./hooks/useTasks', () => ({ useTasks: vi.fn() }));

function mockAuth(overrides: Partial<AuthContextType> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: null,
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
        ...overrides,
    });
}

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    );
}

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
    });

    it('sin sesión, / y /tasks redirigen al login', () => {
        mockAuth();
        renderAt('/');

        expect(screen.getByRole('heading', { name: 'Gestor de Tareas' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Mis tareas', level: 1 })).not.toBeInTheDocument();
    });

    it('con sesión, /tasks muestra las tareas', () => {
        mockAuth({ user: { uid: 'user-1', email: 'ana@example.com' } as User });
        renderAt('/tasks');

        expect(screen.getByRole('heading', { name: 'Mis tareas', level: 1 })).toBeInTheDocument();
    });

    it('con sesión, /login redirige a /tasks', () => {
        mockAuth({ user: { uid: 'user-1', email: 'ana@example.com' } as User });
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
