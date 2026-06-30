import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, PrimaryCTA, ErrorBanner } from '../components/auth/AuthFormPrimitives.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const friendlyError = (err) => {
  const status = err?.response?.status;
  const msg =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    '';
  if (status === 401 && /admin security key/i.test(msg)) return 'Invalid admin security key.';
  if (status === 401) return 'Email or password is incorrect.';
  if (status === 403 && /suspend/i.test(msg)) return msg;
  if (/network/i.test(msg)) return 'Network issue — check your connection.';
  return msg || 'Login failed. Please try again.';
};

// Detect if the current email looks like it belongs to an admin
const isAdminEmail = (email) => email.trim().toLowerCase() === 'admin@helper.com';

export default function Login() {
  const { login, isAuthenticated, bootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', adminKey: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [suspensionNotice, setSuspensionNotice] = useState('');

  const handleEmailChange = (v) => {
    setForm((f) => ({ ...f, email: v }));
  };

  if (bootstrapping) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuspensionNotice('');
    setSubmitting(true);
    try {
      const adminKey = isAdminEmail(form.email) ? form.adminKey : undefined;
      await login(form.email.trim(), form.password, adminKey);
      toast.success('Welcome back');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      const message = friendlyError(err);
      if (err?.response?.status === 403 && /suspend/i.test(message)) {
        setSuspensionNotice(message);
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <>
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
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:gap-16 lg:items-center">
          {/* Branding column */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7 lg:space-y-9"
          >
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-ink/90 font-semibold backdrop-blur.04]">
              Members area
            </span>

            <div className="space-y-5">
              <h1 className="font-display text-[clamp(2.4rem,5vw,4.25rem)] font-light leading-[1.05] tracking-tightest text-ink">
                Sign in to
                <span className="mt-1 block font-semibold">Helper.</span>
              </h1>
              <div className="h-px w-16 bg-gradient-to-r from-ink/40 to-transparent" />
              <p className="max-w-md text-base font-semibold leading-relaxed text-ink/85">
                Your bookings, orders, and saved looks live in one elegant place. Sign in to
                pick up where you left off.
              </p>
            </div>

            <ul className="hidden flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.18em] text-ink/70 lg:flex">
              <li className="inline-flex items-center rounded-full border border-ink/10 px-3 py-1 font-semibold.03]">
                Secure auth
              </li>
              <li className="inline-flex items-center rounded-full border border-ink/10 px-3 py-1 font-semibold.03]">
                Google sign-in
              </li>
              <li className="inline-flex items-center rounded-full border border-ink/10 px-3 py-1 font-semibold.03]">
                Curated for you
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
                    Welcome back
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">
                    Sign in with your email or continue with Google.
                  </p>
                </div>

                <div className="space-y-4 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                  <GoogleAuthButton label="Continue with Google" />

                  {/* Divider */}
                  <div className="relative flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-ink/10" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                      or with email
                    </span>
                    <div className="h-px flex-1 bg-ink/10" />
                  </div>

                  <form onSubmit={onSubmit} className="space-y-4">
                    <Field
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={handleEmailChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      leadingIcon={<Mail size={16} />}
                    />
                    <Field
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      leadingIcon={<Lock size={16} />}
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

                    {/* Admin security key — shown only when admin email is detected */}
                    <AnimatePresence>
                      {isAdminEmail(form.email) && (
                        <motion.div
                          key="admin-key"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-3 mb-1">
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2">
                              <ShieldCheck size={13} />
                              Admin Access Detected
                            </p>
                            <Field
                              label="Security Key"
                              type={showAdminKey ? 'text' : 'password'}
                              value={form.adminKey}
                              onChange={(v) => setForm((f) => ({ ...f, adminKey: v }))}
                              placeholder="Enter admin security key"
                              autoComplete="off"
                              required={isAdminEmail(form.email)}
                              leadingIcon={<ShieldCheck size={16} />}
                              trailing={
                                <button
                                  type="button"
                                  onClick={() => setShowAdminKey((v) => !v)}
                                  className="text-ink/45 transition-colors hover:text-ink"
                                  tabIndex={-1}
                                >
                                  {showAdminKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between pt-1">
                      <label className="group inline-flex cursor-pointer select-none items-center gap-2">
                        <span className="relative inline-flex h-4 w-4 items-center justify-center">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer sr-only"
                          />
                          <span className="absolute inset-0 rounded-[5px] border border-ink/30 bg-paper transition-all duration-200 peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30.06]:border-paper:bg-paper" />
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
                        <span className="text-xs text-ink/65 transition-colors group-hover:text-ink:text-paper">
                          Remember me
                        </span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-ink/65 underline-offset-4 transition-colors hover:text-ink hover:underline:text-paper"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    {error && <ErrorBanner>{error}</ErrorBanner>}

                    <PrimaryCTA loading={submitting} label="Sign in" />
                  </form>

                  <div className="border-t border-ink/10 pt-5 text-center text-sm text-ink/75">
                    New to Helper?{' '}
                    <Link
                      to="/signup"
                      className="font-semibold text-ink underline-offset-4 hover:underline"
                    >
                      Create an account
                    </Link>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-ink/50">
                Protected by enterprise-grade encryption
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Suspension Notice Modal */}
      <AnimatePresence>
        {suspensionNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md space-y-5 rounded-[24px] border border-ink/10 bg-paper p-7 shadow-card"
            >
              <div className="space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/55">
                  Account notice
                </div>
                <h3 className="text-xl font-semibold text-ink">
                  Account suspended
                </h3>
                <p className="text-sm leading-relaxed text-ink/70">
                  {suspensionNotice}
                </p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2 text-xs text-ink/65.04]">
                For assistance, contact{' '}
                <span className="font-mono text-ink">
                  support@helper.com
                </span>
                .
              </div>
              <button
                onClick={() => setSuspensionNotice('')}
                className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-paper transition-transform duration-150 hover:opacity-95 active:scale-[0.99]"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
