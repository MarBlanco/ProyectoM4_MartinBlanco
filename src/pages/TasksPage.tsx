import { useAuth } from '../hooks/useAuth';

function TasksPage() {
  const { user, logout, error } = useAuth();

  return (
    <main>
      <h1>Mis tareas</h1>

      <p>Panel de tareas en construcción.</p>

      <p>Email: {user?.email ?? 'No disponible'}</p>

      <button onClick={() => void logout()}>
        Cerrar sesión
      </button>

      {error && <p role="alert">{error}</p>}
    </main>
  );
}

export default TasksPage;
