import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ensureSocket, socket } from '../../lib/socket.js';

const EMIT_INTERVAL_MS = 3_000; // minimum ms between location emits
const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 1_500,
  timeout: 15_000,
};

/**
 * WorkerLocationEmitter
 *
 * Invisible component that:
 *  1. Starts `navigator.geolocation.watchPosition` for real-time GPS.
 *  2. Throttles emits to every EMIT_INTERVAL_MS ms.
 *  3. Broadcasts `worker:location` via socket for all active booking IDs.
 *  4. Calls onLocationUpdate(lat, lng) so the parent (WorkerNav) can render
 *     the worker's own marker immediately without waiting for a socket round-trip.
 *  5. Gracefully handles permission denial with a single toast.
 *
 * Props:
 *   workerId       — string   Worker's user ID
 *   activeJobs     — Array<{ _id, status }>  Currently active jobs
 *   onLocationUpdate — (lat, lng) => void   Optional callback for local state
 */
export default function WorkerLocationEmitter({ workerId, activeJobs, onLocationUpdate }) {
  const lastEmitRef = useRef(0);
  const warnedRef = useRef(false);
  const watchIdRef = useRef(null);

  // Stable callback reference — avoid re-running the effect on every render
  const onLocationUpdateRef = useRef(onLocationUpdate);
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  // Derive a stable job-ids string to use as effect dependency
  const trackableIds = (activeJobs || [])
    .filter((j) => j.status === 'assigned' || j.status === 'in_progress')
    .map((j) => j._id)
    .sort()
    .join(',');

  const emitLocation = useCallback(
    (position) => {
      const now = Date.now();
      if (now - lastEmitRef.current < EMIT_INTERVAL_MS) return; // throttle
      lastEmitRef.current = now;

      const { latitude, longitude, accuracy } = position.coords;
      const ids = trackableIds ? trackableIds.split(',') : [];

      console.debug('[WorkerLocationEmitter] emit location', {
        workerId,
        lat: latitude,
        lng: longitude,
        accuracy: accuracy ? `${Math.round(accuracy)}m` : '?',
        bookingIds: ids,
      });

      // Push to socket for server to rebroadcast to room members
      if (ids.length > 0) {
        socket.emit('worker:location', {
          lat: latitude,
          lng: longitude,
          accuracy,
          bookingIds: ids,
        });
      }

      // Also call the parent callback so WorkerNav can show its own marker instantly
      if (onLocationUpdateRef.current) {
        onLocationUpdateRef.current(latitude, longitude);
      }
    },
    [trackableIds, workerId]
  );

  useEffect(() => {
    if (!workerId || !trackableIds) return;

    if (!('geolocation' in navigator)) {
      toast.error('This device does not support live location tracking');
      return;
    }

    ensureSocket();

    // Clear any previous watcher before starting a new one
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    console.debug('[WorkerLocationEmitter] starting watchPosition', {
      workerId,
      bookingIds: trackableIds,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      emitLocation,
      (error) => {
        console.error('[WorkerLocationEmitter] geolocation error', {
          code: error.code,
          message: error.message,
        });
        if (!warnedRef.current) {
          warnedRef.current = true;
          if (error.code === error.PERMISSION_DENIED) {
            toast.error(
              'Location permission denied — customers cannot track your position. Please enable location in your browser settings.'
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error('GPS signal unavailable. Retrying…', { duration: 3000 });
          } else {
            toast.error('Location timeout — retrying in background');
          }
        }
      },
      GEO_OPTIONS
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        console.debug('[WorkerLocationEmitter] watchPosition cleared');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, trackableIds]);

  return null;
}
