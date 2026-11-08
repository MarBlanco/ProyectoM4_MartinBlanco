import { Navigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { user, loading, error, loginWithGoogle } = useAuth();

  if (loading) {
    return <p>Verificando autenticación...</p>;
  }

  if (user) {
    return <Navigate to="/tasks" replace />;
  }

  return (
    <main>
      <h1>Gestor de Tareas</h1>

      <section>
        <h2>Iniciar sesión</h2>

        <button onClick={() => void loginWithGoogle()}>
          Iniciar sesión con Google
        </button>

        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}

export default LoginPage;
