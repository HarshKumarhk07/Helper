import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Wifi,
  WifiOff,
  Phone,
  CheckCircle2,
  XCircle,
  Hourglass,
  Truck,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import RouteMap from '../components/booking/RouteMap.jsx';
import {
  ensureSocket,
  joinBookingRoom,
  leaveBookingRoom,
  requestLastLocation,
  socket,
} from '../lib/socket.js';
import { getTrackingState } from '../api/tracking.js';
import useSocket from '../hooks/useSocket.js';

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_BADGE = {
  placed: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  assigned: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  accepted: 'bg-indigo-400/15 text-indigo-300 ring-indigo-400/30',
  en_route: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  in_progress: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  cancelled: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
};

const STATUS_LABEL = {
  placed: 'Placed',
  assigned: 'Worker assigned',
  accepted: 'Worker accepted',
  en_route: 'Worker en route',
  in_progress: 'Service in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TIMELINE = [
  { key: 'placed', label: 'Placed', Icon: Hourglass },
  { key: 'assigned', label: 'Assigned', Icon: UserCheck },
  { key: 'en_route', label: 'On the way', Icon: Truck },
  { key: 'in_progress', label: 'In progress', Icon: Clock },
  { key: 'completed', label: 'Completed', Icon: CheckCircle2 },
];

