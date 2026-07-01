import { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Building2,
  MapPin,
  GraduationCap,
  Upload,
  FileText,
  ArrowLeft,
  Hourglass,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, PrimaryCTA, ErrorBanner } from '../components/auth/AuthFormPrimitives.jsx';
import LoadingScreen from '../components/ui/LoadingScreen.jsx';
import { submitKyc } from '../api/kyc.js';

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
  const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || '';
  if (status === 409 || /already in use/i.test(msg)) return 'An account with this email already exists. Try signing in.';
  if (/password/i.test(msg) && /8/.test(msg)) return 'Password must be at least 8 characters.';
  if (/email/i.test(msg)) return "That doesn't look like a valid email.";
  return msg || 'Could not create your account. Please try again.';
};

const KYC_FIELDS = [
  { key: 'aadhaarFront', label: 'Aadhaar Front', required: true },
  { key: 'aadhaarBack', label: 'Aadhaar Back', required: false },
  { key: 'panCard', label: 'PAN Card', required: true },
  { key: 'selfie', label: 'Profile Photo (Selfie)', required: true },
];
const WORKER_STEPS = ['Account', 'Details', 'Verify'];

export default function JoinApply() {
  const { signup, logout, isAuthenticated, bootstrapping } = useAuth();
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const [role, setRole] = useState(query.get('role') === 'brand' ? 'brand' : 'worker');

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [brandForm, setBrandForm] = useState({ companyName: '', businessType: '', companyAddress: '' });
  const [proForm, setProForm] = useState({ experienceYears: '', address: '', education: '' });
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const skipRedirect = useRef(false);

  const strength = useMemo(() => scorePassword(form.password), [form.password]);
  const fieldErrors = useMemo(() => {
    const errs = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (form.password && form.password.length < 8) errs.password = 'At least 8 characters.';
    return errs;
  }, [form.email, form.password]);

  if (bootstrapping) return <LoadingScreen />;
  if (isAuthenticated && !skipRedirect.current) return <Navigate to="/dashboard" replace />;

  const isWorker = role === 'worker';

  const accountValid =
    form.name.trim().length >= 2 &&
    !fieldErrors.email &&
    form.email.trim().length > 0 &&
    !fieldErrors.password &&
    form.password.length >= 8 &&
    agreed &&
    (isWorker || (brandForm.companyName.trim().length >= 2 && brandForm.companyAddress.trim().length >= 5));

  const detailsValid =
    String(proForm.experienceYears).trim() !== '' &&
    Number(proForm.experienceYears) >= 0 &&
    proForm.address.trim().length >= 5;

  const handleFile = (key, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5 MB)');
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (file.type === 'application/pdf') setPreviews((prev) => ({ ...prev, [key]: 'pdf' }));
    else {
      const reader = new FileReader();
      reader.onload = () => setPreviews((prev) => ({ ...prev, [key]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const switchRole = (r) => {
    setRole(r);
    setStep(0);
    setError('');
  };

  // Step 0 submit
  const onSubmitAccount = async (e) => {
    e.preventDefault();
    setError('');
    if (!accountValid) return;

    if (isWorker) {
      setStep(1);
      return;
    }

    // Brand: create the account, then send them to complete brand KYC.
    setSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: 'brand',
      });
      toast.success('Brand account created — complete your verification');
      navigate('/dashboard', { replace: true }); // RoleRedirect → /brand/kyc
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const goToKyc = (e) => {
    e.preventDefault();
    setError('');
    if (!detailsValid) return;
    setStep(2);
  };

  const onSubmitWorker = async (e) => {
    e.preventDefault();
    setError('');
    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ''))) return toast.error('Aadhaar must be 12 digits');
    if (panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber.toUpperCase())) return toast.error('PAN must be in format ABCDE1234F');
    if (!files.aadhaarFront) return toast.error('Aadhaar Front is required');
    if (!files.panCard) return toast.error('PAN Card is required');
    if (!files.selfie) return toast.error('Profile Photo (Selfie) is required');

    setSubmitting(true);
    skipRedirect.current = true;
    try {
      if (!accountCreated) {
        await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: 'worker',
          experienceYears: Number(proForm.experienceYears) || 0,
          address: proForm.address.trim(),
          education: proForm.education.trim(),
        });
        setAccountCreated(true);
      }
      const fd = new FormData();
      fd.append('aadhaarNumber', aadhaarNumber.replace(/\s/g, ''));
      fd.append('panNumber', panNumber.toUpperCase());
      Object.entries(files).forEach(([key, file]) => fd.append(key, file));
      await submitKyc(fd);
      setShowReview(true);
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
      toast.error(message);
      if (!accountCreated) skipRedirect.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewOk = async () => {
    setShowReview(false);
    try {
      await logout();
    } catch {
      /* ignore */
    }
    skipRedirect.current = false;
    navigate('/', { replace: true });
  };

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-paper" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(60rem 60rem at 12% 0%, rgba(26,26,26,0.06), transparent 60%), radial-gradient(50rem 50rem at 100% 100%, rgba(26,26,26,0.05), transparent 55%)',
        }}
      />

      <section className="relative flex min-h-[100dvh] items-center justify-center px-4 sm:px-6" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))', paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[520px]"
        >
          <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-paper/95 shadow-card backdrop-blur-xl">
            <div className="px-6 pt-6 pb-1 sm:px-8 sm:pt-8">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/55">Join Helper</div>
              <h2 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-ink">
                {step === 0 && (isWorker ? 'Apply as a professional' : 'Register your brand')}
                {step === 1 && 'Your professional details'}
                {step === 2 && 'Identity verification'}
              </h2>

              {/* Role toggle (only on step 0) */}
              {step === 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => switchRole('worker')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      isWorker ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-sand/20 text-ink/75 hover:bg-sand/40'
                    }`}
                  >
                    <Briefcase size={14} /> Professional / Worker
                  </button>
                  <button
                    type="button"
                    onClick={() => switchRole('brand')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      !isWorker ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-sand/20 text-ink/75 hover:bg-sand/40'
                    }`}
                  >
                    <Building2 size={14} /> Brand / Company
                  </button>
                </div>
              )}

              {/* Worker step indicator */}
              {isWorker && (
                <div className="mt-4 flex items-center gap-2">
                  {WORKER_STEPS.map((label, i) => (
                    <div key={label} className="flex flex-1 items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                            i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-ink text-paper' : 'bg-ink/10 text-ink/50'
                          }`}
                        >
                          {i < step ? <Check size={13} /> : i + 1}
                        </span>
                        <span className={`hidden text-[11px] font-semibold uppercase tracking-wider sm:inline ${i === step ? 'text-ink' : 'text-ink/45'}`}>
                          {label}
                        </span>
                      </div>
                      {i < WORKER_STEPS.length - 1 && <div className="h-px flex-1 bg-ink/10" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 0 — account */}
            {step === 0 && (
              <form onSubmit={onSubmitAccount} className="space-y-4 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                <Field label="Full name" type="text" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="First and last name" autoComplete="name" required leadingIcon={<UserIcon size={16} />} />
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@example.com" autoComplete="email" required leadingIcon={<Mail size={16} />} error={!!fieldErrors.email} helper={fieldErrors.email} />
                <Field label="Phone" helper="We notify you here about your application" type="tel" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 XXXXX XXXXX" autoComplete="tel" leadingIcon={<Phone size={16} />} />

                {!isWorker && (
                  <>
                    <Field label="Company name" type="text" value={brandForm.companyName} onChange={(v) => setBrandForm((f) => ({ ...f, companyName: v }))} placeholder="Your registered company name" required leadingIcon={<Building2 size={16} />} />
                    <Field label="Business type" type="text" value={brandForm.businessType} onChange={(v) => setBrandForm((f) => ({ ...f, businessType: v }))} placeholder="e.g. Appliances, Cleaning supplies" leadingIcon={<Briefcase size={16} />} />
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65">Company address</label>
                      <textarea value={brandForm.companyAddress} onChange={(e) => setBrandForm((f) => ({ ...f, companyAddress: e.target.value }))} rows={2} required placeholder="Registered business address" className="w-full resize-none rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none" />
                    </div>
                    <p className="text-[10px] text-ink/50">
                      See our transparent{' '}
                      <Link to="/brand/pricing" className="font-semibold text-[#13294B] underline">Brand Pricing & Commission</Link>.
                    </p>
                  </>
                )}

                <div className="space-y-2">
                  <Field label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Minimum 8 characters" autoComplete="new-password" required leadingIcon={<Lock size={16} />} error={!!fieldErrors.password} helper={fieldErrors.password}
                    trailing={
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-ink/45 transition-colors hover:text-ink" tabIndex={-1}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  {form.password && (
                    <div className="flex items-center gap-2">
                      <div className="grid h-1.5 flex-1 grid-cols-5 gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span key={i} className={`rounded-full transition-colors duration-300 ${strength.score > i ? strengthBar[Math.min(strength.score, strengthBar.length - 1)] : 'bg-ink/10'}`} />
                        ))}
                      </div>
                      <span className="w-16 text-right text-[10px] font-medium uppercase tracking-[0.16em] text-ink/55">{strength.label}</span>
                    </div>
                  )}
                </div>

                <label className="group flex cursor-pointer select-none items-start gap-2 pt-1">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink" />
                  <span className="text-xs leading-relaxed text-ink/65">
                    I agree to the{' '}
                    <Link to="/terms" className="font-medium text-ink underline-offset-4 hover:underline">Terms</Link> and{' '}
                    <Link to="/privacy" className="font-medium text-ink underline-offset-4 hover:underline">Privacy Policy</Link>.
                  </span>
                </label>

                {error && <ErrorBanner>{error}</ErrorBanner>}

                <PrimaryCTA loading={submitting} label={isWorker ? 'Continue' : 'Create brand account'} disabled={!accountValid} />

                <div className="border-t border-ink/10 pt-5 text-center text-sm text-ink/75">
                  Already registered?{' '}
                  <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">Sign in</Link>
                </div>
              </form>
            )}

            {/* STEP 1 — professional details (worker) */}
            {step === 1 && (
              <form onSubmit={goToKyc} className="space-y-4 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                <Field label="Years of working experience" type="number" value={proForm.experienceYears} onChange={(v) => setProForm((f) => ({ ...f, experienceYears: v.replace(/[^\d]/g, '').slice(0, 2) }))} placeholder="e.g. 5" required leadingIcon={<Briefcase size={16} />} />
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65">Residential address</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-3 text-ink/45"><MapPin size={16} /></span>
                    <textarea value={proForm.address} onChange={(e) => setProForm((f) => ({ ...f, address: e.target.value }))} placeholder="House / street, area, city, state, pincode" rows={3} required className="w-full resize-none rounded-xl border border-ink/15 bg-transparent py-3 pl-10 pr-3 text-sm focus:border-ink focus:outline-none" />
                  </div>
                </div>
                <Field label="Education" helper="Optional" type="text" value={proForm.education} onChange={(v) => setProForm((f) => ({ ...f, education: v }))} placeholder="e.g. High school, ITI, Diploma" leadingIcon={<GraduationCap size={16} />} />

                {error && <ErrorBanner>{error}</ErrorBanner>}

                <div className="flex items-center gap-3 pt-1">
                  <button type="button" onClick={() => { setError(''); setStep(0); }} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink/75 transition hover:bg-ink/5">
                    <ArrowLeft size={15} /> Back
                  </button>
                  <div className="flex-1"><PrimaryCTA label="Continue" disabled={!detailsValid} /></div>
                </div>
              </form>
            )}

            {/* STEP 2 — KYC (worker) */}
            {step === 2 && (
              <form onSubmit={onSubmitWorker} className="space-y-5 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65">Aadhaar number</label>
                    <input inputMode="numeric" maxLength={12} value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit Aadhaar" className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/65">PAN number</label>
                    <input maxLength={10} value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="ABCDE1234F" className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm uppercase focus:border-ink focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {KYC_FIELDS.map(({ key, label, required }) => {
                    const preview = previews[key];
                    const isPdfPreview = preview === 'pdf';
                    return (
                      <div key={key} className="flex flex-col rounded-2xl border-2 border-dashed border-ink/20 p-3">
                        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-ink/60">
                          <span>{label} {required && <span className="text-red-500">*</span>}</span>
                          <Upload size={12} />
                        </div>
                        <label className="relative block cursor-pointer transition hover:opacity-90">
                          {preview ? (
                            isPdfPreview ? (
                              <div className="flex h-24 items-center justify-center rounded-xl bg-ink/5"><FileText size={28} className="text-ink/40" /></div>
                            ) : (
                              <img src={preview} alt={label} className="h-24 w-full rounded-xl object-cover" />
                            )
                          ) : (
                            <div className="flex h-24 flex-col items-center justify-center rounded-xl bg-ink/5 text-[10px] text-ink/50">
                              <Upload size={18} className="mb-1" /> Tap to upload
                            </div>
                          )}
                          <input type="file" accept="image/*,application/pdf" capture={key === 'selfie' ? 'user' : undefined} onChange={(e) => handleFile(key, e.target.files?.[0])} className="absolute inset-0 cursor-pointer opacity-0" />
                        </label>
                        {files[key] && <div className="mt-1.5 truncate text-center text-[10px] text-ink/70">{files[key].name}</div>}
                      </div>
                    );
                  })}
                </div>

                {error && <ErrorBanner>{error}</ErrorBanner>}

                <div className="flex items-center gap-3 pt-1">
                  <button type="button" disabled={submitting} onClick={() => { setError(''); setStep(1); }} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink/75 transition hover:bg-ink/5 disabled:opacity-50">
                    <ArrowLeft size={15} /> Back
                  </button>
                  <div className="flex-1"><PrimaryCTA loading={submitting} label="Submit for review" /></div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </section>

      {/* KYC under-review card */}
      <AnimatePresence>
        {showReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 8 }} transition={{ duration: 0.2 }} className="w-full max-w-md space-y-5 rounded-[24px] border border-ink/10 bg-paper p-7 shadow-card">
              <div className="flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Hourglass size={26} /></span>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-ink">Under review</h3>
                <p className="text-sm leading-relaxed text-ink/70">
                  Our team is reviewing your documents. You'll be notified once a decision is made.
                </p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2 text-center text-xs text-ink/65">
                You can sign in to your worker portal only after your KYC is approved.
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowReview(false)} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-ink/75 transition hover:bg-ink/5">Cancel</button>
                <button onClick={handleReviewOk} className="flex-1 rounded-full bg-ink py-2.5 text-sm font-semibold text-paper transition-transform duration-150 hover:opacity-95 active:scale-[0.99]">OK</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
