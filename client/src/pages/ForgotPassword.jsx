import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, CheckCircle2 } from 'lucide-react';
import PillButton from '../components/ui/PillButton.jsx';
import { requestPasswordReset } from '../api/auth.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch {
      // The endpoint returns 200 even on unknown emails to avoid leaks. A real
      // failure here means a network or server-config issue.
      toast.error('Something went wrong. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-velora flex min-h-[80vh] items-center py-16">
      <div className="grid w-full gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="heading-display text-5xl leading-[0.98]">
            FORGOT YOUR
            <br />
            PASSWORD?
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/70 dark:text-paper/60">
            Enter your account email and we'll send you a secure link to set a new password.
            The link expires after 30 minutes.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="card-rounded mx-auto w-full max-w-md border border-ink/10 p-8 dark:border-paper/20"
        >
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/55">
            (Reset)
          </div>
          <h2 className="heading-display mt-2 text-3xl">Reset your password</h2>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-green-300 bg-green-50/60 p-5 text-sm text-green-800 dark:border-green-400/20 dark:bg-green-400/5 dark:text-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Check your inbox</div>
                  <p className="mt-1">
                    If an account exists for{' '}
                    <span className="font-medium">{email}</span>, we've sent a reset link.
                    It expires in 30 minutes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/55">
                    Email
                  </span>
                  <div className="flex items-center gap-2 rounded-pill border border-ink/20 bg-paper px-4 py-2.5 transition focus-within:border-ink dark:border-paper/30 dark:bg-paper/5">
                    <Mail size={16} className="text-ink/50 dark:text-paper/45" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full bg-transparent text-sm outline-none dark:text-paper"
                      placeholder="you@example.com"
                    />
                  </div>
                </label>
              </div>

              <PillButton
                type="submit"
                variant="solid"
                className="mt-6 w-full"
                disabled={submitting || !email.trim()}
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </PillButton>
            </>
          )}

          <div className="mt-6 text-center text-xs text-ink/60 dark:text-paper/60">
            Remembered it?{' '}
            <Link to="/login" className="underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
