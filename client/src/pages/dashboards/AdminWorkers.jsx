import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldX, ShieldAlert, FileText, Eye, Wrench, X } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import {
  listKycSubmissions,
  approveKyc,
  rejectKyc,
} from '../../api/kyc.js';
import { mediaUrl } from '../../lib/catalogImage.js';
import WorkerServicesOverride from '../../components/admin/WorkerServicesOverride.jsx';
import useAdminSeen from '../../hooks/useAdminSeen.js';

const STATUS_TABS = [
  { key: 'submitted', label: 'Pending Review' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'pending', label: 'Not Submitted' },
  { key: 'all', label: 'All' },
];

const KYC_BADGE = {
  pending: 'bg-ink/10 text-ink/70',
  submitted: 'bg-amber-100 text-amber-800',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

const DocPreview = ({ label, url: rawUrl }) => {
  const url = mediaUrl(rawUrl);
  if (!url) {
    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-ink/15 bg-sand/10 p-3 text-xs text-ink/60">
        <div className="flex min-h-[2.5rem] items-start justify-between text-[10px] font-bold uppercase tracking-wider text-ink/60">
          <span className="leading-tight">{label}</span>
        </div>
        <div className="flex h-28 w-full items-center justify-center rounded-xl bg-ink/5 text-xs text-ink/40">
          Not uploaded
        </div>
      </div>
    );
  }
  const isPdf = /\.pdf(\?|$)/i.test(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex h-full flex-col justify-between rounded-2xl border border-ink/15 bg-sand/10 p-3 transition hover:border-ink/40 hover:bg-sand/20 hover:shadow-sm"
    >
      <div className="mb-2 flex min-h-[2.5rem] items-start justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-ink/75">
        <span className="leading-tight">{label}</span>
        <Eye size={14} className="mt-0.5 shrink-0 text-ink/40 transition group-hover:text-ink" />
      </div>
      {isPdf ? (
        <div className="flex h-28 w-full items-center justify-center rounded-xl bg-ink/5 transition group-hover:bg-ink/10">
          <FileText size={28} className="text-ink/40" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-ink/5">
          <img
            src={url}
            alt={label}
            className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </a>
  );
};

export default function AdminWorkers() {
  const [status, setStatus] = useState('submitted');
  const [q, setQ] = useState('');
  const [workers, setWorkers] = useState([]);
  const [counts, setCounts] = useState({ all: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  // Worker whose service enrolments are being managed in the modal.
  const [servicesFor, setServicesFor] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Clears the dashboard "KYC approval" badge on open; returns the previous
  // visit time so freshly-submitted applications can be flagged as NEW.
  const previousSeen = useAdminSeen('kyc');
  const isNew = (w) =>
    previousSeen &&
    w.kycStatus === 'submitted' &&
    w.kycSubmittedAt &&
    new Date(w.kycSubmittedAt) > previousSeen;

  const load = () => {
    setLoading(true);
    listKycSubmissions({ status, q, page, limit: 10 })
      .then((res) => {
        setWorkers(res.workers || []);
        if (res.counts) setCounts(res.counts);
        setPagination(res.pagination || null);
      })
      .catch(() => toast.error('Failed to load KYC submissions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [status, q]);

  useEffect(() => {
    load();
  }, [status, q, page]);

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
    <DashboardShell eyebrow="Operations" title="KYC verification">
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
                      ? 'bg-ink text-paper'
                      : 'border border-ink/15 hover:border-ink/40'
                  }`}
                >
                  {tab.label}
                  {counts[tab.key] != null && (
                    <span className="ml-2 opacity-70">
                      {counts[tab.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none md:w-72"
          />
        </div>
      </FadeUp>

      <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
            <tr>
              <th className="p-4 font-normal">Worker</th>
              <th className="p-4 font-normal">KYC Status</th>
              <th className="p-4 font-normal">Services</th>
              <th className="p-4 font-normal">Submitted / Reviewed</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan="5" className="p-4">
                    <div className="skeleton h-10 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-ink/50">
                  No submissions found.
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr
                  key={w._id}
                  className={`transition-colors hover:bg-sand/30 group ${
                    isNew(w) ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-ink/5 flex items-center justify-center text-ink/60 font-bold uppercase shrink-0">
                        {w.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-ink flex items-center gap-2">
                          {w.name}
                          {isNew(w) && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                              New
                            </span>
                          )}
                          {w.role && (
                            <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[9px] uppercase tracking-widest text-ink/60">
                              {w.role}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink/60 mt-0.5">{w.email}</div>
                        <div className="text-[11px] text-ink/60">{w.phone || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                        w.kycStatus === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : 
                        w.kycStatus === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                        w.kycStatus === 'pending' ? 'bg-ink/5 text-ink/60 border-ink/10' : 
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {w.kycStatus || 'pending'}
                    </span>
                    {w.kycStatus === 'rejected' && w.kycRejectionReason && (
                      <div className="mt-1.5 text-[10px] font-medium text-red-600 line-clamp-1 max-w-[200px]" title={w.kycRejectionReason}>
                        {w.kycRejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top pt-5">
                    {w.role === 'worker' ? (
                      <button
                        onClick={() => setServicesFor(w)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest text-ink transition hover:bg-ink hover:text-paper"
                        title="Assign or remove services for this worker"
                      >
                        <Wrench size={12} />
                        {w.serviceCount || 0}
                      </button>
                    ) : (
                      <span className="text-xs text-ink/35">—</span>
                    )}
                  </td>
                  <td className="p-4 align-top pt-5 text-xs text-ink/60">
                    <div className="font-medium text-ink/80">{fmtDate(w.kycSubmittedAt)}</div>
                    {w.kycReviewedAt && (
                      <div className="mt-1 text-[10px] uppercase tracking-widest">
                        Rev: {fmtDate(w.kycReviewedAt)} {w.kycReviewedBy?.name ? `by ${w.kycReviewedBy.name}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top pt-5 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelected(w);
                          setRejectMode(false);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-ink/20 bg-sand/30 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors focus:outline-none"
                      >
                        Review
                      </button>
                      {w.role === 'worker' && (
                        <Link
                          to={`/admin/workers/${w._id}`}
                          className="text-[10px] uppercase tracking-widest font-bold text-blue-600 hover:underline hover:text-blue-700"
                        >
                          Profile →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4 text-ink">
          <div className="text-xs text-ink/60">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} total records)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium hover:bg-sand/30 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium hover:bg-sand/30 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Manage a worker's service enrolments without leaving the list.
          Reuses the same panel as the full profile, so behaviour stays in one
          place. Closing reloads so the Services count in the row is current. */}
      {servicesFor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-paper">
                <div className="text-[10px] uppercase tracking-widest opacity-60">
                  Manage services
                </div>
                <div className="text-lg font-semibold">{servicesFor.name}</div>
              </div>
              <button
                onClick={() => {
                  setServicesFor(null);
                  load();
                }}
                className="rounded-full bg-paper/10 p-2 text-paper transition hover:bg-paper/20"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {servicesFor.kycStatus !== 'verified' && (
              <div className="mb-3 rounded-xl border border-amber-300/40 bg-amber-100/90 px-3 py-2 text-xs text-amber-900">
                This worker's KYC is <strong>{servicesFor.kycStatus || 'pending'}</strong>. You can
                assign services, but they won't be bookable until KYC is verified and their account
                is active.
              </div>
            )}

            <WorkerServicesOverride workerId={servicesFor._id} />
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-3xl border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60">
                  KYC Review
                </div>
                <h3 className="heading-display mt-2 text-2xl">{selected.name}</h3>
                <p className="mt-1 text-sm text-ink/70">
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
                <div className="text-xs uppercase tracking-widest text-ink/60">
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
                <div className="text-xs uppercase tracking-widest text-ink/60">
                  Aadhaar
                </div>
                <div className="mt-1 font-mono">{selected.aadhaarNumber || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60">
                  PAN
                </div>
                <div className="mt-1 font-mono">{selected.panNumber || '—'}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {selected.kycDocuments?.companyLogo && <DocPreview label="Company Logo" url={selected.kycDocuments.companyLogo} />}
              {selected.kycDocuments?.founderImage && <DocPreview label="Founder Image" url={selected.kycDocuments.founderImage} />}
              {selected.kycDocuments?.companyLicense && <DocPreview label="Company License" url={selected.kycDocuments.companyLicense} />}
              {selected.kycDocuments?.gstCertificate && <DocPreview label="GST Certificate" url={selected.kycDocuments.gstCertificate} />}
              <DocPreview label="Aadhaar Front" url={selected.kycDocuments?.aadhaarFront} />
              <DocPreview label="Aadhaar Back" url={selected.kycDocuments?.aadhaarBack} />
              <DocPreview label="PAN Card" url={selected.kycDocuments?.panCard} />
              <DocPreview label="Worker Profile Image" url={selected.kycDocuments?.selfie} />
            </div>

            {selected.kycStatus === 'rejected' && selected.kycRejectionReason && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                <div className="text-xs uppercase tracking-widest opacity-80">
                  Previous rejection
                </div>
                <div className="mt-1">{selected.kycRejectionReason}</div>
              </div>
            )}

            {rejectMode ? (
              <div className="mt-5">
                <label className="text-xs uppercase tracking-widest text-ink/60">
                  Rejection reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none:border-paper/60"
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
                    className="inline-flex items-center gap-2 rounded-full border border-red-400 px-5 py-2 text-xs uppercase tracking-widest text-red-600 transition hover:bg-red-50 disabled:opacity-50:bg-red-400/10"
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
