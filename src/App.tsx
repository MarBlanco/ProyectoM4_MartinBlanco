import { useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

import { db } from './services/firebase';
import { AuthContext } from './contexts/AuthContext';

function LoginPage() {
  const { user, loading, error, loginWithGoogle, logout } =
    useContext(AuthContext);

  const [resultado, setResultado] = useState(
    'Conectando con Firebase...',
  );

  useEffect(() => {
    async function probarConexion() {
      try {
        const referencia = doc(db, 'prueba', 'conexion');
        await getDoc(referencia);

        setResultado('Conexión con Firestore exitosa');
      } catch (error) {
        console.error(error);
        setResultado('Error al conectar con Firestore');
      }
    }

    probarConexion();
  }, []);

  return (
    <main>
      <h1>Gestor de Tareas</h1>

      <section>
        <h2>Autenticación</h2>

        {loading ? (
          <p>Verificando autenticación...</p>
        ) : user ? (
          <div>
            <p>Usuario autenticado</p>
            <p>Email: {user.email ?? 'No disponible'}</p>

            <button onClick={() => void logout()}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div>
            <p>Sin sesión iniciada</p>

            <button onClick={() => void loginWithGoogle()}>
              Iniciar sesión con Google
            </button>
          </div>
        )}

        {error && <p role="alert">{error}</p>}
      </section>

      <section>
        <h2>Firestore</h2>
        <p>{resultado}</p>
      </section>
    </main>
  );
}

function TasksPage() {
  return (
    <main>
      <h1>Mis tareas</h1>
      <p>Panel de tareas en construcción.</p>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tasks" element={<TasksPage />} />
    </Routes>
  );
}

export default App;