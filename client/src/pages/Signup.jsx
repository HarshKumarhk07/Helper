import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import PillButton from '../components/ui/PillButton.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-velora flex min-h-[80vh] items-center py-16">
      <div className="grid w-full gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="heading-display text-5xl leading-[0.98]">JOIN VELORA<br />HOUSE.</h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/70 dark:text-paper/60">
            Book vetted urban services and shop the heritage collection from one account.
            Workers and managers are invited by an admin.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card-rounded mx-auto w-full max-w-md border border-ink/10 p-8 dark:border-paper/20">
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/55">(Create account)</div>
          <h2 className="heading-display mt-2 text-3xl">New here</h2>

          <div className="mt-6 space-y-4">
            <Field
              label="Full name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              autoComplete="name"
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              autoComplete="email"
              required
            />
            <Field
              label="Phone (optional)"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              autoComplete="tel"
            />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              autoComplete="new-password"
              required
            />
          </div>

          <PillButton type="submit" variant="solid" className="mt-6 w-full">
            {submitting ? 'Creating…' : 'Create account'}
          </PillButton>

          <div className="mt-6 text-center text-xs text-ink/60 dark:text-paper/60">
            Already have an account?{' '}
            <Link to="/login" className="underline">
              Sign in
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
