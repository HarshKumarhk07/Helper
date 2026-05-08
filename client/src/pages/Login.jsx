import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import PillButton from '../components/ui/PillButton.jsx';
import { sendOtp, verifyOtp } from '../api/otp.js';

const RESEND_COOLDOWN = 30;

export default function Login() {
  const { login, applySession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('password'); // 'password' | 'otp'

  // Password mode state
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [suspensionNotice, setSuspensionNotice] = useState('');

  // OTP mode state
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpInfo, setOtpInfo] = useState(null); // { devCode, smsConfigured, expiresAt }
  const [resendIn, setResendIn] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    []
  );

  const startCooldown = () => {
    setResendIn(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const goNext = () => {
    navigate(location.state?.from || '/dashboard', { replace: true });
  };

  // ---- Password flow ----
  const onSubmitPassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuspensionNotice('');
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back');
      goNext();
    } catch (err) {
      const message = err?.response?.data?.error || 'Login failed';
      if (err?.response?.status === 403 && /suspend/i.test(message)) {
        setSuspensionNotice(message);
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---- OTP flow ----
  const onSendOtp = async (e) => {
    e?.preventDefault?.();
    if (!phone.trim()) return;
    setOtpSending(true);
    try {
      const data = await sendOtp(phone.trim());
      setOtpInfo(data);
      setOtpStep('code');
      startCooldown();
      if (data.devCode) {
        toast.success(`Dev mode code: ${data.devCode}`, { duration: 8000 });
      } else if (data.smsConfigured) {
        toast.success('Code sent — check your SMS');
      } else {
        toast('Code generated — SMS is not configured on this server', {
          icon: '⚠️',
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send code');
    } finally {
      setOtpSending(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setOtpVerifying(true);
    setSuspensionNotice('');
    try {
      const data = await verifyOtp({
        phone: phone.trim(),
        code: code.trim(),
        name: name.trim() || undefined,
      });
      // Persist tokens + user just like the password flow does in AuthContext
      applySession(data);
      toast.success(data.created ? 'Welcome to Velora House' : 'Welcome back');
      goNext();
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message || err?.response?.data?.error || 'Verification failed';
      if (status === 403 && /suspend/i.test(message)) {
        setSuspensionNotice(message);
      } else {
        toast.error(message);
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  const onResend = () => {
    if (resendIn > 0) return;
    setCode('');
    onSendOtp();
  };

  return (
    <>
      <section className="container-velora flex min-h-[80vh] items-center py-16">
        <div className="grid w-full gap-12 lg:grid-cols-2">
          <div className="hidden lg:block">
            <h1 className="heading-display text-5xl leading-[0.98]">
              SIGN IN
              <br />
              TO VELORA.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/70 dark:text-paper/60">
              One account for the marketplace and the service network. Your bookings,
              orders, and saved looks live in one place.
            </p>
          </div>

          <div className="card-rounded mx-auto w-full max-w-md border border-ink/10 p-8 dark:border-paper/20">
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/55">
              (Sign in)
            </div>
            <h2 className="heading-display mt-2 text-3xl">Welcome back</h2>

            {/* Mode tabs */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-pill border border-ink/15 p-1 dark:border-paper/15">
              <button
                type="button"
                onClick={() => setMode('password')}
                className={`rounded-pill px-3 py-1.5 text-xs uppercase tracking-widest transition ${
                  mode === 'password'
                    ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                    : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
                }`}
              >
                Email + password
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('otp');
                  setOtpStep('phone');
                  setCode('');
                }}
                className={`rounded-pill px-3 py-1.5 text-xs uppercase tracking-widest transition ${
                  mode === 'otp'
                    ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                    : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper'
                }`}
              >
                Phone OTP
              </button>
            </div>

            {mode === 'password' ? (
              <form onSubmit={onSubmitPassword} className="mt-6">
                <div className="space-y-4">
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    autoComplete="email"
                    required
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-ink/60 underline hover:text-ink dark:text-paper/60 dark:hover:text-paper"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PillButton type="submit" variant="solid" className="mt-6 w-full" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </PillButton>
              </form>
            ) : otpStep === 'phone' ? (
              <form onSubmit={onSendOtp} className="mt-6">
                <Field
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  autoComplete="tel"
                  placeholder="10-digit number or +91…"
                  required
                />
                <p className="mt-2 text-xs text-ink/55 dark:text-paper/45">
                  We'll send a 6-digit code valid for 5 minutes. New here? Your account
                  is created automatically.
                </p>
                <PillButton
                  type="submit"
                  variant="solid"
                  className="mt-6 w-full"
                  disabled={otpSending || !phone.trim()}
                >
                  {otpSending ? 'Sending…' : 'Send code'}
                </PillButton>
              </form>
            ) : (
              <form onSubmit={onVerifyOtp} className="mt-6">
                <div className="mb-3 rounded-2xl border border-ink/10 bg-sand/40 p-3 text-xs text-ink/70 dark:border-paper/10 dark:bg-paper/5 dark:text-paper/70">
                  Code sent to <span className="font-mono">{phone}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('phone');
                      setCode('');
                    }}
                    className="ml-3 underline"
                  >
                    Change number
                  </button>
                </div>
                <Field
                  label="6-digit code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                  autoComplete="one-time-code"
                  required
                />
                <Field
                  label="Your name (only for first-time signups)"
                  value={name}
                  onChange={setName}
                  placeholder="Optional — we'll use a default if blank"
                />
                {otpInfo?.devCode && (
                  <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/60 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-200">
                    Dev mode: SMS not configured. Code is{' '}
                    <span className="font-mono font-semibold">{otpInfo.devCode}</span>.
                  </div>
                )}
                <PillButton
                  type="submit"
                  variant="solid"
                  className="mt-6 w-full"
                  disabled={otpVerifying}
                >
                  {otpVerifying ? 'Verifying…' : 'Verify & sign in'}
                </PillButton>
                <div className="mt-3 text-center text-xs text-ink/60 dark:text-paper/55">
                  Didn't get it?{' '}
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resendIn > 0 || otpSending}
                    className="underline disabled:no-underline disabled:opacity-60"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-xs text-ink/60 dark:text-paper/60">
              New to Velora?{' '}
              <Link to="/signup" className="underline">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {suspensionNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-lg border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:border-paper/20 dark:bg-[#14151A] dark:text-paper">
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Account notice
            </div>
            <h2 className="heading-display mt-3 text-3xl">Account suspended</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/75 dark:text-paper/70">
              {suspensionNotice}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/75 dark:text-paper/70">
              For any further query, connect with adminvelorahouse@gmail.com.
            </p>
            <div className="mt-6 flex justify-end">
              <PillButton variant="solid" onClick={() => setSuspensionNotice('')}>
                Close
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, type = 'text', value, onChange, ...rest }) {
  return (
    <label className="mb-3 block last:mb-0">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/55">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-pill border border-ink/20 bg-paper px-4 py-2.5 text-sm outline-none transition focus:border-ink dark:border-paper/30 dark:bg-paper/5 dark:text-paper dark:placeholder:text-paper/35 dark:focus:border-paper/70"
        {...rest}
      />
    </label>
  );
}
