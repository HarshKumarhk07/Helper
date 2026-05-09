import { useEffect, useState } from 'react';
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
import { transitionStatus } from '../api/bookings.js';
import useSocket from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_BADGE = {
  assigned: 'bg-sky-400/15 text-sky-300 ring-sky-400/30',
  in_progress: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  cancelled: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
};
const STATUS_LABEL = {
  assigned: 'En route',
  in_progress: 'In service',
  completed: 'Completed',
  cancelled: 'Cancelled',
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
  s == null ? '—' : new Date(Date.now() + s * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function WorkerNav() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected } = useSocket();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const refresh = () => {
    setLoading(true);
    return getTrackingState(bookingId)
      .then(setState)
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Job not available');
        navigate('/worker/jobs');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return undefined;
    ensureSocket();
    joinBookingRoom(bookingId);

    const onLocation = (data) => {
      if (!data || (data.bookingId && String(data.bookingId) !== String(bookingId))) return;
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
      }));
    };

    socket.on('location:update', onLocation);
    socket.on('booking:route', onRoute);

    return () => {
      socket.off('location:update', onLocation);
      socket.off('booking:route', onRoute);
      leaveBookingRoom(bookingId);
    };
  }, [bookingId]);

  const handleStart = async () => {
    const pin = window.prompt('Enter the 6-digit Start PIN from the customer:');
    if (!pin) return;
    setWorking(true);
    try {
      await transitionStatus(bookingId, 'in_progress', 'Started on site', pin);
      toast.success('Job started');
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not start');
    } finally {
      setWorking(false);
    }
  };

  const handleComplete = async () => {
    const pin = window.prompt('Enter the 6-digit End PIN from the customer:');
    if (!pin) return;
    setWorking(true);
    try {
      await transitionStatus(bookingId, 'completed', 'Service completed', pin);
      toast.success('Job completed');
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not complete');
    } finally {
      setWorking(false);
    }
  };

  const openExternalMaps = () => {
    if (!state?.destination) return;
    const { lat, lng } = state.destination;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading || !state?.booking) {
    return (
      <section className="flex min-h-[100dvh] items-center justify-center bg-[#0a0e1a] text-paper/60">
        Loading…
      </section>
    );
  }

  const { booking } = state;
  const status = booking.status;
  const inProgress = status === 'in_progress';
  const finished = status === 'completed' || status === 'cancelled';

  // Active jobs the emitter should push location for — just this one while we're on the nav screen.
  const activeJobs = !finished ? [{ _id: booking._id, status }] : [];

  return (
    <section className="relative min-h-[100dvh] bg-[#0a0e1a] text-paper">
      <WorkerLocationEmitter workerId={user?._id} activeJobs={activeJobs} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[400] px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f172a]/85 px-4 py-2.5 shadow-lg backdrop-blur">
          <button
            onClick={() => navigate('/worker/jobs')}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-paper/80 hover:text-paper"
          >
            <ArrowLeft size={14} /> Jobs
          </button>
          <div className="text-xs uppercase tracking-widest text-paper/60">
            {booking.code}
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

      {/* Map */}
      <div className="h-[100dvh] w-full">
        <RouteMap
          workerLocation={state.workerLocation}
          destination={state.destination}
          route={state.route}
          follow
          height="100%"
        />
      </div>

      {/* Bottom action sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] px-3 pb-3">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a]/95 p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
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
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-xs uppercase tracking-widest text-[#04130c] hover:bg-emerald-400"
                >
                  <Phone size={12} /> Call customer
                </a>
              )}
              {state.destination && (
                <button
                  onClick={openExternalMaps}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1.5 text-xs uppercase tracking-widest text-white hover:bg-sky-400"
                >
                  <Navigation size={12} /> Google Maps
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="ETA" value={fmtMin(state.eta?.durationSeconds)} />
            <Stat label="Arrival" value={fmtArrival(state.eta?.durationSeconds)} />
            <Stat label="Distance" value={fmtKm(state.eta?.distanceMeters)} />
          </div>

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
              <div className="mt-0.5 text-xs text-paper/55">
                {booking.address?.line1}
              </div>
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

          {!finished && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={handleStart}
                disabled={working || inProgress || status !== 'assigned'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-xs uppercase tracking-widest text-[#04130c] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play size={13} /> Start with PIN
              </button>
              <button
                onClick={handleComplete}
                disabled={working || !inProgress}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-xs uppercase tracking-widest text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={13} /> Complete with PIN
              </button>
            </div>
          )}

          {finished && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm text-paper/65">
              {status === 'completed'
                ? 'Job completed. Earnings will appear in your dashboard shortly.'
                : 'Job cancelled.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-paper/55">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
