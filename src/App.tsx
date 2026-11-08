import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import TasksPage from './pages/TasksPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tasks" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/tasks" element={<TasksPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
