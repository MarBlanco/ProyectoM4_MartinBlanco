
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';

export default function TasksPage() {
    const { user } = useAuth();
    const { tasks, loading, error } = useTasks(user?.uid);

    if (loading) {
        return <p>Cargando tareas...</p>;
    }

    if (error) {
        return <p>Error al cargar las tareas: {error}</p>;
    }

    return (
        <main>
            <h1>Mis tareas</h1>

            <p>Usuario: {user?.email}</p>

            {tasks.length === 0 ? (
                <p>Todavía no tenés tareas.</p>
            ) : (
                <ul>
                    {tasks.map((task) => (
                        <li key={task.id}>
                            <h2>{task.title}</h2>
                            <p>{task.description}</p>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
