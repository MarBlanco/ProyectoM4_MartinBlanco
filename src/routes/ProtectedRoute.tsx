import { Navigate, Outlet } from 'react-router-dom';

import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando autenticación..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
