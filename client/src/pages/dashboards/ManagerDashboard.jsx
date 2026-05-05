import DashboardShell from './DashboardShell.jsx';

import PillButton from '../../components/ui/PillButton.jsx';

export default function ManagerDashboard() {
  return (
    <DashboardShell
      eyebrow="(Manager console)"
      title="CURATE THE CATEGORY."
      slices={[
        {
          tag: 'Approval',
          title: 'Approve worker accounts',
          body: 'Review worker onboarding and route personnel for activation through the user console.',
        },
        {
          tag: 'Assignment',
          title: 'Assign workers and managers',
          body: 'Keep operational coverage balanced by moving people into the right roles.',
        },
        {
          tag: 'Data',
          title: 'View and edit live data',
          body: 'Use the admin routes to manage users, bookings, services, products, and coupons.',
        },
      ]}
    >
      <div className="flex flex-wrap gap-3 mb-10">
        <PillButton variant="solid" to="/manager">
          Manager panel →
        </PillButton>
        <PillButton variant="solid" to="/admin/bookings">
          Manage bookings →
        </PillButton>
        <PillButton variant="solid" to="/admin/products">
          Manage products →
        </PillButton>
        <PillButton variant="solid" to="/admin/services">
          Manage services →
        </PillButton>
        <PillButton variant="solid" to="/admin/orders">
          Order notes →
        </PillButton>
        <PillButton variant="solid" to="/admin/users">
          Approve workers →
        </PillButton>
        <PillButton variant="solid" to="/admin/finance">
          Payouts →
        </PillButton>
        <PillButton variant="solid" to="/admin/audit-logs">
          Audit logs →
        </PillButton>
        <PillButton variant="solid" to="/me/profile-edit">
          Edit KYC & Profile →
        </PillButton>
      </div>
    </DashboardShell>
  );
}
