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

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
