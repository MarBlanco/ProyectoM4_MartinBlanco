// ARCHIVO: src/App.tsx

import { useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from './services/firebase';
import { AuthContext } from './contexts/AuthContext';

function App() {
  const { user, loading } = useContext(AuthContext);

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
      <h1>Prueba de Firebase</h1>

      <section>
        <h2>Estado de autenticación</h2>

        {loading ? (
          <p>Verificando autenticación...</p>
        ) : user ? (
          <div>
            <p>Usuario autenticado</p>
            <p>Email: {user.email ?? 'No disponible'}</p>
          </div>
        ) : (
          <p>Sin sesión iniciada</p>
        )}
      </section>

      <section>
        <h2>Estado de Firestore</h2>
        <p>{resultado}</p>
      </section>
    </main>
  );
}

export default App;