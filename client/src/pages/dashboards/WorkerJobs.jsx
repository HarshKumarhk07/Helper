import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, MapPin, User as UserIcon, Check, X } from 'lucide-react';
import { listWorkerJobs, transitionStatus, rejectJob, sendQuote } from '../../api/bookings.js';
import StatusBadge from '../../components/booking/StatusBadge.jsx';
import { formatDateTime, formatPrice, BOOKING_STATUS } from '../../lib/booking.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import WorkerLocationEmitter from '../../components/booking/WorkerLocationEmitter.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const FILTERS = [
  { key: 'new', label: 'New requests' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const REJECT_REASONS = ['Too far', 'Not available', 'Low price', 'Other'];

const ACTIVE_STATUSES = [
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.EN_ROUTE,
  BOOKING_STATUS.IN_PROGRESS,
];

const fmtCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function WorkerJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectNote, setRejectNote] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNote, setQuoteNote] = useState('');

  const isQuoteReq = (b) => b.isQuoteRequest && b.quoteStatus !== 'accepted';

  const load = () => {
    setLoading(true);
    listWorkerJobs({})
      .then(setJobs)
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // 1-second tick drives the accept countdown on new requests.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'new')
      return jobs.filter((j) => j.status === BOOKING_STATUS.ASSIGNED || isQuoteReq(j));
    if (filter === 'active') return jobs.filter((j) => ACTIVE_STATUSES.includes(j.status) && !isQuoteReq(j));
    if (filter === 'completed') return jobs.filter((j) => j.status === BOOKING_STATUS.COMPLETED);
    return jobs;
  }, [jobs, filter]);

  const move = async (job, to, note) => {
    let pin;
    if (to === BOOKING_STATUS.IN_PROGRESS) {
      pin = window.prompt('Enter 6-digit Start PIN (from the customer) to begin the job:');
      if (!pin) return;
    } else if (to === BOOKING_STATUS.COMPLETED) {
      pin = window.prompt('Enter 6-digit End PIN (from the customer) to complete the job:');
      if (!pin) return;
    }
    setBusyId(job._id);
    try {
      await transitionStatus(job._id, to, note, pin);
      toast.success(`Moved to ${to.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const accept = (job) => move(job, BOOKING_STATUS.ACCEPTED, 'Accepted by worker');

  const submitQuote = async () => {
    if (!quoteTarget) return;
    const amt = Number(quoteAmount);
    if (!(amt > 0)) {
      toast.error('Enter a valid amount');
      return;
    }
    setBusyId(quoteTarget._id);
    try {
      await sendQuote(quoteTarget._id, amt, quoteNote.trim());
      toast.success('Quote sent');
      setQuoteTarget(null);
      setQuoteAmount('');
      setQuoteNote('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not send quote');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason === 'Other' ? rejectNote.trim() : rejectReason;
    if (!reason) {
      toast.error('Please add a reason');
      return;
    }
    setBusyId(rejectTarget._id);
    try {
      await rejectJob(rejectTarget._id, reason);
      toast.success('Job declined');
      setRejectTarget(null);
      setRejectReason(REJECT_REASONS[0]);
      setRejectNote('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not decline');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="container-velora py-12">
      <WorkerLocationEmitter
        workerId={user?._id}
        activeJobs={jobs.filter((j) => ACTIVE_STATUSES.includes(j.status))}
      />
      <div className="text-xs uppercase tracking-widest text-ink/60">(Worker / Jobs)</div>
      <h1 className="heading-display mt-3 text-4xl md:text-5xl">YOUR QUEUE</h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === 'new'
              ? jobs.filter((j) => j.status === BOOKING_STATUS.ASSIGNED || isQuoteReq(j)).length
              : f.key === 'active'
              ? jobs.filter((j) => ACTIVE_STATUSES.includes(j.status) && !isQuoteReq(j)).length
              : null;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition ${
                filter === f.key
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink bg-ink/85 text-paper hover:bg-ink'
              }`}
            >
              {f.label}
              {count > 0 && <span className="ml-1.5 opacity-80">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 w-full" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm text-ink/70">
            No jobs in this view.
          </div>
        ) : (
          filtered.map((b, i) => {
            const isNew = b.status === BOOKING_STATUS.ASSIGNED;
            const quoteReq = isQuoteReq(b);
            const masked = isNew || quoteReq;
            const latestQuote = b.quotes?.[b.quotes.length - 1];
            const secondsLeft = b.assignmentExpiresAt
              ? Math.max(0, Math.floor((new Date(b.assignmentExpiresAt).getTime() - now) / 1000))
              : null;
            const expired = isNew && secondsLeft === 0;
            const rowBusy = busyId === b._id;
            return (
              <FadeUp key={b._id} delay={Math.min(i * 0.04, 0.3)}>
                <div
                  className={`card-rounded p-5 ${
                    isNew ? 'ring-1 ring-amber-300' : quoteReq ? 'ring-1 ring-indigo-300' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-ink/60">{b.code}</div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-2 text-base">{b.service?.name}</div>
                  <div className="mt-1 text-xs text-ink/60">
                    {formatPrice(b.amount)} · {b.type}
                  </div>

                  {/* Countdown for new requests */}
                  {isNew && secondsLeft != null && (
                    <div
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        expired
                          ? 'bg-red-100 text-red-700'
                          : secondsLeft < 120
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Clock size={12} />
                      {expired ? 'Expired — reassigning…' : `Respond within ${fmtCountdown(secondsLeft)}`}
                    </div>
                  )}

                  {quoteReq && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                      {b.quoteStatus === 'quoted' ? 'Quote sent — awaiting customer' : 'Quote requested'}
                    </div>
                  )}

                  <div className="mt-3 grid gap-1 text-xs text-ink">
                    <div className="flex items-center gap-1.5">
                      <UserIcon size={12} className="text-ink/50" />
                      Customer: {b.user?.name}
                      {!masked && b.user?.phone ? ` · ${b.user.phone}` : ''}
                      {masked && <span className="text-ink/45">(revealed after accept)</span>}
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin size={12} className="mt-0.5 text-ink/50" />
                      {masked ? (
                        <span>
                          {b.address?.city} {b.address?.pincode}{' '}
                          <span className="text-ink/45">(exact address after accept)</span>
                        </span>
                      ) : (
                        <span>
                          {b.address?.line1}, {b.address?.city} {b.address?.pincode}
                        </span>
                      )}
                    </div>
                    {quoteReq && b.quoteDetails?.description && (
                      <div>Request: {b.quoteDetails.description}</div>
                    )}
                    {quoteReq && latestQuote && (
                      <div>Your quote: {formatPrice(latestQuote.amount)} ({latestQuote.status})</div>
                    )}
                    {b.scheduledAt && <div>Scheduled: {formatDateTime(b.scheduledAt)}</div>}
                    {!masked && b.notes && <div>Notes: {b.notes}</div>}
                  </div>

                  {/* Stage-specific actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {quoteReq && (
                      <button
                        onClick={() => {
                          setQuoteTarget(b);
                          setQuoteAmount(latestQuote ? String(latestQuote.amount) : '');
                          setQuoteNote(latestQuote?.note || '');
                        }}
                        disabled={rowBusy}
                        className="pill-btn-solid px-4 py-1.5 text-xs disabled:opacity-50"
                      >
                        {b.quoteStatus === 'quoted' ? 'Revise quote' : 'Send quote'}
                      </button>
                    )}

                    {isNew && (
                      <>
                        <button
                          onClick={() => accept(b)}
                          disabled={rowBusy || expired}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs uppercase tracking-widest text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={13} /> Accept
                        </button>
                        <button
                          onClick={() => {
                            setRejectTarget(b);
                            setRejectReason(REJECT_REASONS[0]);
                            setRejectNote('');
                          }}
                          disabled={rowBusy}
                          className="inline-flex items-center gap-1 rounded-full border border-red-400 px-4 py-1.5 text-xs uppercase tracking-widest text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <X size={13} /> Reject
                        </button>
                      </>
                    )}

                    {b.status === BOOKING_STATUS.ACCEPTED && (
                      <button
                        onClick={() => move(b, BOOKING_STATUS.EN_ROUTE, 'On the way')}
                        disabled={rowBusy}
                        className="pill-btn-solid px-4 py-1.5 text-xs disabled:opacity-50"
                      >
                        Start travel (En route)
                      </button>
                    )}

                    {(b.status === BOOKING_STATUS.EN_ROUTE || b.status === BOOKING_STATUS.IN_PROGRESS) && (
                      <Link
                        to={`/worker/jobs/${b._id}/nav`}
                        className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-4 py-1.5 text-xs uppercase tracking-widest text-white hover:bg-sky-400"
                      >
                        Open navigation →
                      </Link>
                    )}

                    {b.status === BOOKING_STATUS.EN_ROUTE && (
                      <button
                        onClick={() => move(b, BOOKING_STATUS.IN_PROGRESS, 'Started')}
                        disabled={rowBusy}
                        className="pill-btn-solid px-4 py-1.5 text-xs disabled:opacity-50"
                      >
                        Start job
                      </button>
                    )}

                    {b.status === BOOKING_STATUS.IN_PROGRESS && (
                      <button
                        onClick={() => move(b, BOOKING_STATUS.COMPLETED, 'Completed')}
                        disabled={rowBusy}
                        className="pill-btn-solid px-4 py-1.5 text-xs disabled:opacity-50"
                      >
                        Mark complete
                      </button>
                    )}
                  </div>
                </div>
              </FadeUp>
            );
          })
        )}
      </div>

      {/* Reject reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-md bg-paper p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Decline this job?</h3>
              <button onClick={() => setRejectTarget(null)} className="rounded-full p-1.5 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-ink/60">
              Job {rejectTarget.code} · {rejectTarget.service?.name}
            </p>
            <div className="space-y-2">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reject-reason"
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="accent-ink"
                  />
                  {r}
                </label>
              ))}
            </div>
            {rejectReason === 'Other' && (
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                placeholder="Tell us why"
                className="mt-3 w-full resize-none rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none"
              />
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setRejectTarget(null)} className="pill-btn text-sm">
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={busyId === rejectTarget._id}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Decline job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send quote modal */}
      {quoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-md bg-paper p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Send a quote</h3>
              <button onClick={() => setQuoteTarget(null)} className="rounded-full p-1.5 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-ink/60">
              {quoteTarget.code} · {quoteTarget.service?.name}
            </p>
            {quoteTarget.quoteDetails?.description && (
              <div className="mb-3 rounded-lg bg-ink/[0.03] px-3 py-2 text-xs text-ink/70">
                {quoteTarget.quoteDetails.description}
              </div>
            )}
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink/65">
              Quote amount (₹)
            </label>
            <input
              inputMode="numeric"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 1200"
              className="w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none"
            />
            <label className="mb-1.5 mt-3 block text-[11px] font-bold uppercase tracking-wider text-ink/65">
              Note <span className="font-normal normal-case text-ink/45">— optional</span>
            </label>
            <textarea
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value.slice(0, 300))}
              rows={2}
              placeholder="What's included / any conditions"
              className="w-full resize-none rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setQuoteTarget(null)} className="pill-btn text-sm">
                Cancel
              </button>
              <button
                onClick={submitQuote}
                disabled={busyId === quoteTarget._id}
                className="pill-btn-solid text-sm disabled:opacity-50"
              >
                Send quote
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
