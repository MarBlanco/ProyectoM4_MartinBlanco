
import { useEffect, useState } from 'react';
import type { Task } from '../types/Task';
import {
    createTask as createTaskService,
    deleteTask as deleteTaskService,
    subscribeToUserTasks,
    updateTask as updateTaskService,
} from '../services/taskService';

interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    error: string | null;
    createTask: (title: string, description: string) => Promise<void>;
    updateTask: (
        taskId: string,
        title: string,
        description: string,
    ) => Promise<boolean>;
    deleteTask: (taskId: string) => Promise<boolean>;
}

export function useTasks(userId: string | undefined): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToUserTasks(
            userId,
            (updatedTasks) => {
                setTasks(updatedTasks);
                setLoading(false);
            },
            (error) => {
                setError(error.message);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [userId]);

    async function createTask(
        title: string,
        description: string,
    ): Promise<void> {
        if (!userId) {
            setError('Debés iniciar sesión para crear tareas.');
            return;
        }

        setCreating(true);
        setError(null);

        try {
            await createTaskService({
                title,
                description,
                userId,
            });
        } catch {
            setError('No se pudo crear la tarea. Intentá nuevamente.');
        } finally {
            setCreating(false);
        }
    }

    async function updateTask(
        taskId: string,
        title: string,
        description: string,
    ): Promise<boolean> {
        setUpdating(true);
        setError(null);

        try {
            await updateTaskService(taskId, {
                title,
                description,
            });

            return true;
        } catch {
            setError('No se pudo actualizar la tarea. Intentá nuevamente.');
            return false;
        } finally {
            setUpdating(false);
        }
    }

    async function deleteTask(taskId: string): Promise<boolean> {
        setDeleting(true);
        setError(null);

        try {
            await deleteTaskService(taskId);
            return true;
        } catch {
            setError('No se pudo eliminar la tarea. Intentá nuevamente.');
            return false;
        } finally {
            setDeleting(false);
        }
    }

    return {
        tasks,
        loading,
        creating,
        updating,
        deleting,
        error,
        createTask,
        updateTask,
        deleteTask,
    };
}
