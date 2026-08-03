import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Wifi,
  WifiOff,
  Navigation,
  Play,
  CheckCircle2,
  MapPin,
  Clock,
  LocateFixed,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import RouteMap from '../components/booking/RouteMap.jsx';
import WorkerLocationEmitter from '../components/booking/WorkerLocationEmitter.jsx';
import {
  ensureSocket,
  joinBookingRoom,
  leaveBookingRoom,
  socket,
} from '../lib/socket.js';
import { getTrackingState } from '../api/tracking.js';
import { transitionStatus, markEnRoute } from '../api/bookings.js';
import useSocket from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BOOKING_STATUS } from '../lib/bookingStatus.js';

const STATUS_BADGE = {
  [BOOKING_STATUS.PENDING_CONFIRMATION]: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  [BOOKING_STATUS.CONFIRMED]: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  [BOOKING_STATUS.IN_PROGRESS]: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  [BOOKING_STATUS.COMPLETED]: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  [BOOKING_STATUS.CANCELLED_BY_USER]: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
  [BOOKING_STATUS.REJECTED]: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
  [BOOKING_STATUS.WORKER_UNAVAILABLE]: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
};
const STATUS_LABEL = {
  [BOOKING_STATUS.PENDING_CONFIRMATION]: 'Awaiting your response',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.IN_PROGRESS]: 'In service',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED_BY_USER]: 'Cancelled',
  [BOOKING_STATUS.REJECTED]: 'Rejected',
  [BOOKING_STATUS.WORKER_UNAVAILABLE]: 'Expired',
};

const fmtKm = (m) =>
  m == null ? '—' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;

