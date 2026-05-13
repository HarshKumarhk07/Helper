import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  Wallet,
  Star,
  Calendar,
  Wifi,
  WifiOff,
  FileText,
  Eye,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { getWorkerProfile, approveKyc, rejectKyc } from '../../api/kyc.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatPrice, formatDateTime } from '../../lib/booking.js';

const KYC_BADGE = {
  pending: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/60',
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  verified: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};

const STATUS_BADGE = {
  placed: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/60',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  completed: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function AdminWorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    getWorkerProfile(id)
      .then(setData)
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Worker not found');
        navigate('/admin/workers');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleApprove = async () => {
    if (!isAdmin) return;
    setWorking(true);
    try {
      await approveKyc(id);
      toast.success('KYC approved');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async () => {
    if (!isAdmin) return;
    if (!rejectReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    setWorking(true);
    try {
      await rejectKyc(id, rejectReason.trim());
      toast.success('KYC rejected');
      setRejectMode(false);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rejection failed');
    } finally {
      setWorking(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardShell eyebrow="Worker" title="Loading…">
        <div className="skeleton h-64 w-full" />
      </DashboardShell>
    );
  }

  const { worker, availability, earnings, bookings, reviews } = data;
  const docs = worker.kycDocuments || {};

  return (
    <DashboardShell eyebrow="Worker profile" title={worker.name}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {(worker.passportPhoto || worker.avatar) && (
            <img
              src={worker.passportPhoto || worker.avatar}
              alt={worker.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-ink/10 dark:border-paper/10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <Link
            to="/admin/workers"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper"
          >
            <ArrowLeft size={12} /> Back to KYC queue
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span
            className={`rounded-full px-3 py-1 font-medium uppercase tracking-widest ${
              KYC_BADGE[worker.kycStatus] || KYC_BADGE.pending
            }`}
          >
            KYC {worker.kycStatus || 'pending'}
          </span>
          {availability && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium uppercase tracking-widest ${
                availability.online
                  ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300'
                  : 'bg-ink/10 text-ink/60 dark:bg-paper/10 dark:text-paper/60'
              }`}
            >
              {availability.online ? <Wifi size={11} /> : <WifiOff size={11} />}
              {availability.online ? 'Online' : 'Offline'}
            </span>
          )}
          <span className="text-ink/55 dark:text-paper/45">
            {worker.email} {worker.phone ? `· ${worker.phone}` : ''}
          </span>
        </div>
      </div>

      {worker.kycStatus === 'rejected' && worker.kycRejectionReason && (
        <FadeUp>
          <div className="mb-5 rounded-2xl border border-red-300 bg-red-50/60 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/5 dark:text-red-200">
            <div className="text-xs uppercase tracking-widest opacity-80">
              Last rejection
            </div>
            <div className="mt-1">{worker.kycRejectionReason}</div>
          </div>
        </FadeUp>
      )}

      {/* KPI row */}
      <FadeUp>
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Net earnings"
            value={formatPrice(earnings.net)}
            sub={`${earnings.jobs} jobs`}
          />
          <Stat
            label="Pending payout"
            value={formatPrice(earnings.pending)}
            sub="awaiting settlement"
            tone="amber"
          />
          <Stat
            label="Avg rating"
            value={
              reviews.count > 0
                ? `${reviews.average.toFixed(1)} ★`
                : '—'
            }
            sub={`${reviews.count} review${reviews.count === 1 ? '' : 's'}`}
          />
          <Stat
            label="Completion rate"
            value={
              bookings.stats.total > 0
                ? `${Math.round((bookings.stats.completed / bookings.stats.total) * 100)}%`
                : '—'
            }
            sub={`${bookings.stats.completed} / ${bookings.stats.total} jobs`}
          />
        </div>
      </FadeUp>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Main column */}
        <div className="space-y-6">
          {/* KYC documents */}
          <div className="card-rounded p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                KYC documents
              </div>
              <div className="text-xs text-ink/55 dark:text-paper/45">
                Submitted {fmtDate(worker.kycSubmittedAt)}
                {worker.kycReviewedAt && ` · Reviewed ${fmtDate(worker.kycReviewedAt)}`}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DocPreview label="Aadhaar Front" url={docs.aadhaarFront} />
              <DocPreview label="Aadhaar Back" url={docs.aadhaarBack} />
              <DocPreview label="PAN Card" url={docs.panCard} />
              <DocPreview label="Selfie" url={docs.selfie} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Aadhaar number
                </div>
                <div className="mt-1 font-mono">{worker.aadhaarNumber || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  PAN number
                </div>
                <div className="mt-1 font-mono">{worker.panNumber || '—'}</div>
              </div>
            </div>

            {isAdmin && worker.kycStatus !== 'verified' && (
              <div className="mt-5 border-t border-ink/10 pt-4 dark:border-paper/10">
                {rejectMode ? (
                  <div>
                    <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                      Rejection reason
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Visible to the worker via email/SMS."
                      className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none dark:border-paper/15 dark:focus:border-paper/60"
                    />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => {
                          setRejectMode(false);
                          setRejectReason('');
                        }}
                        className="pill-btn text-xs"
                        disabled={working}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={working || !rejectReason.trim()}
                        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-xs uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <ShieldAlert size={13} /> Reject KYC
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => setRejectMode(true)}
                      disabled={working}
                      className="inline-flex items-center gap-2 rounded-full border border-red-400 px-5 py-2 text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                    >
                      <ShieldAlert size={13} /> Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={working}
                      className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-xs uppercase tracking-widest text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <ShieldCheck size={13} /> Approve KYC
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent jobs */}
          <div className="card-rounded p-5">
            <div className="mb-3 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Recent jobs
            </div>
            {bookings.recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/55 dark:border-paper/15 dark:text-paper/45">
                No jobs assigned yet.
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.recent.map((b) => (
                  <div
                    key={b._id}
                    className="grid grid-cols-1 items-center gap-3 rounded-xl border border-ink/10 p-3 sm:grid-cols-[auto_1fr_auto] dark:border-paper/10"
                  >
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest ${
                        STATUS_BADGE[b.status] || ''
                      }`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                    <div>
                      <div className="font-mono text-xs text-ink/55 dark:text-paper/45">
                        {b.code}
                      </div>
                      <div className="text-sm">
                        {b.service?.name || 'Service'} · {b.user?.name || 'Customer'}
                      </div>
                      <div className="text-xs text-ink/55 dark:text-paper/45">
                        {b.scheduledAt
                          ? `Scheduled ${formatDateTime(b.scheduledAt)}`
                          : `Created ${formatDateTime(b.createdAt)}`}
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold tabular-nums">
                      {formatPrice(b.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent reviews */}
          <div className="card-rounded p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                Recent reviews
              </div>
              {reviews.count > 0 && (
                <div className="inline-flex items-center gap-1 text-sm">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{reviews.average.toFixed(1)}</span>
                  <span className="text-ink/55 dark:text-paper/45">
                    · {reviews.count}
                  </span>
                </div>
              )}
            </div>
            {reviews.recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/55 dark:border-paper/15 dark:text-paper/45">
                No reviews yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {reviews.recent.map((r) => (
                  <li
                    key={r._id}
                    className="rounded-xl border border-ink/10 p-3 dark:border-paper/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">
                          {r.user?.name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-ink/55 dark:text-paper/45">
                          {r.booking?.service?.name || '—'} · {r.booking?.code || ''}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 text-sm">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {r.rating}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm text-ink/75 dark:text-paper/65">
                        {r.comment}
                      </p>
                    )}
                    <div className="mt-1 text-xs text-ink/45 dark:text-paper/35">
                      {fmtDate(r.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Earnings breakdown */}
          <div className="card-rounded p-5">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              <Wallet size={14} /> Earnings
            </div>
            <Row label="Gross" value={formatPrice(earnings.gross)} />
            <Row label="Commission" value={`− ${formatPrice(earnings.commission)}`} />
            <div className="my-2 border-t border-ink/10 dark:border-paper/10" />
            <Row label="Net total" value={formatPrice(earnings.net)} bold />
            <Row label="Settled" value={formatPrice(earnings.settled)} positive />
            <Row label="Pending" value={formatPrice(earnings.pending)} amber />
            <div className="mt-3">
              <Link
                to={`/admin/payouts`}
                className="text-xs uppercase tracking-widest underline"
              >
                Open payouts queue →
              </Link>
            </div>
          </div>

          {/* Booking funnel */}
          <div className="card-rounded p-5">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              <FileText size={14} /> Booking funnel
            </div>
            <Row label="Total" value={bookings.stats.total} />
            <Row label="Assigned" value={bookings.stats.assigned} />
            <Row label="In progress" value={bookings.stats.inProgress} />
            <Row label="Completed" value={bookings.stats.completed} positive />
            <Row label="Cancelled" value={bookings.stats.cancelled} amber />
          </div>

          {/* Schedule */}
          {availability && (
            <div className="card-rounded p-5">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                <Calendar size={14} /> Weekly schedule
              </div>
              <ul className="space-y-1 text-sm">
                {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                  const entry = (availability.weeklySchedule || []).find(
                    (s) => s.dayOfWeek === dow
                  );
                  const active = entry?.active;
                  return (
                    <li
                      key={dow}
                      className={`flex items-center justify-between rounded-lg px-2 py-1 ${
                        active ? '' : 'opacity-50'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                        {DAY_LABELS[dow]}
                      </span>
                      <span className="tabular-nums">
                        {active ? `${entry.start} – ${entry.end}` : 'Closed'}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 text-xs text-ink/55 dark:text-paper/45">
                Last seen{' '}
                {availability.lastSeenAt
                  ? new Date(availability.lastSeenAt).toLocaleString()
                  : '—'}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value, sub, tone }) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-300 bg-amber-50/50 dark:border-amber-400/20 dark:bg-amber-400/5'
      : 'border-ink/10 dark:border-paper/10';
  return (
    <div className={`card-rounded p-4 sm:p-5 border ${toneClass}`}>
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">{sub}</div>
    </div>
  );
}

function Row({ label, value, bold, positive, amber }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? 'font-semibold' : ''} ${
          positive ? 'text-green-700 dark:text-green-300' : ''
        } ${amber ? 'text-amber-700 dark:text-amber-300' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function DocPreview({ label, url }) {
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
        />
      )}
    </a>
  );
}
