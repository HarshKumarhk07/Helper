import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import ProfileCompletionBanner from '../../components/ProfileCompletionBanner.jsx';

const SLICES = [
  { tag: 'Live', title: 'My bookings', body: 'Track service status — Placed → Assigned → In Progress → Completed.' },
  { tag: 'Slice D', title: 'Orders & invoices', body: 'Lookbook orders, downloadable PDF invoices.' },
  { tag: 'Live', title: 'Addresses', body: 'Save home, work, and other delivery destinations during booking.' },
  { tag: 'Slice E', title: 'Reviews', body: 'Rate workers, products, and the experience.' },
];

export default function UserDashboard() {
  return (
    <DashboardShell
      eyebrow="(My account)"
      title="YOUR VELORA."
      slices={SLICES}
    >
      <ProfileCompletionBanner />
      <div className="flex flex-wrap gap-3">
        <PillButton variant="solid" to="/me/bookings">
          My bookings →
        </PillButton>
        <PillButton variant="solid" to="/me/orders">
          My orders →
        </PillButton>
        <PillButton variant="solid" to="/me/addresses">
          Saved addresses →
        </PillButton>
        <PillButton variant="solid" to="/me/coupons">
          Offers & coupons →
        </PillButton>
        <PillButton variant="solid" to="/me/support">
          Help & support →
        </PillButton>
        <PillButton variant="solid" to="/me/wallet">
          Wallet →
        </PillButton>
        <PillButton to="/services">Browse services</PillButton>
        <PillButton variant="solid" to="/me/profile-edit">
          Edit my profile →
        </PillButton>
      </div>
    </DashboardShell>
  );
}
