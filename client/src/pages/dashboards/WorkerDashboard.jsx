import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';

export default function WorkerDashboard() {
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
