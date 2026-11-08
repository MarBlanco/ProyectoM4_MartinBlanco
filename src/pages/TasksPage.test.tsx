import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import TasksPage from './TasksPage';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { deferred, makeTask } from '../test/utils';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useTasks', () => ({ useTasks: vi.fn() }));

type TasksState = ReturnType<typeof useTasks>;

const getIdToken = vi.fn();
const fetchMock = vi.fn();

function mockTasks(overrides: Partial<TasksState> = {}): TasksState {
    const state: TasksState = {
        tasks: [],
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
        ...overrides,
    };
    vi.mocked(useTasks).mockReturnValue(state);
    return state;
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

beforeEach(() => {
    getIdToken.mockResolvedValue('test-token');
    vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'user-1', email: 'ana@example.com', getIdToken } as unknown as User,
        loading: false,
        error: null,
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
    });
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('TasksPage - CRUD', () => {
    it('muestra la carga inicial', () => {
        mockTasks({ loading: true });
        render(<TasksPage />);

        expect(screen.getByText('Cargando tareas...')).toBeInTheDocument();
    });

    it('usa el uid del usuario autenticado', () => {
        mockTasks();
        render(<TasksPage />);

        expect(useTasks).toHaveBeenCalledWith('user-1');
        expect(screen.getByText('Usuario: ana@example.com')).toBeInTheDocument();
    });

    it('muestra el estado vacío', () => {
        mockTasks();
        render(<TasksPage />);

        expect(screen.getByText('Todavía no tenés tareas.')).toBeInTheDocument();
    });

    it('lista las tareas e indica las completadas', () => {
        mockTasks({
            tasks: [
                makeTask({ id: '1', title: 'Pendiente' }),
                makeTask({ id: '2', title: 'Hecha', completed: true }),
            ],
        });
        render(<TasksPage />);

        expect(screen.getByRole('heading', { name: 'Pendiente' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Hecha (Completada)' })).toBeInTheDocument();
    });

    it('crea una tarea desde el formulario', async () => {
        const user = userEvent.setup();
        const state = mockTasks();
        render(<TasksPage />);

        await user.type(screen.getByLabelText('Título'), 'Nueva');
        await user.type(screen.getByLabelText('Descripción'), 'Detalle');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(state.createTask).toHaveBeenCalledWith('Nueva', 'Detalle');
    });

    it('edita una tarea y cierra el formulario de edición', async () => {
        const user = userEvent.setup();
        const state = mockTasks({ tasks: [makeTask({ id: '1' })] });
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Editar' }));

        const form = screen
            .getByRole('heading', { name: 'Editar tarea' })
            .closest('form') as HTMLFormElement;
        const title = within(form).getByLabelText('Título');
        await user.clear(title);
        await user.type(title, 'Editada');
        await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }));

        expect(state.updateTask).toHaveBeenCalledWith(
            '1',
            'Editada',
            'En la panadería de la esquina',
        );
        expect(screen.queryByRole('heading', { name: 'Editar tarea' })).not.toBeInTheDocument();
    });

    it('elimina una tarea tras confirmar', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const state = mockTasks({ tasks: [makeTask({ id: '1' })] });
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        expect(state.deleteTask).toHaveBeenCalledWith('1');
    });

    it('no elimina si se cancela la confirmación', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const state = mockTasks({ tasks: [makeTask({ id: '1' })] });
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        expect(state.deleteTask).not.toHaveBeenCalled();
    });

    it('alterna el estado completado', async () => {
        const user = userEvent.setup();
        const state = mockTasks({
            tasks: [
                makeTask({ id: '1', title: 'A' }),
                makeTask({ id: '2', title: 'B', completed: true }),
            ],
        });
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Marcar como completada' }));
        await user.click(screen.getByRole('button', { name: 'Marcar como pendiente' }));

        expect(state.toggleTaskCompleted).toHaveBeenNthCalledWith(1, '1', true);
        expect(state.toggleTaskCompleted).toHaveBeenNthCalledWith(2, '2', false);
    });

    it('muestra los estados de carga de las operaciones', () => {
        mockTasks({
            tasks: [makeTask({ id: '1' })],
            creating: true,
            deleting: true,
            completing: true,
        });
        render(<TasksPage />);

        expect(screen.getByRole('button', { name: 'Creando...' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Actualizando...' })).toBeDisabled();
    });

    it('muestra el error del CRUD', () => {
        mockTasks({ error: 'No se pudo crear la tarea. Intentá nuevamente.' });
        render(<TasksPage />);

        expect(screen.getByRole('alert')).toHaveTextContent(
            'No se pudo crear la tarea. Intentá nuevamente.',
        );
    });
});

describe('TasksPage - envío del resumen por email', () => {
    beforeEach(() => {
        mockTasks();
    });

    it('envía el token como Bearer, muestra la carga y luego el éxito', async () => {
        const user = userEvent.setup();
        const pending = deferred<Response>();
        fetchMock.mockReturnValue(pending.promise);
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        const loadingButton = await screen.findByRole('button', { name: 'Enviando resumen...' });
        expect(loadingButton).toBeDisabled();
        expect(fetchMock).toHaveBeenCalledWith('/api/send-summary', {
            method: 'POST',
            headers: { Authorization: 'Bearer test-token' },
        });

        pending.resolve(jsonResponse({
            success: true,
            message: 'Resumen enviado correctamente.',
        }));

        expect(await screen.findByRole('status')).toHaveTextContent(
            'Resumen enviado correctamente.',
        );
        expect(screen.getByRole('button', { name: 'Enviar resumen por email' })).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('muestra el error que devuelve el backend', async () => {
        const user = userEvent.setup();
        fetchMock.mockResolvedValue(jsonResponse(
            { error: 'Sesión inválida o expirada. Volvé a iniciar sesión.' },
            401,
        ));
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Sesión inválida o expirada. Volvé a iniciar sesión.',
        );
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('muestra un error genérico si la respuesta no es JSON', async () => {
        const user = userEvent.setup();
        fetchMock.mockResolvedValue(new Response('<html></html>', { status: 404 }));
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No se pudo enviar el resumen.',
        );
    });

    it('no informa éxito si un 200 no trae la confirmación del backend', async () => {
        const user = userEvent.setup();
        fetchMock.mockResolvedValue(new Response('<html></html>', { status: 200 }));
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No se pudo enviar el resumen.',
        );
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('muestra el error de red', async () => {
        const user = userEvent.setup();
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        render(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Failed to fetch');
        expect(screen.getByRole('button', { name: 'Enviar resumen por email' })).toBeEnabled();
    });

    it('evita envíos duplicados mientras hay uno en curso', async () => {
        const pending = deferred<Response>();
        fetchMock.mockReturnValue(pending.promise);
        render(<TasksPage />);

        const button = screen.getByRole('button', { name: 'Enviar resumen por email' });
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(getIdToken).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        pending.resolve(jsonResponse({ success: true, message: 'ok' }));
        expect(await screen.findByRole('status')).toHaveTextContent('ok');
    });
});
