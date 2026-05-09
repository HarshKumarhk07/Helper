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
} from 'lucide-react';
import toast from 'react-hot-toast';
import RouteMap from '../components/booking/RouteMap.jsx';
import {
  ensureSocket,
  joinBookingRoom,
  leaveBookingRoom,
  socket,
} from '../lib/socket.js';
import { getTrackingState } from '../api/tracking.js';
import useSocket from '../hooks/useSocket.js';

const STATUS_BADGE = {
  placed: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  assigned: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  in_progress: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  cancelled: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
};

const STATUS_LABEL = {
  placed: 'Placed',
  assigned: 'Worker en route',
  in_progress: 'Service in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TIMELINE = [
  { key: 'placed', label: 'Placed', Icon: Hourglass },
  { key: 'assigned', label: 'On the way', Icon: Truck },
  { key: 'in_progress', label: 'In progress', Icon: Clock },
  { key: 'completed', label: 'Completed', Icon: CheckCircle2 },
];

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

export default function TrackBooking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { connected } = useSocket();

  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap from REST so the page paints immediately.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTrackingState(bookingId)
      .then((data) => {
        if (cancelled) return;
        setState(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Tracking not available');
        toast.error(err?.response?.data?.message || 'Tracking not available');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Subscribe to live updates.
  useEffect(() => {
    if (!bookingId) return undefined;
    ensureSocket();
    joinBookingRoom(bookingId);

    const onLocation = (data) => {
      if (!data || (data.bookingId && String(data.bookingId) !== String(bookingId))) {
        return;
      }
      setState((prev) => ({
        ...(prev || {}),
        workerLocation: { lat: data.lat, lng: data.lng, at: data.at, workerId: data.workerId },
      }));
    };

    const onRoute = (data) => {
      if (!data || String(data.bookingId) !== String(bookingId)) return;
      setState((prev) => ({
        ...(prev || {}),
        route: data.route || prev?.route || null,
        eta: data.eta || prev?.eta || null,
        destination: data.destination || prev?.destination || null,
        workerLocation: data.workerLocation || prev?.workerLocation || null,
        routeAt: data.at || prev?.routeAt || null,
      }));
    };

    const onWorkerOffline = (data) => {
      if (!data?.workerId) return;
      if (state?.booking?.worker?._id && String(data.workerId) === String(state.booking.worker._id)) {
        toast('Worker disconnected — waiting to resume', { icon: '⚠️' });
      }
    };

    socket.on('location:update', onLocation);
    socket.on('booking:route', onRoute);
    socket.on('worker:offline', onWorkerOffline);

    return () => {
      socket.off('location:update', onLocation);
      socket.off('booking:route', onRoute);
      socket.off('worker:offline', onWorkerOffline);
      leaveBookingRoom(bookingId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const lastSeenAt = state?.workerLocation?.at;
  const lastSeenLabel = useMemo(() => {
    if (!lastSeenAt) return null;
    const sec = Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 1000);
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    return `${Math.round(sec / 60)} min ago`;
  }, [lastSeenAt, state?.workerLocation]);

  const status = state?.booking?.status;
  const cancelled = status === 'cancelled';

  return (
    <section className="relative min-h-[100dvh] bg-[#0a0e1a] text-paper">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[400] px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f172a]/85 px-4 py-2.5 shadow-lg backdrop-blur">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-paper/80 hover:text-paper"
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

      {/* Map */}
      <div className="h-[100dvh] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-paper/60">
            Loading…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-paper/70">
            {error}
          </div>
        ) : (
          <RouteMap
            workerLocation={state?.workerLocation || null}
            destination={state?.destination || null}
            route={state?.route || null}
            follow={false}
            height="100%"
          />
        )}
      </div>

      {/* Bottom sheet */}
      {!loading && !error && state?.booking && (
        <div className="absolute bottom-0 left-0 right-0 z-[400] px-3 pb-3">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a]/95 p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
            {/* Status pill */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest ring-1 ring-inset ${
                    STATUS_BADGE[status] || ''
                  }`}
                >
                  {cancelled ? <XCircle size={12} /> : <Truck size={12} />}
                  {STATUS_LABEL[status] || status}
                </span>
                {lastSeenLabel && state?.workerLocation && (
                  <span className="text-[10px] uppercase tracking-widest text-paper/50">
                    Updated {lastSeenLabel}
                  </span>
                )}
                {state?.eta?.fallback && (
                  <span className="text-[10px] uppercase tracking-widest text-amber-300/80">
                    Approx. ETA
                  </span>
                )}
              </div>
              {state?.booking?.worker?.phone && (
                <a
                  href={`tel:${state.booking.worker.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-xs uppercase tracking-widest text-[#04130c] hover:bg-emerald-400"
                >
                  <Phone size={12} /> Call
                </a>
              )}
            </div>

            {/* ETA / distance */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat label="ETA" value={fmtMinutes(state?.eta?.durationSeconds)} />
              <Stat
                label="Arrival"
                value={fmtTimeFromNow(state?.eta?.durationSeconds)}
              />
              <Stat
                label="Distance"
                value={fmtKm(state?.eta?.distanceMeters)}
              />
            </div>

            {/* Service + worker row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-paper/50">
                  {state.booking.service?.name || 'Service'}
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {state.booking.worker?.name || 'Awaiting assignment'}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center justify-end gap-1 text-paper/70">
                  <MapPin size={12} />
                  {state.booking.address?.city || '—'}
                </div>
                <div className="mt-0.5 text-xs text-paper/50">
                  {state.booking.address?.line1}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <ol className="mt-4 grid grid-cols-4 gap-1.5">
              {TIMELINE.map((step) => {
                const reached = TIMELINE.findIndex((s) => s.key === step.key) <=
                  TIMELINE.findIndex((s) => s.key === status);
                const current = step.key === status;
                return (
                  <li
                    key={step.key}
                    className={`rounded-xl px-2 py-1.5 text-center text-[10px] uppercase tracking-widest ${
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
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-paper/50">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
