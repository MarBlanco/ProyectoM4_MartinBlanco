import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTasks } from './useTasks';
import {
    createTask,
    deleteTask,
    setTaskCompleted,
    subscribeToUserTasks,
    updateTask,
} from '../services/taskService';
import type { Task } from '../types/Task';
import { deferred, makeTask } from '../test/utils';

// Firestore mockeado: se reemplaza el servicio completo.
vi.mock('../services/taskService', () => ({
    subscribeToUserTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    setTaskCompleted: vi.fn(),
}));

describe('useTasks', () => {
    let emitTasks: (tasks: Task[]) => void;
    let emitError: (error: Error) => void;
    const unsubscribe = vi.fn();

    beforeEach(() => {
        vi.mocked(subscribeToUserTasks).mockImplementation(
            (_userId, onTasks, onError) => {
                emitTasks = onTasks;
                emitError = onError;
                return unsubscribe;
            },
        );
    });

    it('sin usuario no se suscribe y no queda cargando', () => {
        const { result } = renderHook(() => useTasks(undefined));

        expect(subscribeToUserTasks).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.tasks).toEqual([]);
    });

    it('se suscribe a las tareas del usuario y las expone', () => {
        const { result } = renderHook(() => useTasks('user-1'));

        expect(subscribeToUserTasks).toHaveBeenCalledWith(
            'user-1',
            expect.any(Function),
            expect.any(Function),
        );
        expect(result.current.loading).toBe(true);

        const tasks = [makeTask()];
        act(() => emitTasks(tasks));

        expect(result.current.loading).toBe(false);
        expect(result.current.tasks).toEqual(tasks);
    });

    it('expone el error de la suscripción', () => {
        const { result } = renderHook(() => useTasks('user-1'));

        act(() => emitError(new Error('permission-denied')));

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('permission-denied');
    });

    it('cancela la suscripción al desmontar', () => {
        const { unmount } = renderHook(() => useTasks('user-1'));

        unmount();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('crea una tarea con el userId y marca el estado creating', async () => {
        const pending = deferred<string>();
        vi.mocked(createTask).mockReturnValue(pending.promise);

        const { result } = renderHook(() => useTasks('user-1'));

        let created!: Promise<boolean>;
        act(() => {
            created = result.current.createTask('Título', 'Detalle');
        });

        expect(result.current.creating).toBe(true);

        await act(async () => {
            pending.resolve('new-id');
            await created;
        });

        await expect(created).resolves.toBe(true);
        expect(createTask).toHaveBeenCalledWith({
            title: 'Título',
            description: 'Detalle',
            userId: 'user-1',
        });
        expect(result.current.creating).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('informa el error si la creación falla', async () => {
        vi.mocked(createTask).mockRejectedValue(new Error('fallo'));
        const { result } = renderHook(() => useTasks('user-1'));

        let created = true;
        await act(async () => {
            created = await result.current.createTask('Título', 'Detalle');
        });

        expect(created).toBe(false);
        expect(result.current.error).toBe(
            'No se pudo crear la tarea. Intentá nuevamente.',
        );
        expect(result.current.creating).toBe(false);
    });

    it('no crea tareas sin usuario', async () => {
        const { result } = renderHook(() => useTasks(undefined));

        let created = true;
        await act(async () => {
            created = await result.current.createTask('Título', 'Detalle');
        });

        expect(created).toBe(false);
        expect(createTask).not.toHaveBeenCalled();
        expect(result.current.error).toBe('Debés iniciar sesión para crear tareas.');
    });

    it('actualiza una tarea', async () => {
        vi.mocked(updateTask).mockResolvedValue();
        const { result } = renderHook(() => useTasks('user-1'));

        let updated = false;
        await act(async () => {
            updated = await result.current.updateTask('task-1', 'Nuevo', 'Desc');
        });

        expect(updated).toBe(true);
        expect(updateTask).toHaveBeenCalledWith('task-1', {
            title: 'Nuevo',
            description: 'Desc',
        });
        expect(result.current.updating).toBe(false);
    });

    it('informa el error si la actualización falla', async () => {
        vi.mocked(updateTask).mockRejectedValue(new Error('fallo'));
        const { result } = renderHook(() => useTasks('user-1'));

        await act(async () => {
            await result.current.updateTask('task-1', 'Nuevo', 'Desc');
        });

        expect(result.current.error).toBe(
            'No se pudo actualizar la tarea. Intentá nuevamente.',
        );
    });

    it('elimina una tarea', async () => {
        vi.mocked(deleteTask).mockResolvedValue();
        const { result } = renderHook(() => useTasks('user-1'));

        let deleted = false;
        await act(async () => {
            deleted = await result.current.deleteTask('task-1');
        });

        expect(deleted).toBe(true);
        expect(deleteTask).toHaveBeenCalledWith('task-1');
        expect(result.current.deleting).toBe(false);
    });

    it('informa el error si la eliminación falla', async () => {
        vi.mocked(deleteTask).mockRejectedValue(new Error('fallo'));
        const { result } = renderHook(() => useTasks('user-1'));

        await act(async () => {
            await result.current.deleteTask('task-1');
        });

        expect(result.current.error).toBe(
            'No se pudo eliminar la tarea. Intentá nuevamente.',
        );
    });

    it('marca una tarea como completada', async () => {
        vi.mocked(setTaskCompleted).mockResolvedValue();
        const { result } = renderHook(() => useTasks('user-1'));

        let toggled = false;
        await act(async () => {
            toggled = await result.current.toggleTaskCompleted('task-1', true);
        });

        expect(toggled).toBe(true);
        expect(setTaskCompleted).toHaveBeenCalledWith('task-1', true);
        await waitFor(() => expect(result.current.completing).toBe(false));
    });

    it('informa el error si no puede cambiar el estado', async () => {
        vi.mocked(setTaskCompleted).mockRejectedValue(new Error('fallo'));
        const { result } = renderHook(() => useTasks('user-1'));

        await act(async () => {
            await result.current.toggleTaskCompleted('task-1', true);
        });

        expect(result.current.error).toBe(
            'No se pudo actualizar el estado de la tarea.',
        );
    });
});
