
import { useState, type FormEvent } from 'react';

interface TaskFormProps {
    onSubmit: (title: string, description: string) => Promise<boolean>;
    loading: boolean;
}

function TaskForm({ onSubmit, loading }: TaskFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!cleanTitle || !cleanDescription) {
            return;
        }

        const created = await onSubmit(cleanTitle, cleanDescription);

        if (created) {
            setTitle('');
            setDescription('');
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Nueva tarea</h2>

            <div>
                <label htmlFor="task-title">Título</label>
                <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Título de la tarea"
                    required
                    maxLength={100}
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="task-description">Descripción</label>
                <textarea
                    id="task-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Descripción de la tarea"
                    required
                    maxLength={1000}
                    disabled={loading}
                />
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear tarea'}
            </button>
        </form>
    );
}

export default TaskForm;
