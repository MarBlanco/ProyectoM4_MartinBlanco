import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import TasksPage from './TasksPage';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { renderWithProviders } from '../test/render';
import { makeTask } from '../test/utils';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useTasks', () => ({ useTasks: vi.fn() }));

beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'user-1', email: 'ana@example.com' } as unknown as User,
        loading: false,
        error: null,
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
    });
    vi.mocked(useTasks).mockReturnValue({
        tasks: [
            makeTask({ id: '1', title: 'Con fecha', dueDate: '2026-11-20' }),
            makeTask({ id: '2', title: 'Antigua sin fecha' }),
        ],
        loading: false,
        creating: false,
        updating: false,
        deleting: false,
        completing: false,
        error: null,
        createTask: vi.fn().mockResolvedValue(true),
        updateTask: vi.fn().mockResolvedValue(true),
        deleteTask: vi.fn().mockResolvedValue(true),
        toggleTaskCompleted: vi.fn().mockResolvedValue(true),
    });
});

describe('TasksPage: selector Lista | Calendario', () => {
    it('la lista es la vista por defecto y muestra también las tareas sin fecha', () => {
        renderWithProviders(<TasksPage />);

        expect(screen.getByRole('radio', { name: 'Lista' })).toBeChecked();
        expect(screen.getByText('Con fecha')).toBeInTheDocument();
        expect(screen.getByText('Antigua sin fecha')).toBeInTheDocument();
        expect(screen.getByText('Vence: 20/11/2026')).toBeInTheDocument();
    });

    it('en Calendario no aparecen las tareas sin fecha y se puede volver a la lista', async () => {
        const user = userEvent.setup();
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByText('Calendario'));

        expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeInTheDocument();
        expect(screen.queryByText('Antigua sin fecha')).not.toBeInTheDocument();

        await user.click(screen.getByText('Lista'));

        expect(screen.getByText('Antigua sin fecha')).toBeInTheDocument();
    });
});
