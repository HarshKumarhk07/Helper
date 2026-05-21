import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';

export default function UserDashboard() {
  return (
    <DashboardShell
      eyebrow="(My account)"
      title="YOUR URBANEASE."
    >
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
          Offers | coupons →
        </PillButton>
        <PillButton variant="solid" to="/me/support">
          Help | support →
        </PillButton>
        <PillButton variant="solid" to="/me/wallet">
          Wallet →
        </PillButton>
        <PillButton variant="solid" to="/me/kyc">
          KYC verification →
        </PillButton>
        <PillButton to="/services">Browse services</PillButton>
        <PillButton variant="solid" to="/me/profile-edit">
          Edit my profile →
        </PillButton>
      </div>
    </DashboardShell>
  );
}
