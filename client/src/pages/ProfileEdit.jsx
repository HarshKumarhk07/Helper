import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  Mail,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, PrimaryCTA, ErrorBanner } from '../components/auth/AuthFormPrimitives.jsx';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const PHONE_PLACEHOLDER_DOMAIN = '@phone.velora.local';
const isPlaceholderEmail = (email) =>
  typeof email === 'string' && email.toLowerCase().endsWith(PHONE_PLACEHOLDER_DOMAIN);

const friendlyError = (err) => {
  const msg =
    err?.response?.data?.message || err?.response?.data?.error || err?.message || '';
  if (/already in use/i.test(msg)) return 'That email is already taken.';
  return msg || 'Could not save your profile. Please try again.';
};

export default function ProfileEdit() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    passportPhoto: '',
  });

  const [photoState, setPhotoState] = useState('idle'); // idle | uploading | done

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      // Hide the phone-OTP placeholder email so users can fill in a real one.
      email: isPlaceholderEmail(user.email) ? '' : user.email || '',
      passportPhoto: user.passportPhoto || user.avatar || '',
    });
  }, [user]);

  const emailValid =
    !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5 MB)');
      return;
    }
    setPhotoState('uploading');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, passportPhoto: data.url }));
      setPhotoState('done');
      toast.success('Photo uploaded');
      setTimeout(() => setPhotoState('idle'), 1500);
    } catch (err) {
      setPhotoState('idle');
      toast.error(err?.response?.data?.error || 'Upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailValid) {
      setError("That doesn't look like a valid email.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        passportPhoto: form.passportPhoto || '',
      };
      // Only send email if the user typed one (don't accidentally clear or revert).
      if (form.email.trim()) payload.email = form.email.trim();
      const { data } = await api.patch('/users/me', payload);
      if (typeof setUser === 'function') setUser(data.user);
      toast.success('Profile updated');
      navigate(-1);
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isWorker = user?.role === 'worker';
  const showEmailField = !user?.email || isPlaceholderEmail(user?.email);

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
            'radial-gradient(60rem 60rem at 12% 0%, rgba(26,26,26,0.06), transparent 60%)',
        }}
      />

      <section
        className="relative px-4 sm:px-6"
        style={{
          paddingTop: 'calc(6rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto w-full max-w-2xl">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45 }}
            className="mb-6 flex items-start gap-4"
          >
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="rounded-full border-2 border-ink/15 bg-paper p-2 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper.04]:border-paper:bg-paper:text-ink"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tightish text-ink sm:text-4xl">
                Edit my profile
              </h1>
              <p className="mt-1 text-sm text-ink/60">
                Update your personal details. Workers manage KYC documents on the dedicated worker page.
              </p>
            </div>
          </motion.div>

          <motion.form
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.05 }}
            onSubmit={handleSubmit}
            className="space-y-5 rounded-[28px] border border-ink/10 bg-paper/95 p-5 shadow-card backdrop-blur-xl sm:p-7"
          >
            <Section title="Personal information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Full name"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="First and last name"
                  autoComplete="name"
                  required
                  leadingIcon={<UserIcon size={16} />}
                />
                <Field
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  placeholder="10-digit number"
                  autoComplete="tel"
                  leadingIcon={<Phone size={16} />}
                />
              </div>

              {showEmailField && (
                <div className="mt-4">
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    placeholder="you@example.com"
                    autoComplete="email"
                    leadingIcon={<Mail size={16} />}
                    error={!emailValid}
                    helper={!emailValid ? "Doesn't look right" : 'For receipts and notifications'}
                  />
                </div>
              )}
            </Section>

            <Section title="Profile photo">
              <Field
                label="Image URL"
                type="url"
                value={form.passportPhoto}
                onChange={(v) => setForm((f) => ({ ...f, passportPhoto: v }))}
                placeholder="https://… (or upload below)"
                leadingIcon={<ImageIcon size={16} />}
              />
              <div className="mt-3 grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_auto]">
                <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/15 bg-ink/[0.02] px-3 py-3 text-xs font-medium text-ink/70 transition-colors hover:border-ink/40.03]:border-paper/40">
                  {photoState === 'uploading' ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                      Uploading…
                    </>
                  ) : photoState === 'done' ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <Upload size={13} /> Choose image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={photoState === 'uploading'}
                    onChange={(e) => uploadPhoto(e.target.files?.[0])}
                    className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
                  />
                </label>
                {form.passportPhoto && (
                  <img
                    src={form.passportPhoto}
                    alt="Profile photo preview"
                    className="h-16 w-16 rounded-xl border-2 border-ink/15 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </Section>

            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-900.06]">
              <div className="font-semibold">Manage your KYC</div>
              <p className="mt-1 text-xs">
                {isWorker 
                  ? "Workers verify identity on a dedicated KYC page that supports Aadhaar, PAN and selfie uploads."
                  : "Verify your identity on the dedicated KYC page to unlock all platform features."}
              </p>
              <button
                type="button"
                onClick={() => navigate(isWorker ? '/worker/kyc' : '/me/kyc')}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:opacity-90"
              >
                Open KYC page →
              </button>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border-2 border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink:border-paper"
              >
                Cancel
              </button>
              <div className="sm:w-auto sm:min-w-[200px]">
                <PrimaryCTA loading={loading} label="Save changes" />
              </div>
            </div>
          </motion.form>
        </div>
      </section>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
        {title}
      </h2>
      {children}
    </section>
  );
}
