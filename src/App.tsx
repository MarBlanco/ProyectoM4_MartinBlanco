import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './services/firebase';

function App() {
  const [resultado, setResultado] = useState('Conectando con Firebase...');

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
      <p>{resultado}</p>
    </main>
  );
}

export default App;