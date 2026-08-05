import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import BankDetailsForm from '../../components/forms/BankDetailsForm.jsx';

export default function UserBankDetails() {
  return (
    <DashboardShell
      eyebrow="Profile"
      title="Bank & UPI Details"
    >
      <FadeUp>
        <div className="max-w-3xl">
          <BankDetailsForm />
        </div>
      </FadeUp>
    </DashboardShell>
  );
}
