import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, PrimaryCTA, ErrorBanner } from '../components/auth/AuthFormPrimitives.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// Compact strength meter that runs entirely on the password string.
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

const strengthBar = ['bg-rose-400', 'bg-rose-400', 'bg-amber-400', 'bg-amber-300', 'bg-emerald-500', 'bg-emerald-500'];

const friendlyError = (err) => {
  const status = err?.response?.status;
  const msg =
    err?.response?.data?.message || err?.response?.data?.error || err?.message || '';
  if (status === 409 || /already in use/i.test(msg)) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (/password/i.test(msg) && /8/.test(msg)) {
    return 'Password must be at least 8 characters.';
  }
  if (/email/i.test(msg)) return 'That doesn\'t look like a valid email.';
  return msg || 'Could not create your account. Please try again.';
};

export default function Signup() {
  const { signup, isAuthenticated, bootstrapping } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const strength = useMemo(() => scorePassword(form.password), [form.password]);
  const fieldErrors = useMemo(() => {
    const errs = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email.';
    }
    if (form.password && form.password.length < 8) {
      errs.password = 'At least 8 characters.';
    }
    return errs;
  }, [form.email, form.password]);

  if (bootstrapping) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const canSubmit =
    form.name.trim().length >= 2 &&
    !fieldErrors.email &&
    form.email.trim().length > 0 &&
    !fieldErrors.password &&
    form.password.length >= 8 &&
    agreed;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      toast.success('Welcome to UrbanEase');
      navigate('/dashboard', { replace: true });
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
      {/* Layered, premium background — matches Login */}
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
          paddingTop: 'calc(1rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_minmax(0,460px)] lg:gap-16 lg:items-center">
          {/* Branding column */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7 lg:space-y-9"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/90 backdrop-blur.04] ">
              Create your account
            </span>

            <div className="space-y-6">
              <h1 className="font-display text-[clamp(2.4rem,5vw,4.25rem)] font-light leading-[1.02] tracking-tightest text-ink">
                Join
                <span className="mt-1 block font-semibold">UrbanEase.</span>
              </h1>
              <div className="h-px w-20 bg-gradient-to-r from-ink/40 to-transparent" />
              <p className="max-w-lg text-lg font-medium leading-relaxed text-ink/90">
                Book vetted urban services and shop the heritage collection from one elegant
                account. Workers and managers are invited by an admin.
              </p>
            </div>

            {/* Benefits — only on desktop, kept tight */}
            <ul className="hidden space-y-4 text-sm lg:block">
              <li className="flex flex-col gap-1">
                <span className="font-semibold text-ink">Verified professionals</span>
                <span className="text-ink/70">for every booking — KYC-checked, rated, on schedule.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-semibold text-ink">First-order welcome offers</span>
                <span className="text-ink/70">unlocked the moment your account is created.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-semibold text-ink">Curated for you</span>
                <span className="text-ink/70">— bookings, orders, wallet, support, all in one place.</span>
              </li>
            </ul>
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
                    Create your account
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">
                    A few quick details and you're in. Less than 30 seconds.
                  </p>
                </div>

                <div className="space-y-4 px-6 pb-2 pt-5 sm:px-8">
                  <GoogleAuthButton label="Sign up with Google" />
                  <div className="relative flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-ink/10" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                      or with email
                    </span>
                    <div className="h-px flex-1 bg-ink/10" />
                  </div>
                </div>

                <form
                  onSubmit={onSubmit}
                  className="space-y-4 px-6 pb-6 pt-2 sm:px-8 sm:pb-8"
                >
                  <Field
                    label="Full name"
                    type="text"
                    value={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    placeholder="First and last name"
                    autoComplete="name"
                    required
                    leadingIcon={<UserIcon size={16} />}
                  />

                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    leadingIcon={<Mail size={16} />}
                    error={!!fieldErrors.email}
                    helper={fieldErrors.email}
                  />

                  <Field
                    label="Phone"
                    helper="Optional"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                    placeholder="+91 XXXXX XXXXX"
                    autoComplete="tel"
                    leadingIcon={<Phone size={16} />}
                  />

                  <div className="space-y-2">
                    <Field
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(v) => setForm((f) => ({ ...f, password: v }))}
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
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    {/* Strength meter */}
                    {form.password && (
                      <div className="flex items-center gap-2">
                        <div className="grid h-1.5 flex-1 grid-cols-5 gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span
                              key={i}
                              className={`rounded-full transition-colors duration-300 ${
                                strength.score > i
                                  ? strengthBar[Math.min(strength.score, strengthBar.length - 1)]
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

                  {/* Terms */}
                  <label className="group flex cursor-pointer select-none items-start gap-2 pt-1">
                    <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="absolute inset-0 rounded-[5px] border border-ink/25 bg-paper transition-all duration-200 peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30.06]:border-paper:bg-paper" />
                      <svg
                        viewBox="0 0 16 16"
                        className="relative h-2.5 w-2.5 scale-0 stroke-paper opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 8.5 6.5 12 13 4" />
                      </svg>
                    </span>
                    <span className="text-xs leading-relaxed text-ink/65 transition-colors group-hover:text-ink:text-paper">
                      I agree to the{' '}
                      <Link
                        to="/terms"
                        className="font-medium text-ink underline-offset-4 hover:underline"
                      >
                        Terms
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy"
                        className="font-medium text-ink underline-offset-4 hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {error && <ErrorBanner>{error}</ErrorBanner>}

                  <PrimaryCTA
                    loading={submitting}
                    label="Create account"
                    disabled={!canSubmit}
                  />

                  <div className="border-t border-ink/10 pt-5 text-center text-sm text-ink/75">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-ink underline-offset-4 hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>

              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-ink/50">
                Protected by enterprise-grade encryption
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
