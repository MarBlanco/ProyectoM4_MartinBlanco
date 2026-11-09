import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

import TasksPage from './TasksPage';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { renderWithProviders } from '../test/render';
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
        renderWithProviders(<TasksPage />);

        expect(screen.getByText('Cargando tareas...')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Mis tareas' })).not.toBeInTheDocument();
    });

    it('usa el uid del usuario autenticado', () => {
        mockTasks();
        renderWithProviders(<TasksPage />);

        expect(useTasks).toHaveBeenCalledWith('user-1');
        expect(screen.getByRole('heading', { name: 'Mis tareas', level: 1 })).toBeInTheDocument();
    });

    it('muestra el estado vacío', () => {
        mockTasks();
        renderWithProviders(<TasksPage />);

        expect(screen.getByText('Todavía no tenés tareas.')).toBeInTheDocument();
    });

    it('lista las tareas con su estado', () => {
        mockTasks({
            tasks: [
                makeTask({ id: '1', title: 'Pendiente A' }),
                makeTask({ id: '2', title: 'Hecha B', completed: true }),
            ],
        });
        renderWithProviders(<TasksPage />);

        expect(screen.getByRole('heading', { name: 'Pendiente A' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Hecha B' })).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
        expect(screen.getByText('Completada')).toBeInTheDocument();
    });

    it('calcula el resumen de tareas (total, pendientes y completadas)', () => {
        mockTasks({
            tasks: [
                makeTask({ id: '1' }),
                makeTask({ id: '2' }),
                makeTask({ id: '3', completed: true }),
            ],
        });
        renderWithProviders(<TasksPage />);

        expect(screen.getByTestId('stat-Total')).toHaveTextContent('3');
        expect(screen.getByTestId('stat-Pendientes')).toHaveTextContent('2');
        expect(screen.getByTestId('stat-Completadas')).toHaveTextContent('1');
    });

    it('crea una tarea desde el formulario y avisa con una notificación', async () => {
        const user = userEvent.setup();
        const state = mockTasks();
        renderWithProviders(<TasksPage />);

        await user.type(screen.getByLabelText(/^Título/), 'Nueva');
        await user.type(screen.getByLabelText(/^Descripción/), 'Detalle');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(state.createTask).toHaveBeenCalledWith('Nueva', 'Detalle');
        expect(await screen.findByText('La tarea se creó correctamente.')).toBeInTheDocument();
    });

    it('no avisa éxito si la creación falla', async () => {
        const user = userEvent.setup();
        mockTasks({ createTask: vi.fn().mockResolvedValue(false) });
        renderWithProviders(<TasksPage />);

        await user.type(screen.getByLabelText(/^Título/), 'Nueva');
        await user.type(screen.getByLabelText(/^Descripción/), 'Detalle');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        await waitFor(() => expect(screen.getByRole('button', { name: 'Crear tarea' })).toBeEnabled());
        expect(screen.queryByText('La tarea se creó correctamente.')).not.toBeInTheDocument();
    });

    it('edita una tarea en un modal y lo cierra al guardar', async () => {
        const user = userEvent.setup();
        const state = mockTasks({ tasks: [makeTask({ id: '1', title: 'Original' })] });
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Editar: Original' }));

        const dialog = await screen.findByRole('dialog', { name: 'Editar tarea' });
        const title = within(dialog).getByLabelText(/^Título/);
        await user.clear(title);
        await user.type(title, 'Editada');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

        expect(state.updateTask).toHaveBeenCalledWith(
            '1',
            'Editada',
            'En la panadería de la esquina',
        );
        await waitFor(() =>
            expect(screen.queryByRole('dialog', { name: 'Editar tarea' })).not.toBeInTheDocument(),
        );
        expect(await screen.findByText('La tarea se actualizó correctamente.')).toBeInTheDocument();
    });

    it('no permite cerrar el modal de edición mientras se está guardando', async () => {
        const user = userEvent.setup();
        mockTasks({ tasks: [makeTask({ id: '1', title: 'Original' })], updating: true });
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Editar: Original' }));

        const dialog = await screen.findByRole('dialog', { name: 'Editar tarea' });
        expect(within(dialog).queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: 'Guardando...' })).toBeDisabled();

        await user.keyboard('{Escape}');

        expect(screen.getByRole('dialog', { name: 'Editar tarea' })).toBeInTheDocument();
    });

    it('cierra el modal de edición sin guardar al cancelar', async () => {
        const user = userEvent.setup();
        const state = mockTasks({ tasks: [makeTask({ id: '1', title: 'Original' })] });
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Editar: Original' }));
        const dialog = await screen.findByRole('dialog', { name: 'Editar tarea' });
        await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

        await waitFor(() =>
            expect(screen.queryByRole('dialog', { name: 'Editar tarea' })).not.toBeInTheDocument(),
        );
        expect(state.updateTask).not.toHaveBeenCalled();
    });

    it('elimina una tarea tras confirmar en el modal', async () => {
        const user = userEvent.setup();
        const state = mockTasks({ tasks: [makeTask({ id: '1', title: 'Borrar' })] });
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Eliminar: Borrar' }));

        const dialog = await screen.findByRole('dialog', { name: 'Eliminar tarea' });
        expect(within(dialog).getByText(/¿Estás seguro de que querés eliminar la tarea «Borrar»\?/)).toBeInTheDocument();
        expect(state.deleteTask).not.toHaveBeenCalled();

        await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

        await waitFor(() => expect(state.deleteTask).toHaveBeenCalledWith('1'));
        expect(await screen.findByText('La tarea se eliminó correctamente.')).toBeInTheDocument();
    });

    it('no elimina si se cancela la confirmación', async () => {
        const user = userEvent.setup();
        const state = mockTasks({ tasks: [makeTask({ id: '1', title: 'Borrar' })] });
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Eliminar: Borrar' }));
        const dialog = await screen.findByRole('dialog', { name: 'Eliminar tarea' });
        await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

        await waitFor(() =>
            expect(screen.queryByRole('dialog', { name: 'Eliminar tarea' })).not.toBeInTheDocument(),
        );
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
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Marcar como completada: A' }));
        await user.click(screen.getByRole('button', { name: 'Marcar como pendiente: B' }));

        expect(state.toggleTaskCompleted).toHaveBeenNthCalledWith(1, '1', true);
        expect(state.toggleTaskCompleted).toHaveBeenNthCalledWith(2, '2', false);
        expect(await screen.findByText('La tarea se marcó como completada.')).toBeInTheDocument();
    });

    it('muestra el estado de carga al crear', () => {
        mockTasks({ creating: true });
        renderWithProviders(<TasksPage />);

        expect(screen.getByRole('button', { name: 'Creando...' })).toBeDisabled();
    });

    it('bloquea las acciones de las tareas mientras hay una operación en curso', () => {
        mockTasks({
            tasks: [makeTask({ id: '1', title: 'A' })],
            deleting: true,
        });
        renderWithProviders(<TasksPage />);

        expect(screen.getByRole('button', { name: 'Editar: A' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Eliminar: A' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Marcar como completada: A' })).toBeDisabled();
    });

    it('muestra el error del CRUD', () => {
        mockTasks({ error: 'No se pudo crear la tarea. Intentá nuevamente.' });
        renderWithProviders(<TasksPage />);

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
        renderWithProviders(<TasksPage />);

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

        expect(await screen.findByText('Resumen enviado correctamente.')).toBeInTheDocument();
        expect(screen.getByText('Resumen enviado')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar resumen por email' })).toBeEnabled();
    });

    it('muestra el error que devuelve el backend', async () => {
        const user = userEvent.setup();
        fetchMock.mockResolvedValue(jsonResponse(
            { error: 'Sesión inválida o expirada. Volvé a iniciar sesión.' },
            401,
        ));
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        expect(
            await screen.findByText('Sesión inválida o expirada. Volvé a iniciar sesión.'),
        ).toBeInTheDocument();
        expect(screen.getByText('No se pudo enviar el resumen')).toBeInTheDocument();
        expect(screen.queryByText('Resumen enviado')).not.toBeInTheDocument();
    });

    it('muestra un error genérico si la respuesta no es JSON', async () => {
        const user = userEvent.setup();
        fetchMock.mockResolvedValue(new Response('<html></html>', { status: 404 }));
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        expect(await screen.findByText('No se pudo enviar el resumen.')).toBeInTheDocument();
    });

    it('muestra el error de red y permite reintentar', async () => {
        const user = userEvent.setup();
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        renderWithProviders(<TasksPage />);

        await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }));

        expect(await screen.findByText('Failed to fetch')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar resumen por email' })).toBeEnabled();
    });

    it('evita envíos duplicados mientras hay uno en curso', async () => {
        const pending = deferred<Response>();
        fetchMock.mockReturnValue(pending.promise);
        renderWithProviders(<TasksPage />);

        const button = screen.getByRole('button', { name: 'Enviar resumen por email' });
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(getIdToken).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        pending.resolve(jsonResponse({ success: true, message: 'ok' }));
        expect(await screen.findByText('ok')).toBeInTheDocument();
    });
});