const fmtMin = (s) => {
  if (s == null) return '—';
  const m = Math.round(s / 60);
  if (m < 1) return '<1m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const fmtArrival = (s) =>
  s == null
    ? '—'
    : new Date(Date.now() + s * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

export default function WorkerNav() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected } = useSocket();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [pinPrompt, setPinPrompt] = useState(null);

  // ── Local GPS position for the worker marker ─────────────────────────────
  // The server broadcasts the worker's location back to the booking room, but
  // that adds latency. Instead we track GPS locally and inject it into state so
  // the worker always sees their own marker move in real time.
  const [localWorkerPos, setLocalWorkerPos] = useState(null);
  const localWorkerPosRef = useRef(null);

  const handleLocalLocation = useCallback((lat, lng) => {
    const pos = { lat, lng, at: new Date().toISOString(), local: true };
    localWorkerPosRef.current = pos;
    setLocalWorkerPos(pos);
    console.debug('[WorkerNav] local GPS update', { lat: lat.toFixed(6), lng: lng.toFixed(6) });
  }, []);

  // ── Fetch tracking state from REST on mount ───────────────────────────────
  const refresh = useCallback((showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const coords = localWorkerPosRef.current;
    const params = coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy } : {};
    return getTrackingState(bookingId, params)
      .then((data) => {
        console.debug('[WorkerNav] tracking state loaded', {
          bookingId,
          workerLocation: data.workerLocation,
          destination: data.destination,
          hasRoute: !!data.route,
          etaDuration: data.eta?.durationSeconds,
          etaDistance: data.eta?.distanceMeters,
        });
        setState(data);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Job not available');
        navigate('/worker/jobs');
      })
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  }, [bookingId, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Periodic REST poll (backup for when socket drops) ────────────────────
  useEffect(() => {
    if (!bookingId) return;
    const id = setInterval(() => {
      const coords = localWorkerPosRef.current;
      const params = coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy } : {};
      getTrackingState(bookingId, params)
        .then((data) => {
          setState((prev) => {
            // Merge new data but KEEP localWorkerPos if it's more recent
            const merged = { ...prev, ...data };
            if (localWorkerPosRef.current) {
              merged.workerLocation = localWorkerPosRef.current;
            }
            return merged;
          });
        })
        .catch(() => null);
    }, 5_000);
    return () => clearInterval(id);
  }, [bookingId]);

  // ── Socket subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return undefined;
    ensureSocket();
    joinBookingRoom(bookingId);
    console.debug('[WorkerNav] joined booking room', bookingId);

    const onLocation = (data) => {
      if (!data) return;
      if (data.bookingId && String(data.bookingId) !== String(bookingId)) return;

      console.debug('[WorkerNav] socket location:update', {
        lat: data.lat,
        lng: data.lng,
        workerId: data.workerId,
      });

      // Prefer local GPS position if it is ours
      const isOwnWorker = data.workerId && String(data.workerId) === String(user?._id);
      if (isOwnWorker && localWorkerPosRef.current) {
        // Already handled locally — skip server echo
        return;
      }

      setState((prev) => ({
        ...(prev || {}),
        workerLocation: { lat: data.lat, lng: data.lng, at: data.at, workerId: data.workerId },
      }));
    };

    const onRoute = (data) => {
      if (!data || String(data.bookingId) !== String(bookingId)) return;
      console.debug('[WorkerNav] socket booking:route', {
        distanceMeters: data.eta?.distanceMeters,
        durationSeconds: data.eta?.durationSeconds,
        routePoints: data.route?.coordinates?.length,
        destination: data.destination,
      });
      setState((prev) => ({
        ...(prev || {}),
        route: data.route ?? prev?.route ?? null,
        eta: data.eta ?? prev?.eta ?? null,
        destination: data.destination ?? prev?.destination ?? null,
        // Don't overwrite workerLocation — prefer our local GPS
        workerLocation: localWorkerPosRef.current ?? data.workerLocation ?? prev?.workerLocation ?? null,
      }));
    };

    socket.on('location:update', onLocation);
    socket.on('booking:route', onRoute);

    return () => {
      socket.off('location:update', onLocation);
      socket.off('booking:route', onRoute);
      leaveBookingRoom(bookingId);
      console.debug('[WorkerNav] left booking room', bookingId);
    };
  }, [bookingId, user?._id]);

  // ── Merge localWorkerPos into state when it updates ──────────────────────
  useEffect(() => {
    if (!localWorkerPos) return;
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, workerLocation: localWorkerPos };
    });
  }, [localWorkerPos?.lat, localWorkerPos?.lng]);

  // ── Debug log for ETA ────────────────────────────────────────────────────
  useEffect(() => {
    if (!state?.eta) return;
    console.debug('[WorkerNav] ETA update', {
      bookingId,
      distanceMeters: state.eta.distanceMeters,
      durationSeconds: state.eta.durationSeconds,
      eta: fmtMin(state.eta.durationSeconds),
      arrival: fmtArrival(state.eta.durationSeconds),
      fallback: !!state.eta.fallback,
    });
  }, [bookingId, state?.eta?.distanceMeters, state?.eta?.durationSeconds]);

  // ── Coordinate debug log ─────────────────────────────────────────────────
  useEffect(() => {
    const w = state?.workerLocation;
    const c = state?.destination;
    if (!w && !c) return;
    console.debug('[WorkerNav] coordinate state', {
      bookingId,
      worker: w ? { lat: w.lat?.toFixed(5), lng: w.lng?.toFixed(5) } : null,
      customer: c ? { lat: c.lat?.toFixed(5), lng: c.lng?.toFixed(5) } : null,
    });
  }, [
    bookingId,
    state?.workerLocation?.lat,
    state?.workerLocation?.lng,
    state?.destination?.lat,
    state?.destination?.lng,
  ]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const requestPin = (type) => {
    return new Promise((resolve) => {
      setPinPrompt({ type, resolve });
    });
  };

  const handleAccept = async () => {
    setWorking(true);
    try {
      await transitionStatus(bookingId, BOOKING_STATUS.CONFIRMED, 'Accepted by worker');
      toast.success('Job accepted!');
      refresh(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not accept job');
    } finally {
      setWorking(false);
    }
  };

  const handleStartTravel = async () => {
    setWorking(true);
    try {
      // Not a status change — stamps enRouteAt; the booking stays `confirmed`.
      await markEnRoute(bookingId);
      toast.success('Started travel!');
      refresh(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not start travel');
    } finally {
      setWorking(false);
    }
  };

  const handleStart = async () => {
    const pin = await requestPin('start');
    if (!pin) return;
    setWorking(true);
    try {
      await transitionStatus(bookingId, BOOKING_STATUS.IN_PROGRESS, 'Started on site', pin);
      toast.success('Job started!');
      refresh(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not start job');
    } finally {
      setWorking(false);
    }
  };

  const handleComplete = async () => {
    if (!booking?.hasEndPin) {
      toast.error('End PIN is not available for this booking yet');
      return;
    }
    const pin = await requestPin('end');
    if (!pin) return;
    setWorking(true);
    try {
      await transitionStatus(bookingId, BOOKING_STATUS.COMPLETED, 'Service completed', pin);
      toast.success('Job completed!');
      refresh(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not complete job');
    } finally {
      setWorking(false);
    }
  };

  const openExternalMaps = () => {
    if (!state?.destination) return;
    const { lat, lng } = state.destination;
    const workerCoords = state.workerLocation || localWorkerPos;
    let url;
    if (workerCoords) {
      url = `https://www.google.com/maps/dir/${workerCoords.lat},${workerCoords.lng}/${lat},${lng}?travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading || !state?.booking) {
    return (
      <section className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#0a0e1a] text-paper/60">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        <div className="text-xs uppercase tracking-widest">Loading navigation…</div>
      </section>
    );
  }

  const { booking } = state;
  const status = booking.status;
  const inProgress = status === BOOKING_STATUS.IN_PROGRESS;
  const finished =
    status === BOOKING_STATUS.COMPLETED ||
    status === BOOKING_STATUS.CANCELLED_BY_USER ||
    status === BOOKING_STATUS.REJECTED ||
    status === BOOKING_STATUS.WORKER_UNAVAILABLE;

  // The worker's location to show on the map — prefer local GPS, fall back to server
  const workerMapPos = localWorkerPos || state.workerLocation || null;
  const activeJobs = !finished ? [{ _id: booking._id, status }] : [];

  return (
    <section className="relative min-h-[100dvh] bg-[#0a0e1a] text-paper">
      {/* Invisible GPS emitter — broadcasts to socket & feeds localWorkerPos */}
      <WorkerLocationEmitter
        workerId={user?._id}
        activeJobs={activeJobs}
        onLocationUpdate={handleLocalLocation}
      />

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-[400] px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f172a]/85 px-4 py-2.5 shadow-lg backdrop-blur">
          <button
            onClick={() => navigate('/worker/jobs')}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-paper/80 hover:text-paper transition"
          >
            <ArrowLeft size={14} /> Jobs
          </button>

          <div className="flex items-center gap-2">
            {/* GPS indicator */}
            {localWorkerPos && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                <LocateFixed size={9} /> GPS
              </span>
            )}
            <div className="text-xs uppercase tracking-widest text-paper/60">
              {booking.code}
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ring-1 ring-inset ${
              connected
                ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30'
                : 'bg-rose-400/15 text-rose-300 ring-rose-400/30'
            }`}
          >
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? 'Live' : 'Reconnect'}
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="h-[100dvh] w-full">
        <RouteMap
          workerLocation={workerMapPos}
          destination={state.destination}
          route={state.route}
          follow={false}
          height="100%"
          showNoDataMsg={false}
        />
      </div>

      {/* ── Bottom action sheet ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] px-3 pb-3">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a]/95 p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur">

          {/* Drag handle / collapse toggle so the worker can uncover the map */}
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            className="-mt-2 mb-3 mx-auto flex w-full items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-paper/55 hover:text-paper transition"
            aria-label={sheetExpanded ? 'Collapse details' : 'Expand details'}
          >
            <span className="h-1 w-10 rounded-full bg-white/20" />
            {sheetExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span>{sheetExpanded ? 'Hide details' : 'Show details'}</span>
            <span className="h-1 w-10 rounded-full bg-white/20" />
          </button>

          {/* Status + actions row — always visible so PIN / call stay reachable */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest ring-1 ring-inset ${
                STATUS_BADGE[status] || 'bg-white/5 text-paper/60 ring-white/10'
              }`}
            >
              {STATUS_LABEL[status] || status}
            </span>
            <div className="flex flex-wrap gap-2">
              {booking.user?.phone && (
                <a
                  href={`tel:${booking.user.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-xs uppercase tracking-widest text-[#04130c] hover:bg-emerald-400 transition"
                >
                  <Phone size={12} /> Call customer
                </a>
              )}
              {state.destination && (
                <button
                  onClick={openExternalMaps}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1.5 text-xs uppercase tracking-widest text-white hover:bg-sky-400 transition"
                >
                  <Navigation size={12} /> Google Maps
                </button>
              )}
            </div>
          </div>

          {/* Expandable section — hides the bulky info so the map is visible */}
          {sheetExpanded && (
          <>
          {/* ETA / Distance stats */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="ETA" value={fmtMin(state.eta?.durationSeconds)} />
            <Stat label="Arrival" value={fmtArrival(state.eta?.durationSeconds)} />
            <Stat label="Distance" value={fmtKm(state.eta?.distanceMeters)} />
          </div>

          {/* Fallback ETA notice */}
          {state.eta?.fallback && (
            <div className="mt-2 rounded-xl bg-amber-400/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-amber-300/80 text-center ring-1 ring-inset ring-amber-400/20">
              ⚠️ Approximate ETA — live routing unavailable
            </div>
          )}

          {/* Booking detail row */}
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-white/10 pt-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-paper/55">
                {booking.service?.name || 'Service'}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {booking.user?.name || 'Customer'}
              </div>
              {booking.user?.phone && (
                <div className="mt-0.5 text-xs text-paper/55">{booking.user.phone}</div>
              )}
            </div>
            <div className="text-right text-sm">
              <div className="inline-flex items-center justify-end gap-1 text-paper/70">
                <MapPin size={12} />
                {booking.address?.city || '—'}
              </div>
              <div className="mt-0.5 text-xs text-paper/55">{booking.address?.line1}</div>
              {booking.scheduledAt && (
                <div className="mt-0.5 inline-flex items-center justify-end gap-1 text-xs text-paper/45">
                  <Clock size={11} />
                  {new Date(booking.scheduledAt).toLocaleString([], {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Action buttons — dynamically rendered based on status */}
          {!finished && (
            <div className="mt-4 flex flex-col gap-2">
              {status === BOOKING_STATUS.PENDING_CONFIRMATION && (
                <button
                  onClick={handleAccept}
                  disabled={working}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-xs uppercase tracking-widest text-[#04130c] transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  <Play size={13} /> Accept Job
                </button>
              )}
              {/* Confirmed but not yet travelling → "On the way" (stamps enRouteAt). */}
              {status === BOOKING_STATUS.CONFIRMED && !booking.enRouteAt && (
                <button
                  onClick={handleStartTravel}
                  disabled={working}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-xs uppercase tracking-widest text-white transition hover:bg-sky-400 disabled:opacity-40"
                >
                  <Navigation size={13} /> On the way
                </button>
              )}
              {/* Start with the customer's start PIN. Available for ANY confirmed
                  booking — "On the way" is an optional tracking convenience, not
                  a gate on starting work. */}
              {status === BOOKING_STATUS.CONFIRMED && (
                <button
                  onClick={handleStart}
                  disabled={working}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-xs uppercase tracking-widest text-[#04130c] transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  <Play size={13} /> Start job (Enter PIN)
                </button>
              )}
              {status === BOOKING_STATUS.IN_PROGRESS && (
                <button
                  onClick={handleComplete}
                  disabled={working || !booking?.hasEndPin}
                  title={booking?.hasEndPin ? 'Enter the customer end PIN to complete the job' : 'End PIN is not available for this booking yet'}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-xs uppercase tracking-widest text-white transition hover:bg-sky-400 disabled:opacity-40"
                >
                  <CheckCircle2 size={13} /> Complete job (Enter PIN)
                </button>
              )}
              {status === BOOKING_STATUS.IN_PROGRESS && (
                <div className="text-center text-[10px] uppercase tracking-widest text-sky-300/80">
                  {booking?.hasEndPin ? 'End PIN required before completion' : 'End PIN missing for this booking'}
                </div>
              )}
            </div>
          )}

          {finished && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm text-paper/65">
              {status === BOOKING_STATUS.COMPLETED
                ? 'Job completed. Earnings will appear in your dashboard shortly.'
                : 'Job cancelled.'}
            </div>
          )}
        </div>
      </div>

      {/* ── Custom PIN Prompt Modal ── */}
      {pinPrompt && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#0f172a] p-6 shadow-2xl ring-1 ring-white/10">
            <h3 className="text-lg font-semibold text-paper">
              {pinPrompt.type === 'start' ? 'Start Job' : 'Complete Job'}
            </h3>
            <p className="mt-2 text-sm text-paper/70">
              {pinPrompt.type === 'start'
                ? 'Enter the 6-digit Start PIN from the customer to begin the service.'
                : 'Enter the 6-digit End PIN from the customer to complete the service.'}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                pinPrompt.resolve(formData.get('pin'));
                setPinPrompt(null);
              }}
              className="mt-5"
            >
              <input
                autoFocus
                name="pin"
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-paper placeholder-white/20 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                required
                pattern="\d{6}"
                title="6-digit PIN"
                autoComplete="off"
              />
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    pinPrompt.resolve(null);
                    setPinPrompt(null);
                  }}
                  className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-400 transition"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-paper/55">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
