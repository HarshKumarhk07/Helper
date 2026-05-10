import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, CheckCircle2, MailQuestion } from 'lucide-react';
import { motion } from 'framer-motion';
import { Field, PrimaryCTA, ErrorBanner } from '../components/auth/AuthFormPrimitives.jsx';
import { requestPasswordReset } from '../api/auth.js';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const friendlyError = (err) => {
  const msg =
    err?.response?.data?.message || err?.response?.data?.error || err?.message || '';
  if (/network/i.test(msg)) return 'Network issue — check your connection and try again.';
  if (/email/i.test(msg)) return 'That doesn\'t look like a valid email.';
  return msg || 'Something went wrong. Please try again in a moment.';
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const emailValid =
    !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailValid) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      // The endpoint returns 200 even for unknown emails (no enumeration), so a
      // real error here is a network/server-config issue, not "user not found".
      const message = friendlyError(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Layered, premium background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-paper dark:bg-[#0E0E10]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-70 dark:opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(60rem 60rem at 12% 0%, rgba(26,26,26,0.06), transparent 60%), radial-gradient(50rem 50rem at 100% 100%, rgba(26,26,26,0.05), transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[40vh] bg-gradient-to-b from-sand/60 to-transparent dark:from-paper/[0.03]"
      />

      <section
        className="relative flex min-h-[100dvh] items-center justify-center px-4 sm:px-6"
        style={{
          paddingTop: 'calc(7rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:gap-16 lg:items-center">
          {/* Branding column */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 lg:space-y-9"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/70 backdrop-blur dark:border-paper/15 dark:bg-paper/[0.04] dark:text-paper/70">
              <MailQuestion size={12} className="opacity-70" /> Account recovery
            </span>

            <div className="space-y-5">
              <h1 className="font-display text-[clamp(2.4rem,5vw,4.25rem)] font-light leading-[1.05] tracking-tightest text-ink">
                Reset your
                <span className="mt-1 block font-semibold">password.</span>
              </h1>
              <div className="h-px w-16 bg-gradient-to-r from-ink/40 to-transparent dark:from-paper/40" />
              <p className="max-w-md text-base leading-relaxed text-ink/70 dark:text-paper/65">
                Enter the email tied to your Velora House account and we'll send a secure link
                to set a new password. The link expires after 30 minutes.
              </p>
            </div>
          </motion.div>

          {/* Card column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="w-full"
          >
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-ink/5 via-transparent to-ink/[0.02] blur-2xl dark:from-paper/[0.04] dark:to-paper/[0.02]"
              />

              <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-paper/95 shadow-card backdrop-blur-xl dark:border-paper/10 dark:bg-[#141417]/85">
                <div className="px-6 pt-6 pb-1 sm:px-8 sm:pt-8">
                  <h2 className="text-[26px] font-semibold leading-tight tracking-tight text-ink dark:text-paper">
                    {sent ? 'Check your inbox' : 'Forgot password'}
                  </h2>
                  <p className="mt-1 text-sm text-ink/60 dark:text-paper/55">
                    {sent
                      ? 'We just sent you a reset link if the account exists.'
                      : 'We\'ll email you a secure link to choose a new password.'}
                  </p>
                </div>

                <div className="space-y-4 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                  {sent ? (
                    <>
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/[0.06] dark:text-emerald-200">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                        <div>
                          If an account exists for{' '}
                          <span className="font-semibold">{email}</span>, the reset link is on
                          its way. It expires in 30 minutes.
                        </div>
                      </div>
                      <p className="text-xs text-ink/55 dark:text-paper/45">
                        Didn't get anything within a few minutes? Check spam, or{' '}
                        <button
                          type="button"
                          onClick={() => setSent(false)}
                          className="font-medium text-ink underline-offset-4 hover:underline dark:text-paper"
                        >
                          try a different email
                        </button>
                        .
                      </p>
                    </>
                  ) : (
                    <form onSubmit={onSubmit} className="space-y-4">
                      <Field
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(v) => {
                          setEmail(v);
                          if (error) setError('');
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        leadingIcon={<Mail size={16} />}
                        error={!!error}
                      />

                      {error && <ErrorBanner>{error}</ErrorBanner>}

                      <PrimaryCTA
                        loading={submitting}
                        label="Send reset link"
                        disabled={!emailValid}
                      />
                    </form>
                  )}

                  <div className="border-t border-ink/10 pt-5 text-center text-sm text-ink/65 dark:border-paper/10 dark:text-paper/60">
                    Remembered it?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-ink underline-offset-4 hover:underline dark:text-paper"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-ink/40 dark:text-paper/40">
                Protected by enterprise-grade encryption
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
