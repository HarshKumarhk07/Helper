import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// After sign-in, route each role to their default landing page.
// Workers and brands who haven't completed KYC are sent directly
// to their KYC submission page first.
const ROUTE_BY_ROLE = {
  admin: '/admin',
  worker: '/worker',
  user: '/me',
  brand: '/brand',
};

const KYC_ROUTE = {
  worker: '/worker/kyc',
  brand: '/brand/kyc',
};

export default function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Force workers and brands to complete KYC before accessing their dashboard
  if (
    KYC_ROUTE[user.role] &&
    user.kycStatus !== 'verified'
  ) {
    return <Navigate to={KYC_ROUTE[user.role]} replace />;
  }

  const target = ROUTE_BY_ROLE[user?.role] || '/me';
  return <Navigate to={target} replace />;
}
