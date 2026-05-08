import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PillButton from '../components/ui/PillButton.jsx';
import { resetPassword } from '../api/auth.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    if (!token) setTokenMissing(true);
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
      toast.success('Password updated');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-velora flex min-h-[80vh] items-center py-16">
      <div className="mx-auto w-full max-w-md">
        <form
          onSubmit={onSubmit}
          className="card-rounded border border-ink/10 p-8 dark:border-paper/20"
        >
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/55">
            (New password)
          </div>
          <h2 className="heading-display mt-2 text-3xl">Set a new password</h2>

          {tokenMissing ? (
            <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50/60 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  This page needs a reset token. Open the link from the password-reset
                  email, or{' '}
                  <Link to="/forgot-password" className="underline">
                    request a new one
                  </Link>
                  .
                </div>
              </div>
            </div>
          ) : done ? (
            <div className="mt-6 rounded-2xl border border-green-300 bg-green-50/60 p-4 text-sm text-green-800 dark:border-green-400/20 dark:bg-green-400/5 dark:text-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <div>
                  Password updated. Redirecting to sign in…
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                <PasswordField
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                />
                <p className="text-xs text-ink/60 dark:text-paper/50">
                  Use at least 8 characters. Mix letters, numbers, and a symbol for best
                  results.
                </p>
              </div>

              <PillButton
                type="submit"
                variant="solid"
                className="mt-6 w-full"
                disabled={submitting}
              >
                {submitting ? 'Updating…' : 'Update password'}
              </PillButton>
            </>
          )}

          <div className="mt-6 text-center text-xs text-ink/60 dark:text-paper/60">
            <Link to="/login" className="underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

function PasswordField({ label, value, onChange, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/55">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-pill border border-ink/20 bg-paper px-4 py-2.5 transition focus-within:border-ink dark:border-paper/30 dark:bg-paper/5">
        <Lock size={16} className="text-ink/50 dark:text-paper/45" />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full bg-transparent text-sm outline-none dark:text-paper"
          {...rest}
        />
      </div>
    </label>
  );
}
