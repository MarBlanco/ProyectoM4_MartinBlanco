import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { AuthContext } from '../contexts/AuthContext';

function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Verificando autenticación...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;