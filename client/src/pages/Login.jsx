import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import PillButton from '../components/ui/PillButton.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [suspensionNotice, setSuspensionNotice] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuspensionNotice('');
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back');
      navigate(location.state?.from || '/dashboard', { replace: true });
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

  return (
    <>
      <section className="container-velora flex min-h-[80vh] items-center py-16">
        <div className="grid w-full gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="heading-display text-5xl leading-[0.98]">SIGN IN<br />TO VELORA.</h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/70 dark:text-paper/60">
            One account for the marketplace and the service network. Your bookings, orders,
            and saved looks live in one place.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card-rounded mx-auto w-full max-w-md border border-ink/10 p-8 dark:border-paper/20">
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/55">(Sign in)</div>
          <h2 className="heading-display mt-2 text-3xl">Welcome back</h2>

          <div className="mt-6 space-y-4">
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

          <PillButton type="submit" variant="solid" className="mt-6 w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </PillButton>

          <div className="mt-6 text-center text-xs text-ink/60 dark:text-paper/60">
            New to Velora?{' '}
            <Link to="/signup" className="underline">
              Create an account
            </Link>
          </div>
        </form>
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
    <label className="block">
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
