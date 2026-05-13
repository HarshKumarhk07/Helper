import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  Upload,
  FileText,
  RefreshCw,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { getMyKyc, submitKyc } from '../../api/kyc.js';

const FIELDS = [
  { key: 'aadhaarFront', label: 'Aadhaar Front', required: true },
  { key: 'aadhaarBack', label: 'Aadhaar Back', required: false },
  { key: 'panCard', label: 'PAN Card', required: true },
  { key: 'selfie', label: 'Live Selfie', required: false },
];

const STATUS_BANNER = {
  pending: {
    Icon: Hourglass,
    tone: 'bg-ink/5 text-ink/80',
    title: 'KYC not submitted',
    body: 'Upload your documents to verify your identity.',
  },
  submitted: {
    Icon: Hourglass,
    tone: 'bg-amber-100 text-amber-800',
    title: 'Under review',
    body: 'Our team is reviewing your documents. You\'ll be notified once a decision is made.',
  },
  verified: {
    Icon: ShieldCheck,
    tone: 'bg-green-100 text-green-700',
    title: 'KYC verified',
    body: 'Your identity has been verified.',
  },
  rejected: {
    Icon: ShieldAlert,
    tone: 'bg-red-100 text-red-700',
    title: 'KYC rejected',
    body: 'Please review the reason below and re-upload the requested documents.',
  },
};

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

const isPdf = (file) => file?.type === 'application/pdf';

export default function UserKyc() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    setLoading(true);
    getMyKyc()
      .then((res) => {
        setData(res);
        setAadhaarNumber(res.aadhaarNumber || '');
        setPanNumber(res.panNumber || '');
      })
      .catch(() => toast.error('Failed to load KYC status'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFile = (key, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5 MB)');
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (!isPdf(file)) {
      const reader = new FileReader();
      reader.onload = () => setPreviews((prev) => ({ ...prev, [key]: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => ({ ...prev, [key]: 'pdf' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ''))) {
      toast.error('Aadhaar must be 12 digits');
      return;
    }
    if (panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber.toUpperCase())) {
      toast.error('PAN must be in format ABCDE1234F');
      return;
    }

    const hasExistingAadhaar = !!data?.documents?.aadhaarFront;
    const hasExistingPan = !!data?.documents?.panCard;
    const hasNewAadhaar = !!files.aadhaarFront;
    const hasNewPan = !!files.panCard;

    if (!hasExistingAadhaar && !hasNewAadhaar) {
      toast.error('Aadhaar Front is required');
      return;
    }
    if (!hasExistingPan && !hasNewPan) {
      toast.error('PAN Card is required');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('aadhaarNumber', aadhaarNumber.replace(/\s/g, ''));
      fd.append('panNumber', panNumber.toUpperCase());
      Object.entries(files).forEach(([key, file]) => fd.append(key, file));
      await submitKyc(fd);
      toast.success('KYC submitted for review');
      setFiles({});
      setPreviews({});
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell eyebrow="Profile" title="KYC verification">
        <div className="text-sm text-ink/60">Loading…</div>
      </DashboardShell>
    );
  }

  const banner = STATUS_BANNER[data?.kycStatus] || STATUS_BANNER.pending;
  const Icon = banner.Icon;
  const isVerified = data?.kycStatus === 'verified';

  return (
    <DashboardShell eyebrow="Profile" title="KYC verification">
      <FadeUp>
        <div className={`mb-6 flex items-start gap-4 rounded-2xl p-5 ${banner.tone}`}>
          <Icon size={28} className="mt-1 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold uppercase tracking-widest">{banner.title}</div>
            <div className="mt-1 text-sm">{banner.body}</div>
            {data?.kycStatus === 'rejected' && data?.rejectionReason && (
              <div className="mt-3 rounded-xl bg-white/60 p-3 text-sm text-red-700">
                <div className="text-xs uppercase tracking-widest opacity-80">Reason</div>
                <div className="mt-1">{data.rejectionReason}</div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs opacity-80">
              <span>Submitted: {fmt(data?.submittedAt)}</span>
              <span>Reviewed: {fmt(data?.reviewedAt)}</span>
            </div>
          </div>
          <button
            onClick={refresh}
            className="hidden rounded-full p-2 transition hover:bg-black/10 md:inline-flex:bg-white/10"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </FadeUp>

      <FadeUp>
        <form
          onSubmit={handleSubmit}
          className="card-rounded grid grid-cols-1 gap-5 p-5 md:p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-ink/60">
                Aadhaar number
              </label>
              <input
                inputMode="numeric"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) =>
                  setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))
                }
                placeholder="12-digit Aadhaar"
                disabled={isVerified}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-base focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-ink/60">
                PAN number
              </label>
              <input
                maxLength={10}
                value={panNumber}
                onChange={(e) =>
                  setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
                }
                placeholder="ABCDE1234F"
                disabled={isVerified}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-base uppercase focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, required }) => {
              const existingUrl = data?.documents?.[key];
              const newPreview = previews[key];
              const showPreview = newPreview || existingUrl;
              const isPdfPreview = newPreview === 'pdf' || /\.pdf(\?|$)/i.test(existingUrl || '');
              return (
                <label
                  key={key}
                  className={`group relative flex flex-col rounded-2xl border-2 border-dashed p-4 transition cursor-pointer ${
                    isVerified
                      ? 'border-ink/10 opacity-60 cursor-not-allowed'
                      : 'border-ink/20 hover:border-ink/50:border-paper/50'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink/60">
                    <span>
                      {label} {required && <span className="text-red-500">*</span>}
                    </span>
                    {!isVerified && <Upload size={14} />}
                  </div>

                  {showPreview ? (
                    isPdfPreview ? (
                      <div className="flex h-40 items-center justify-center rounded-xl bg-ink/5">
                        <FileText size={36} className="text-ink/40" />
                      </div>
                    ) : (
                      <img
                        src={newPreview || existingUrl}
                        alt={label}
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-ink/5 text-xs text-ink/50">
                      <Upload size={24} className="mb-2" />
                      Tap to upload
                    </div>
                  )}

                  {existingUrl && !newPreview && (
                    <a
                      href={existingUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 text-center text-xs text-ink/60 underline"
                    >
                      View current
                    </a>
                  )}
                  {files[key] && (
                    <div className="mt-2 truncate text-center text-xs text-ink/70">
                      {files[key].name}
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={isVerified}
                    capture={key === 'selfie' ? 'user' : undefined}
                    onChange={(e) => handleFile(key, e.target.files?.[0])}
                    className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                </label>
              );
            })}
          </div>

          {!isVerified && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="pill-btn-solid disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting…'
                  : data?.kycStatus === 'rejected'
                  ? 'Resubmit KYC'
                  : 'Submit KYC'}
              </button>
            </div>
          )}
        </form>
      </FadeUp>
    </DashboardShell>
  );
}
