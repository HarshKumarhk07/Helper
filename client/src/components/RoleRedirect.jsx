import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROUTE_BY_ROLE = {
  admin: '/admin',
  manager: '/manager',
  worker: '/worker',
  user: '/me',
};

export default function RoleRedirect() {
  const { user } = useAuth();
  const target = ROUTE_BY_ROLE[user?.role] || '/me';
  return <Navigate to={target} replace />;
}
