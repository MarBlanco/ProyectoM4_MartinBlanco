
import { useEffect, useState } from 'react';
import type { Task } from '../types/Task';
import { subscribeToUserTasks } from '../services/taskService';

interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    error: string | null;
}

export function useTasks(userId: string | undefined): UseTasksReturn {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
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

    return { tasks, loading, error };
}
