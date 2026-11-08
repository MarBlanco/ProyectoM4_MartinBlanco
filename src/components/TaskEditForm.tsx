
import { useState, type FormEvent } from 'react';
import type { Task } from '../types/Task';

interface TaskEditFormProps {
    task: Task;
    onSubmit: (
        taskId: string,
        title: string,
        description: string,
    ) => Promise<boolean>;
    onCancel: () => void;
    loading: boolean;
}

function TaskEditForm({
    task,
    onSubmit,
    onCancel,
    loading,
}: TaskEditFormProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!cleanTitle || !cleanDescription) {
            return;
        }

        const updated = await onSubmit(
            task.id,
            cleanTitle,
            cleanDescription,
        );

        if (updated) {
            onCancel();
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h3>Editar tarea</h3>

            <div>
                <label htmlFor={`edit-title-${task.id}`}>Título</label>
                <input
                    id={`edit-title-${task.id}`}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={100}
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor={`edit-description-${task.id}`}>
                    Descripción
                </label>
                <textarea
                    id={`edit-description-${task.id}`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    maxLength={1000}
                    disabled={loading}
                />
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <button type="button" onClick={onCancel} disabled={loading}>
                Cancelar
            </button>
        </form>
    );
}

export default TaskEditForm;
