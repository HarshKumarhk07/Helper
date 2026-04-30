import DashboardShell from './DashboardShell.jsx';

import PillButton from '../../components/ui/PillButton.jsx';

export default function ManagerDashboard() {
  return (
    <DashboardShell
      eyebrow="(Manager console)"
      title="CURATE THE CATEGORY."
      slices={[]}
    >
      <div className="flex flex-wrap gap-3 mb-10">
        <PillButton variant="solid" to="/admin/bookings">
          Manage bookings →
        </PillButton>
        <PillButton variant="solid" to="/admin/products">
          Manage products →
        </PillButton>
        <PillButton variant="solid" to="/admin/services">
          Manage services →
        </PillButton>
      </div>
    </DashboardShell>
  );
}
