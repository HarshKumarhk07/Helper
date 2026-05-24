import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import RouteMap from './RouteMap.jsx';
import {
  ensureSocket,
  joinBookingRoom,
  leaveBookingRoom,
  socket,
} from '../../lib/socket.js';
import { getTrackingState } from '../../api/tracking.js';
import useSocket from '../../hooks/useSocket.js';

const fmtKm = (meters) => {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 2 : 1)} km`;
};
const fmtMinutes = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.round(seconds / 60);
  if (m < 1) return '<1m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

export default function LiveTrackerModal({ booking, onClose }) {
  const { connected } = useSocket();
  const [state, setState] = useState({
    workerLocation: null,
    route: null,
    eta: null,
    destination:
      typeof booking?.address?.lat === 'number' &&
      typeof booking?.address?.lng === 'number'
        ? { lat: booking.address.lat, lng: booking.address.lng }
        : null,
  });

  // Close on Escape — backdrop click is handled inline below.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!booking?._id) return undefined;

    // Bootstrap from REST so the map paints with whatever's already cached server-side.
    let cancelled = false;
    getTrackingState(booking._id)
      .then((data) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          workerLocation: data.workerLocation || prev.workerLocation,
          route: data.route || prev.route,
          eta: data.eta || prev.eta,
          destination: data.destination || prev.destination,
        }));
      })
      .catch(() => {
        // Non-fatal — live updates will fill it in.
      });

    ensureSocket();
    joinBookingRoom(booking._id);

    const onLocation = (data) => {
      if (data.bookingId && String(data.bookingId) !== String(booking._id)) return;
      setState((prev) => ({
        ...prev,
        workerLocation: { lat: data.lat, lng: data.lng, at: data.at, workerId: data.workerId },
      }));
    };
    const onRoute = (data) => {
      if (String(data.bookingId) !== String(booking._id)) return;
      setState((prev) => ({
        ...prev,
        route: data.route || prev.route,
        eta: data.eta || prev.eta,
        destination: data.destination || prev.destination,
        workerLocation: data.workerLocation || prev.workerLocation,
      }));
    };

    socket.on('location:update', onLocation);
    socket.on('booking:route', onRoute);

    return () => {
      cancelled = true;
      socket.off('location:update', onLocation);
      socket.off('booking:route', onRoute);
      leaveBookingRoom(booking._id);
    };
  }, [booking?._id]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] text-paper shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-[500] rounded-full bg-white/10 p-2 text-paper hover:bg-white/20"
        >
          <X size={18} />
        </button>

        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="heading-display text-2xl font-bold">LIVE TRACKING</h2>
            <span
              className={`ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ring-1 ring-inset ${
                connected
                  ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30'
                  : 'bg-rose-400/15 text-rose-300 ring-rose-400/30'
              }`}
            >
              {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {connected ? 'Live' : 'Reconnecting'}
            </span>
          </div>
          <p className="mt-1 text-sm text-paper/65">
            {booking.worker?.name
              ? `${booking.worker.name} is on the way for ${booking.service?.name}`
              : `Worker is on the way for ${booking.service?.name}`}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="ETA" value={fmtMinutes(state.eta?.durationSeconds)} />
            <Stat label="Distance" value={fmtKm(state.eta?.distanceMeters)} />
            <Stat
              label="Status"
              value={
                state.workerLocation
                  ? 'En route'
                  : booking.status?.replace('_', ' ') || '—'
              }
            />
          </div>

          <div className="mt-4 flex gap-4 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="text-paper/55">Start PIN</div>
              <div className="font-mono text-lg font-bold tracking-widest">
                {booking.startPin}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="text-paper/55">End PIN</div>
              <div className="font-mono text-lg font-bold tracking-widest">
                {booking.endPin}
              </div>
            </div>
          </div>
        </div>

        <RouteMap
          workerLocation={state.workerLocation}
          destination={state.destination}
          route={state.route}
          follow={false}
          height={384}
        />

        <div className="flex items-center justify-end border-t border-white/10 bg-[#0a0e1a] px-6 py-3">
          <Link
            to={`/track/${booking._id}`}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1.5 text-xs uppercase tracking-widest text-white hover:bg-sky-400"
          >
            Open full tracker <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-paper/55">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold capitalize tabular-nums">
        {value}
      </div>
    </div>
  );
}
