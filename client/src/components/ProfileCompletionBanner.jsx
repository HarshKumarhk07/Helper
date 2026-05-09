import { Link } from 'react-router-dom';
import { useState } from 'react';
import { UserCog, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const PHONE_PLACEHOLDER_DOMAIN = '@phone.velora.local';
const DISMISS_KEY = 'velora_profile_banner_dismissed_at';
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // re-show after 24h

const isPlaceholderEmail = (email) =>
  typeof email === 'string' && email.toLowerCase().endsWith(PHONE_PLACEHOLDER_DOMAIN);

// Banner that nudges OTP-only signups to set a real email + check their name.
// Auto-detects the placeholder email pattern produced by the OTP flow.
export default function ProfileCompletionBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY));
      return Number.isFinite(at) && Date.now() - at < DISMISS_TTL_MS;
    } catch {
      return false;
    }
  });

  if (!user) return null;
  if (!isPlaceholderEmail(user.email)) return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold uppercase tracking-widest text-xs">
            Finish setting up your account
          </div>
          <p className="mt-1 leading-relaxed">
            We signed you in with your phone — add your email and confirm your
            name so we can send you booking confirmations and invoices.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/me/profile-edit"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-xs uppercase tracking-widest text-paper hover:opacity-90 dark:bg-paper dark:text-ink"
        >
          <UserCog size={12} /> Complete profile
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="rounded-full p-1.5 hover:bg-amber-200/60 dark:hover:bg-amber-400/15"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
