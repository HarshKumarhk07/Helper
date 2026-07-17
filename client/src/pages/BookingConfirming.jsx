import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, Loader2, UserX, Star, X } from 'lucide-react';
import { getBooking, changeWorker } from '../api/bookings.js';
import { BOOKING_STATUS } from '../lib/bookingStatus.js';
import { formatPrice, getWorkerName, getWorkerAvatar } from '../lib/booking.js';
import { ensureSocket, joinBookingRoom, leaveBookingRoom, socket } from '../lib/socket.js';
import api from '../api/axios.js';

const POLL_MS = 5_000;

const fmtCountdown = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// "Confirming your booking…" — shown right after payment while we wait for the
// professional to Accept/Reject. Live countdown off confirmationExpiresAt, with
// a Change Worker option at any time before they respond. Reacts to the
// `booking:status` socket event, with a poll fallback so the screen still
// resolves if the socket drops.
export default function BookingConfirming() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [picking, setPicking] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const b = await getBooking(id);
      setBooking(b);
    } catch {
      toast.error('Booking not found');
      navigate('/me/bookings');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates + poll fallback.
  useEffect(() => {
    if (!id) return undefined;
    ensureSocket();
    joinBookingRoom(id);
    const onStatus = (data) => {
      if (!data || String(data.bookingId) !== String(id)) return;
      load();
    };
    socket.on('booking:status', onStatus);
    const poll = setInterval(load, POLL_MS);
    return () => {
      socket.off('booking:status', onStatus);
      leaveBookingRoom(id);
      clearInterval(poll);
    };
  }, [id, load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const status = booking?.status;
  const remaining = booking?.confirmationExpiresAt
    ? new Date(booking.confirmationExpiresAt).getTime() - now
    : null;

  const serviceId = booking?.service?._id || booking?.service;
  const excluded = useMemo(
    () => new Set((booking?.rejections || []).map((r) => String(r.worker?._id || r.worker))),
    [booking]
  );

  const openPicker = async () => {
    setPicking(true);
    setWorkersLoading(true);
    try {
      const { data } = await api.get('/users/workers', { params: { service: serviceId } });
      // Don't re-offer anyone who already rejected/missed this booking.
      setWorkers((data.workers || []).filter((w) => !excluded.has(String(w._id))));
    } catch {
      toast.error('Could not load professionals');
    } finally {
      setWorkersLoading(false);
    }
  };

  const pick = async (workerId) => {
    setBusy(true);
    try {
      const updated = await changeWorker(id, workerId);
      setBooking(updated);
      setPicking(false);
      toast.success('Request sent to your new professional');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not change professional');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-sand/30 py-16">
        <div className="container-velora max-w-xl">
          <div className="skeleton h-72 w-full rounded-3xl" />
        </div>
      </section>
    );
  }

  const isPending = status === BOOKING_STATUS.PENDING_CONFIRMATION;
  const isConfirmed = status === BOOKING_STATUS.CONFIRMED;
  const needsNewWorker =
    status === BOOKING_STATUS.REJECTED || status === BOOKING_STATUS.WORKER_UNAVAILABLE;

  return (
    <section className="min-h-screen bg-sand/30 py-10 md:py-16">
      <div className="container-velora max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
          {/* ── Header state ── */}
          <div className="border-b border-black/10 p-8 text-center">
            {isPending && (
              <>
                <Loader2 size={40} className="mx-auto animate-spin text-[#13294B]" />
                <h1 className="mt-4 text-2xl font-bold text-ink">Confirming your booking…</h1>
                <p className="mt-2 text-sm text-ink/60">
                  Waiting for {booking.worker ? getWorkerName(booking.worker) : 'a professional'} to
                  accept your request.
                </p>
                {remaining != null && (
                  <div
                    className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold tabular-nums ${
                      remaining < 60_000 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Clock size={14} /> {fmtCountdown(remaining)} left to respond
                  </div>
                )}
              </>
            )}

            {isConfirmed && (
              <>
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <h1 className="mt-4 text-2xl font-bold text-ink">Booking confirmed!</h1>
                <p className="mt-2 text-sm text-ink/60">
                  {getWorkerName(booking.worker)} accepted your booking.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to={`/track/${booking._id}`}
                    className="rounded-pill bg-[#13294B] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
                  >
                    Track booking →
                  </Link>
                  <Link
                    to="/me/bookings"
                    className="rounded-pill border border-ink/20 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-ink"
                  >
                    My bookings
                  </Link>
                </div>
              </>
            )}

            {needsNewWorker && (
              <>
                <UserX size={40} className="mx-auto text-red-500" />
                <h1 className="mt-4 text-2xl font-bold text-ink">Worker not available</h1>
                <p className="mt-2 text-sm text-ink/60">
                  {status === BOOKING_STATUS.REJECTED
                    ? 'This professional declined your request.'
                    : "They didn't respond in time."}{' '}
                  Choose another professional — your payment is safe and stays on this booking.
                </p>
                <button
                  onClick={openPicker}
                  className="mt-6 rounded-pill bg-[#13294B] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"
                >
                  Choose another professional
                </button>
              </>
            )}

            {!isPending && !isConfirmed && !needsNewWorker && (
              <>
                <h1 className="text-2xl font-bold text-ink">Booking {booking.code}</h1>
                <p className="mt-2 text-sm text-ink/60">This booking is no longer awaiting confirmation.</p>
                <Link
                  to="/me/bookings"
                  className="mt-6 inline-block rounded-pill border border-ink/20 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-ink"
                >
                  My bookings
                </Link>
              </>
            )}
          </div>

          {/* ── Summary ── */}
          <div className="space-y-3 p-6">
            <Row label="Booking" value={booking.code} />
            <Row label="Service" value={booking.service?.name || '—'} />
            <Row label="Amount paid" value={formatPrice(booking.amount)} />
            {booking.hours ? <Row label="Hours" value={`${booking.hours} hr`} /> : null}
          </div>

          {/* Change worker is available any time before they respond. */}
          {isPending && (
            <div className="border-t border-black/10 bg-sand/20 p-6 text-center">
              <button
                onClick={openPicker}
                className="text-xs font-bold uppercase tracking-widest text-[#13294B] hover:underline"
              >
                Change professional
              </button>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-ink/40">
                Your payment stays on this booking
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Worker picker ── */}
      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Choose a professional</h3>
              <button onClick={() => setPicking(false)} className="rounded-full p-1.5 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>

            {workersLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-ink/50">
                <Loader2 size={15} className="animate-spin" /> Loading professionals…
              </div>
            ) : workers.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink/60">
                No other professionals are available for this service right now. Please try again
                shortly, or cancel from My Bookings for a refund.
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {workers.map((w) => (
                  <button
                    key={w._id}
                    onClick={() => pick(w._id)}
                    disabled={busy}
                    className="flex w-full items-center gap-3 rounded-2xl border border-ink/10 p-3 text-left transition hover:border-ink/30 disabled:opacity-50"
                  >
                    {getWorkerAvatar(w) ? (
                      <img
                        src={getWorkerAvatar(w)}
                        alt=""
                        className="h-10 w-10 rounded-full border border-ink/10 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/10 text-sm font-bold text-ink">
                        {getWorkerName(w)?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{getWorkerName(w)}</div>
                      {w.completedJobs > 0 && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/55">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {((w.displayRating > 0 ? w.displayRating : null) || w.publicRating || 5).toFixed(1)} ·{' '}
                          {w.completedJobs} job{w.completedJobs === 1 ? '' : 's'}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="uppercase tracking-widest text-ink/55">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink">{value}</span>
    </div>
  );
}
