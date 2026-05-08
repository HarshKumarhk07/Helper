import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldX, ShieldAlert, FileText, Eye } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import {
  listKycSubmissions,
  approveKyc,
  rejectKyc,
} from '../../api/kyc.js';

const STATUS_TABS = [
  { key: 'submitted', label: 'Pending Review' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'pending', label: 'Not Submitted' },
  { key: 'all', label: 'All' },
];

const KYC_BADGE = {
  pending: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/60',
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  verified: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

const DocPreview = ({ label, url }) => {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-ink/15 p-3 text-xs text-ink/60 dark:border-paper/15 dark:text-paper/50">
        <div className="mb-1 uppercase tracking-widest">{label}</div>
        Not uploaded
      </div>
    );
  }
  const isPdf = /\.pdf(\?|$)/i.test(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-xl border border-ink/15 p-3 transition hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40"
    >
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        <span>{label}</span>
        <Eye size={14} className="opacity-60 group-hover:opacity-100" />
      </div>
      {isPdf ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-ink/5 dark:bg-paper/5">
          <FileText size={32} className="text-ink/40 dark:text-paper/40" />
        </div>
      ) : (
        <img
          src={url}
          alt={label}
          className="h-32 w-full rounded-lg object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </a>
  );
};

export default function AdminWorkers() {
  const [status, setStatus] = useState('submitted');
  const [q, setQ] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listKycSubmissions({ status, q })
      .then(setWorkers)
      .catch(() => toast.error('Failed to load workers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    if (!q.trim()) return workers;
    const needle = q.toLowerCase();
    return workers.filter(
      (w) =>
        w.name?.toLowerCase().includes(needle) ||
        w.email?.toLowerCase().includes(needle) ||
        w.phone?.toLowerCase().includes(needle)
    );
  }, [workers, q]);

  const counts = useMemo(() => {
    const acc = { all: workers.length };
    workers.forEach((w) => {
      acc[w.kycStatus] = (acc[w.kycStatus] || 0) + 1;
    });
    return acc;
  }, [workers]);

  const handleApprove = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await approveKyc(selected._id);
      toast.success(`Approved ${updated.name}`);
      setSelected(null);
      setRejectMode(false);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await rejectKyc(selected._id, rejectReason.trim());
      toast.success(`Rejected ${updated.name}`);
      setSelected(null);
      setRejectMode(false);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell eyebrow="Operations" title="Worker KYC">
      <FadeUp>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const active = tab.key === status;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatus(tab.key)}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
                    active
                      ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                      : 'border border-ink/15 hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40'
                  }`}
                >
                  {tab.label}
                  {tab.key !== 'all' && counts[tab.key] != null && (
                    <span className="ml-2 opacity-70">{counts[tab.key]}</span>
                  )}
                </button>
              );
            })}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none dark:border-paper/20 dark:focus:border-paper/60 md:w-72"
          />
        </div>
      </FadeUp>

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
            <tr>
              <th className="p-4 font-normal">Worker</th>
              <th className="p-4 font-normal">KYC</th>
              <th className="p-4 font-normal">Submitted</th>
              <th className="p-4 font-normal">Reviewed</th>
              <th className="p-4 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-ink/60 dark:text-paper/50">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-ink/60 dark:text-paper/50">
                  No workers in this state.
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr
                  key={w._id}
                  className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50"
                >
                  <td className="p-4">
                    <div className="font-medium">{w.name}</div>
                    <div className="text-xs text-ink/60 dark:text-paper/50">{w.email}</div>
                    <div className="text-xs text-ink/60 dark:text-paper/50">{w.phone || '—'}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
                        KYC_BADGE[w.kycStatus] || KYC_BADGE.pending
                      }`}
                    >
                      {w.kycStatus || 'pending'}
                    </span>
                    {w.kycStatus === 'rejected' && w.kycRejectionReason && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-300">
                        {w.kycRejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-xs text-ink/70 dark:text-paper/70">
                    {fmtDate(w.kycSubmittedAt)}
                  </td>
                  <td className="p-4 text-xs text-ink/70 dark:text-paper/70">
                    {fmtDate(w.kycReviewedAt)}
                    {w.kycReviewedBy?.name && (
                      <div className="text-ink/50 dark:text-paper/40">
                        by {w.kycReviewedBy.name}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setSelected(w);
                        setRejectMode(false);
                        setRejectReason('');
                      }}
                      className="text-xs uppercase tracking-widest hover:underline"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-3xl border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:border-paper/20 dark:bg-[#14151A] dark:text-paper">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  KYC Review
                </div>
                <h3 className="heading-display mt-2 text-2xl">{selected.name}</h3>
                <p className="mt-1 text-sm text-ink/70 dark:text-paper/60">
                  {selected.email} · {selected.phone || 'no phone'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setRejectMode(false);
                  setRejectReason('');
                }}
                className="pill-btn text-xs"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Status
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
                      KYC_BADGE[selected.kycStatus] || KYC_BADGE.pending
                    }`}
                  >
                    {selected.kycStatus || 'pending'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Aadhaar
                </div>
                <div className="mt-1 font-mono">{selected.aadhaarNumber || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  PAN
                </div>
                <div className="mt-1 font-mono">{selected.panNumber || '—'}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <DocPreview label="Aadhaar Front" url={selected.kycDocuments?.aadhaarFront} />
              <DocPreview label="Aadhaar Back" url={selected.kycDocuments?.aadhaarBack} />
              <DocPreview label="PAN Card" url={selected.kycDocuments?.panCard} />
              <DocPreview label="Selfie" url={selected.kycDocuments?.selfie} />
            </div>

            {selected.kycStatus === 'rejected' && selected.kycRejectionReason && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/5 dark:text-red-200">
                <div className="text-xs uppercase tracking-widest opacity-80">
                  Previous rejection
                </div>
                <div className="mt-1">{selected.kycRejectionReason}</div>
              </div>
            )}

            {rejectMode ? (
              <div className="mt-5">
                <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Rejection reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none dark:border-paper/20 dark:focus:border-paper/60"
                  placeholder="Explain what needs fixing — the worker sees this in email/SMS."
                />
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() => {
                      setRejectMode(false);
                      setRejectReason('');
                    }}
                    className="pill-btn text-xs"
                    disabled={submitting}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={submitting || !rejectReason.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-xs uppercase tracking-widest text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <ShieldX size={14} />
                    Reject KYC
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {selected.kycStatus !== 'verified' && (
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full border border-red-400 px-5 py-2 text-xs uppercase tracking-widest text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-400/10"
                  >
                    <ShieldAlert size={14} />
                    Reject
                  </button>
                )}
                {selected.kycStatus !== 'verified' && (
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-xs uppercase tracking-widest text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    Approve KYC
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
