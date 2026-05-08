import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';

const SLICES = [
  { tag: 'Live', title: 'Job queue', body: 'See assigned jobs, start, mark complete (PIN-gated in Slice C).' },
  { tag: 'Slice C', title: 'Live navigation', body: 'Leaflet map, watchPosition, throttled emit every 10s.' },
  { tag: 'Slice C', title: 'PIN start / end', body: 'Customer-shared PIN gates the job state machine.' },
  { tag: 'Slice E', title: 'Earnings', body: 'Daily / weekly payouts and tip breakdown.' },
];

export default function WorkerDashboard() {
  return (
    <DashboardShell
      eyebrow="(Worker app)"
      title="ON THE GROUND, ON SCHEDULE."
      slices={SLICES}
    >
      <div className="flex flex-wrap gap-3">
        <PillButton variant="solid" to="/worker">
          Worker panel →
        </PillButton>
        <PillButton variant="solid" to="/worker/jobs">
          Open job queue →
        </PillButton>
        <PillButton variant="solid" to="/worker/availability">
          Schedule & online →
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