// Map a raw booking status onto its timeline step (accepted collapses into the
// assigned step, cancelled shows as the final step).
const STATUS_TO_STEP = {
  placed: 'placed',
  assigned: 'assigned',
  accepted: 'assigned',
  en_route: 'en_route',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'completed',
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtKm = (meters) => {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 2 : 1)} km`;
};

const fmtMinutes = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.round(seconds / 60);
  if (m < 1) return '<1 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const fmtTimeFromNow = (seconds) => {
  if (seconds == null) return '—';
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrackBooking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { connected } = useSocket();

  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // Sheet starts collapsed so the customer sees the map first; they can
  // expand for the full ETA / timeline details whenever they want.
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // ── Bootstrap from REST so the page paints immediately ───────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTrackingState(bookingId)
      .then((data) => {
        if (cancelled) return;
        console.debug('[TrackBooking] initial state loaded', {
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
        if (cancelled) return;
        const msg = err?.response?.data?.message || 'Tracking not available';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // ── Periodic REST poll (fallback when socket is not delivering) ───────────
  useEffect(() => {
    if (!bookingId) return;
    const id = setInterval(() => {
      getTrackingState(bookingId)
        .then((data) => {
          setState((prev) => {
            const merged = { ...prev, ...data };
            console.debug('[TrackBooking] poll update', {
              workerLocation: merged.workerLocation,
              etaDuration: merged.eta?.durationSeconds,
            });
            return merged;
          });
        })
        .catch(() => null);
    }, 15_000);
    return () => clearInterval(id);
  }, [bookingId]);

  // ── Socket subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return undefined;
    ensureSocket();
    joinBookingRoom(bookingId);
    console.debug('[TrackBooking] joined booking room', bookingId);

    const onLocation = (data) => {
      if (!data) return;
      if (data.bookingId && String(data.bookingId) !== String(bookingId)) return;

      console.debug('[TrackBooking] socket location:update', {
        lat: data.lat,
        lng: data.lng,
        workerId: data.workerId,
        bookingId: data.bookingId,
      });

      setState((prev) => ({
        ...(prev || {}),
        workerLocation: {
          lat: data.lat,
          lng: data.lng,
          at: data.at,
          workerId: data.workerId,
        },
      }));
    };

    const onRoute = (data) => {
      if (!data || String(data.bookingId) !== String(bookingId)) return;
      console.debug('[TrackBooking] socket booking:route', {
        routePoints: data.route?.coordinates?.length,
        distanceMeters: data.eta?.distanceMeters,
        durationSeconds: data.eta?.durationSeconds,
        destination: data.destination,
        workerLocation: data.workerLocation,
      });
      setState((prev) => ({
        ...(prev || {}),
        route: data.route ?? prev?.route ?? null,
        eta: data.eta ?? prev?.eta ?? null,
        destination: data.destination ?? prev?.destination ?? null,
        workerLocation: data.workerLocation ?? prev?.workerLocation ?? null,
        routeAt: data.at ?? prev?.routeAt ?? null,
      }));
    };

    const onWorkerOffline = (data) => {
      if (!data?.workerId) return;
      // state is captured stale here, so check via functional updater
      setState((prev) => {
        if (
          prev?.booking?.worker?._id &&
          String(data.workerId) === String(prev.booking.worker._id)
        ) {
          toast('Worker disconnected — waiting to resume', { icon: '⚠️' });
        }
        return prev;
      });
    };

    socket.on('location:update', onLocation);
    socket.on('booking:route', onRoute);
    socket.on('worker:offline', onWorkerOffline);

    return () => {
      socket.off('location:update', onLocation);
      socket.off('booking:route', onRoute);
      socket.off('worker:offline', onWorkerOffline);
      leaveBookingRoom(bookingId);
      console.debug('[TrackBooking] left booking room', bookingId);
    };
  }, [bookingId]);

  // Request the last known location as soon as we know who the worker is
  useEffect(() => {
    const workerId = state?.booking?.worker?._id;
    if (!workerId || !connected) return;
    console.debug('[TrackBooking] requesting last worker location', { workerId, bookingId });
    requestLastLocation(workerId, bookingId);
  }, [state?.booking?.worker?._id, connected]);

  // ── ETA debug log ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state?.eta) return;
    console.debug('[TrackBooking] ETA update', {
      bookingId,
      distanceMeters: state.eta.distanceMeters,
      durationSeconds: state.eta.durationSeconds,
      eta: fmtMinutes(state.eta.durationSeconds),
      arrival: fmtTimeFromNow(state.eta.durationSeconds),
      fallback: !!state.eta.fallback,
    });
  }, [bookingId, state?.eta?.distanceMeters, state?.eta?.durationSeconds]);

  // ── Coordinate debug log ─────────────────────────────────────────────────
  useEffect(() => {
    const w = state?.workerLocation;
    const c = state?.destination;
    if (!w && !c) return;
    console.debug('[TrackBooking] coordinate state', {
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

  // ── "Last seen X ago" label ───────────────────────────────────────────────
  const lastSeenAt = state?.workerLocation?.at;
  const lastSeenLabel = useMemo(() => {
    if (!lastSeenAt) return null;
    const sec = Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 1000);
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    return `${Math.round(sec / 60)} min ago`;
  }, [lastSeenAt]);

  const status = state?.booking?.status;
  const isCancelled = status === 'cancelled';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <section className="relative min-h-[100dvh] bg-[#0a0e1a] text-paper">
      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-[400] px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f172a]/85 px-4 py-2.5 shadow-lg backdrop-blur">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-paper/80 hover:text-paper transition"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="text-xs uppercase tracking-widest text-paper/60">
            {state?.booking?.code ? `Tracking · ${state.booking.code}` : 'Tracking'}
          </div>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ring-1 ring-inset ${
              connected
                ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30'
                : 'bg-rose-400/15 text-rose-300 ring-rose-400/30'
            }`}
          >
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? 'Live' : 'Reconnecting'}
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="h-[100dvh] w-full">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <div className="text-xs uppercase tracking-widest text-paper/50">
              Loading tracking…
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="text-4xl">📡</div>
            <div className="text-paper/70">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                getTrackingState(bookingId)
                  .then(setState)
                  .catch((e) => setError(e?.response?.data?.message || 'Still unavailable'))
                  .finally(() => setLoading(false));
              }}
              className="rounded-full bg-sky-500 px-5 py-2 text-xs uppercase tracking-widest text-white hover:bg-sky-400 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <RouteMap
            workerLocation={state?.workerLocation ?? null}
            destination={state?.destination ?? null}
            route={state?.route ?? null}
            follow={false}
            height="100%"
            showNoDataMsg={
              !state?.workerLocation && !state?.destination
            }
          />
        )}
      </div>

      {/* ── Bottom info sheet ── */}
      {!loading && !error && state?.booking && (
        <div className="absolute bottom-0 left-0 right-0 z-[400] px-3 pb-3">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a]/95 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur">

            {/* Drag handle / collapse toggle so the map stays visible */}
            <button
              type="button"
              onClick={() => setSheetExpanded((v) => !v)}
              className="-mt-1 mb-2 mx-auto flex w-full items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-paper/55 hover:text-paper transition"
              aria-label={sheetExpanded ? 'Collapse details' : 'Expand details'}
            >
              <span className="h-1 w-10 rounded-full bg-white/20" />
              {sheetExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              <span>{sheetExpanded ? 'Hide details' : 'Show details'}</span>
              <span className="h-1 w-10 rounded-full bg-white/20" />
            </button>

            {/* Always-visible compact row: status + ETA + Call */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest ring-1 ring-inset ${
                    STATUS_BADGE[status] || ''
                  }`}
                >
                  {isCancelled ? <XCircle size={11} /> : <Truck size={11} />}
                  {STATUS_LABEL[status] || status}
                </span>
                <span className="text-xs text-paper/80">
                  <span className="text-paper/50">ETA </span>
                  <span className="font-semibold tabular-nums">
                    {fmtMinutes(state?.eta?.durationSeconds)}
                  </span>
                  <span className="text-paper/50"> · </span>
                  <span className="font-semibold tabular-nums">
                    {fmtKm(state?.eta?.distanceMeters)}
                  </span>
                </span>
              </div>
              {state?.booking?.worker?.phone && (
                <a
                  href={`tel:${state.booking.worker.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] uppercase tracking-widest text-[#04130c] hover:bg-emerald-400 transition shrink-0"
                >
                  <Phone size={11} /> Call
                </a>
              )}
            </div>

            {/* Expandable details — hidden by default to keep the panel small */}
            {sheetExpanded && (
              <>
                {/* ETA stat tiles */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="ETA" value={fmtMinutes(state?.eta?.durationSeconds)} />
                  <Stat label="Arrival" value={fmtTimeFromNow(state?.eta?.durationSeconds)} />
                  <Stat label="Distance" value={fmtKm(state?.eta?.distanceMeters)} />
                </div>

                {/* Status meta line */}
                {(lastSeenLabel && state?.workerLocation) || state?.eta?.fallback ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest">
                    {lastSeenLabel && state?.workerLocation && (
                      <span className="text-paper/50">Updated {lastSeenLabel}</span>
                    )}
                    {state?.eta?.fallback && (
                      <span className="text-amber-300/80">Approx. ETA</span>
                    )}
                  </div>
                ) : null}

                {/* Worker + address row */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-paper/50">
                      {state.booking.service?.name || 'Service'}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold truncate">
                      {state.booking.worker?.name || 'Awaiting assignment'}
                    </div>
                  </div>
                  <div className="text-right text-xs min-w-0">
                    <div className="flex items-center justify-end gap-1 text-paper/70">
                      <MapPin size={11} />
                      {state.booking.address?.city || '—'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-paper/50 truncate">
                      {state.booking.address?.line1}
                    </div>
                  </div>
                </div>

                {/* Progress timeline */}
                <ol className="mt-3 grid grid-cols-5 gap-1">
                  {TIMELINE.map((step) => {
                    const stepIdx = TIMELINE.findIndex((s) => s.key === step.key);
                    const currIdx = TIMELINE.findIndex((s) => s.key === (STATUS_TO_STEP[status] || status));
                    const reached = stepIdx <= currIdx;
                    const current = step.key === status;
                    return (
                      <li
                        key={step.key}
                        className={`rounded-lg px-2 py-1 text-center text-[9px] uppercase tracking-widest ${
                          current
                            ? 'bg-sky-400/20 text-sky-300 ring-1 ring-sky-400/40'
                            : reached
                            ? 'bg-emerald-400/10 text-emerald-300/80'
                            : 'bg-white/5 text-paper/35'
                        }`}
                      >
                        {step.label}
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-2">
      <div className="text-[9px] uppercase tracking-widest text-paper/50">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
