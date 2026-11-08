
import { useEffect, useState } from 'react';
import type { Task } from '../types/Task';
import {
    createTask as createTaskService,
    deleteTask as deleteTaskService,
    setTaskCompleted as setTaskCompletedService,
    subscribeToUserTasks,
    updateTask as updateTaskService,
} from '../services/taskService';

interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    completing: boolean;
    error: string | null;
    createTask: (title: string, description: string) => Promise<boolean>;
    updateTask: (
        taskId: string,
        title: string,
        description: string,
    ) => Promise<boolean>;
    deleteTask: (taskId: string) => Promise<boolean>;
    toggleTaskCompleted: (
        taskId: string,
        completed: boolean,
    ) => Promise<boolean>;
}

export function useTasks(userId: string | undefined): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [completing, setCompleting] = useState(false);
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
    ): Promise<boolean> {
        if (!userId) {
            setError('Debés iniciar sesión para crear tareas.');
            return false;
        }

        setCreating(true);
        setError(null);

        try {
            await createTaskService({
                title,
                description,
                userId,
            });

            return true;
        } catch {
            setError('No se pudo crear la tarea. Intentá nuevamente.');
            return false;
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

    async function toggleTaskCompleted(
        taskId: string,
        completed: boolean,
    ): Promise<boolean> {
        setCompleting(true);
        setError(null);

        try {
            await setTaskCompletedService(taskId, completed);
            return true;
        } catch {
            setError('No se pudo actualizar el estado de la tarea.');
            return false;
        } finally {
            setCompleting(false);
        }
    }

    return {
        tasks,
        loading,
        creating,
        updating,
        deleting,
        completing,
        error,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskCompleted,
    };
}
