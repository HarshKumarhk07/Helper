import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, MapPin, Check, X } from 'lucide-react';
import { listWorkerJobs, transitionStatus, rejectJob } from '../../api/bookings.js';
import { BOOKING_STATUS } from '../../lib/bookingStatus.js';
import { formatPrice, formatDateTime } from '../../lib/booking.js';
import { ensureSocket, socket } from '../../lib/socket.js';

const REJECT_REASONS = ['Too far', 'Not available', 'Low price', 'Other'];
const POLL_MS = 20_000;

const fmtCountdown = (ms) => {
  if (ms == null) return null;
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Persistent, high-priority booking request modal for workers.
//
// Deliberately NOT dismissible: there is no backdrop click handler, no Escape
// handler and no close button — it stays until the worker explicitly Accepts or
// Rejects. It appears immediately via the `booking:request` socket event while
// they're in the portal, and on the next portal open via the fetch on mount
// (with a slow poll as a fallback if the socket drops).
export default function BookingRequestModal() {
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const jobs = await listWorkerJobs();
      setRequests(
        (jobs || []).filter(
          (j) => j.status === BOOKING_STATUS.PENDING_CONFIRMATION && !j.isQuoteRequest
        )
      );
    } catch {
      /* offline / transient — the poll will retry */
    }
  }, []);

  useEffect(() => {
    load();
    ensureSocket();
    const onRequest = () => load();
    socket.on('booking:request', onRequest);
    const poll = setInterval(load, POLL_MS);
    return () => {
      socket.off('booking:request', onRequest);
      clearInterval(poll);
    };
  }, [load]);

  // Drive the countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Only ever show one request at a time — the oldest, so nothing starves.
  const current = useMemo(() => {
    if (requests.length === 0) return null;
    return [...requests].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    )[0];
  }, [requests]);

  const remaining = current?.confirmationExpiresAt
    ? new Date(current.confirmationExpiresAt).getTime() - now
    : null;

  // The window elapsed while the modal was open — the sweeper will resolve it
  // server-side, so drop it from the queue rather than let them act on it.
  useEffect(() => {
    if (remaining != null && remaining <= 0) load();
  }, [remaining, load]);

  if (!current) return null;

  const accept = async () => {
    setBusy(true);
    try {
      await transitionStatus(current._id, BOOKING_STATUS.CONFIRMED, 'Accepted by worker');
      toast.success('Booking accepted');
      setRejecting(false);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not accept');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    setBusy(true);
    try {
      await rejectJob(current._id, reason);
      toast.success('Booking rejected');
      setRejecting(false);
      setReason(REJECT_REASONS[0]);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not reject');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-paper p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">
              New booking request
            </div>
            <h3 className="mt-1 text-lg font-bold text-ink">{current.service?.name || 'Service'}</h3>
          </div>
          {remaining != null && (
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
                remaining < 60_000 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Clock size={11} className="mr-1 inline" />
              {fmtCountdown(remaining)}
            </span>
          )}
        </div>

        <div className="space-y-2 rounded-2xl bg-sand/40 p-4 text-sm">
          <Row label="Booking" value={current.code} />
          <Row label="Amount" value={formatPrice(current.amount)} />
          <Row
            label="When"
            value={current.scheduledAt ? formatDateTime(current.scheduledAt) : 'As soon as possible'}
          />
          {current.address && (
            <div className="flex items-start gap-2 pt-1 text-xs text-ink/70">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              <span>
                {[current.address.line1, current.address.city, current.address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>

        {rejecting ? (
          <div className="mt-5">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink/65">
              Reason for rejecting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white p-3 text-sm"
            >
              {REJECT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setRejecting(false)}
                disabled={busy}
                className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={confirmReject}
                disabled={busy}
                className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Rejecting…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setRejecting(true)}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/20 px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
            >
              <X size={14} /> Reject
            </button>
            <button
              onClick={accept}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#04130c] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <Check size={14} /> {busy ? 'Working…' : 'Accept'}
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-ink/40">
          {requests.length > 1
            ? `${requests.length - 1} more request${requests.length > 2 ? 's' : ''} after this`
            : 'Respond to continue'}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="uppercase tracking-widest text-ink/50">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink">{value}</span>
    </div>
  );
}
