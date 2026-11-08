
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import TaskForm from '../components/TaskForm';
import TaskEditForm from '../components/TaskEditForm';

export default function TasksPage() {
    const { user } = useAuth();

    const {
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
    } = useTasks(user?.uid);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    async function handleDelete(taskId: string) {
        const confirmed = window.confirm(
            '¿Estás seguro de que querés eliminar esta tarea?',
        );

        if (!confirmed) {
            return;
        }

        const deleted = await deleteTask(taskId);

        if (deleted && editingTaskId === taskId) {
            setEditingTaskId(null);
        }
    }

    async function handleToggleCompleted(
        taskId: string,
        completed: boolean,
    ) {
        await toggleTaskCompleted(taskId, !completed);
    }

    if (loading) {
        return <p>Cargando tareas...</p>;
    }

    return (
        <main>
            <h1>Mis tareas</h1>

            <p>Usuario: {user?.email}</p>

            <TaskForm
                onSubmit={createTask}
                loading={creating}
            />

            {error && <p role="alert">{error}</p>}

            <h2>Mis tareas</h2>

            {tasks.length === 0 ? (
                <p>Todavía no tenés tareas.</p>
            ) : (
                <ul>
                    {tasks.map((task) => (
                        <li key={task.id}>
                            {editingTaskId === task.id ? (
                                <TaskEditForm
                                    task={task}
                                    onSubmit={updateTask}
                                    onCancel={() => setEditingTaskId(null)}
                                    loading={updating}
                                />
                            ) : (
                                <>
                                    <h3>
                                        {task.title}
                                        {task.completed && ' (Completada)'}
                                    </h3>

                                    <p>{task.description}</p>

                                    <button
                                        type="button"
                                        onClick={() => setEditingTaskId(task.id)}
                                    >
                                        Editar
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => handleToggleCompleted(
                                    task.id,
                                    task.completed,
                                )}
                                disabled={completing}
                            >
                                {completing
                                    ? 'Actualizando...'
                                    : task.completed
                                        ? 'Marcar como pendiente'
                                        : 'Marcar como completada'}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDelete(task.id)}
                                disabled={deleting}
                            >
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
