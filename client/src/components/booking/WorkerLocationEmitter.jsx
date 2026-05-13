import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { ensureSocket, socket } from '../../lib/socket.js';

const EMIT_INTERVAL_MS = 1_000;

export default function WorkerLocationEmitter({ workerId, activeJobs }) {
  const lastEmitRef = useRef(0);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!workerId) return;
    const trackable = (activeJobs || []).filter(
      (j) => j.status === 'assigned' || j.status === 'in_progress'
    );
    if (trackable.length === 0) return;

    ensureSocket();

    if (!('geolocation' in navigator)) {
      toast.error('This device does not support live location tracking');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastEmitRef.current < EMIT_INTERVAL_MS) return;
        lastEmitRef.current = now;

        const { latitude, longitude, accuracy } = position.coords;
        socket.emit('worker:location', {
          lat: latitude,
          lng: longitude,
          accuracy,
          bookingIds: trackable.map((j) => j._id),
        });
      },
      (error) => {
        if (!warnedRef.current && error?.code === error.PERMISSION_DENIED) {
          warnedRef.current = true;
          toast.error('Location access is required for live tracking');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      // Don't disconnect the socket here — other features (admin tracking,
      // notifications) may also share it. Just let it idle.
    };
  }, [workerId, activeJobs]);

  return null;
}
