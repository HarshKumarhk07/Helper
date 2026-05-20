import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { resetPassword } from '../api/auth.js';
import { Field, PrimaryCTA, ErrorBanner } from '../components/auth/AuthFormPrimitives.jsx';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const scorePassword = (pw) => {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong', 'Excellent'];
  return { score, label: labels[Math.min(score, labels.length - 1)] };
};
const strengthBar = [
  'bg-rose-400',
  'bg-rose-400',
  'bg-amber-400',
  'bg-amber-300',
  'bg-emerald-500',
  'bg-emerald-500',
];

  const friendlyError = (err) => {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.message || err?.response?.data?.error || err?.message || '';
    if (/already used/i.test(msg)) return 'This reset link has already been used. Request a new one.';
    if (/expired/i.test(msg) || /invalid or already used/i.test(msg))
      return 'This reset link has expired. Request a new one.';
    if (/account not found/i.test(msg)) return 'Account not found.';
    // Prefer server-provided message (this may include specific password policy reasons)
    return msg || 'Could not update your password. Try again or request a new link.';
  };

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setTokenMissing(true);
  }, [token]);

  const strength = useMemo(() => scorePassword(password), [password]);
  const fieldErrors = useMemo(() => {
    const errs = {};
    if (password && password.length < 8) errs.password = 'At least 8 characters.';
    if (confirm && confirm !== password) errs.confirm = "Passwords don't match.";
    return errs;
  }, [password, confirm]);

  const canSubmit =
    !tokenMissing &&
    password.length >= 8 &&
    confirm === password &&
    !submitting &&
    !done;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
      toast.success('Password updated');
      setTimeout(() => navigate('/login', { replace: true }), 1400);
    } catch (err) {
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
        className="pointer-events-none fixed inset-0 -z-10 bg-paper"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(60rem 60rem at 12% 0%, rgba(26,26,26,0.06), transparent 60%), radial-gradient(50rem 50rem at 100% 100%, rgba(26,26,26,0.05), transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[40vh] bg-gradient-to-b from-sand/60 to-transparent.03]"
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
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/70 backdrop-blur.04]">
              <ShieldCheck size={12} className="opacity-70" /> Account security
            </span>

            <div className="space-y-5">
              <h1 className="font-display text-[clamp(2.4rem,5vw,4.25rem)] font-light leading-[1.05] tracking-tightest text-ink">
                Set a new
                <span className="mt-1 block font-semibold">password.</span>
              </h1>
              <div className="h-px w-16 bg-gradient-to-r from-ink/40 to-transparent" />
              <p className="max-w-md text-base leading-relaxed text-ink/70">
                Choose something memorable but unique to UrbanEase. Once saved, you'll be
                redirected to sign in.
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
                className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-ink/5 via-transparent to-ink/[0.02] blur-2xl.04].02]"
              />

              <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-paper/95 shadow-card backdrop-blur-xl">
                <div className="px-6 pt-6 pb-1 sm:px-8 sm:pt-8">
                  <h2 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">
                    {done ? 'All set' : 'New password'}
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {done
                      ? 'Redirecting you to sign in…'
                      : tokenMissing
                      ? 'This page needs a reset token.'
                      : 'Pick something at least 8 characters long.'}
                  </p>
                </div>

                <div className="space-y-4 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                  {tokenMissing ? (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-900.06]">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <div>
                        Open the link from the password-reset email, or{' '}
                        <Link
                          to="/forgot-password"
                          className="font-semibold underline-offset-4 hover:underline"
                        >
                          request a new one
                        </Link>
                        .
                      </div>
                    </div>
                  ) : done ? (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-2.5 text-sm text-emerald-900.06]">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                      <div>Password updated successfully. Taking you to sign in…</div>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Field
                          label="New password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(v) => {
                            setPassword(v);
                            if (error) setError('');
                          }}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                          required
                          leadingIcon={<Lock size={16} />}
                          error={!!fieldErrors.password}
                          helper={fieldErrors.password}
                          trailing={
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="text-ink/45 transition-colors hover:text-ink:text-paper"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          }
                        />

                        {/* Strength meter */}
                        {password && (
                          <div className="flex items-center gap-2">
                            <div className="grid h-1.5 flex-1 grid-cols-5 gap-1">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <span
                                  key={i}
                                  className={`rounded-full transition-colors duration-300 ${
                                    strength.score > i
                                      ? strengthBar[
                                          Math.min(strength.score, strengthBar.length - 1)
                                        ]
                                      : 'bg-ink/10'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="w-16 text-right text-[10px] font-medium uppercase tracking-[0.16em] text-ink/55">
                              {strength.label}
                            </span>
                          </div>
                        )}
                      </div>

                      <Field
                        label="Confirm password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirm}
                        onChange={(v) => {
                          setConfirm(v);
                          if (error) setError('');
                        }}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        required
                        leadingIcon={<Lock size={16} />}
                        error={!!fieldErrors.confirm}
                        helper={fieldErrors.confirm}
                      />

                      {error && <ErrorBanner>{error}</ErrorBanner>}

                      <PrimaryCTA
                        loading={submitting}
                        label="Update password"
                        success={done}
                        disabled={!canSubmit}
                      />
                    </form>
                  )}

                  <div className="border-t border-ink/10 pt-5 text-center text-sm text-ink/65">
                    <Link
                      to="/login"
                      className="font-semibold text-ink underline-offset-4 hover:underline"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-ink/40">
                Protected by enterprise-grade encryption
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
