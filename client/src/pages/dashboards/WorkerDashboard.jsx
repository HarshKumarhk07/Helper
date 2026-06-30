import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';

export default function WorkerDashboard() {
  const { user } = useAuth();

  // Guard: if KYC not verified, send to KYC page
  if (user && user.kycStatus !== 'verified') {
    return <Navigate to="/worker/kyc" replace />;
  }

  return (
    <DashboardShell
      eyebrow="(Worker app)"
      title="ON THE GROUND, ON SCHEDULE."
    >
      <div className="flex flex-wrap gap-3">
        <PillButton variant="solid" to="/worker/jobs">
          Open job queue →
        </PillButton>
        <PillButton variant="solid" to="/worker/availability">
          Schedule | online →
        </PillButton>
        <PillButton variant="solid" to="/worker/earnings">
          View earnings →
        </PillButton>
        <PillButton variant="solid" to="/worker/kyc">
          KYC verification →
        </PillButton>
        <PillButton variant="solid" to="/me/profile-edit">
          Edit profile →
        </PillButton>
      </div>
    </DashboardShell>
  );
}
