import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main>
      <h1>Página no encontrada</h1>

      <p>La dirección que buscás no existe.</p>

      <Link to="/tasks">Ir a mis tareas</Link>
    </main>
  );
}

export default NotFoundPage;
