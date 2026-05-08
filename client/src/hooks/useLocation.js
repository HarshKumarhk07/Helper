import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15_000,
};

// Browser geolocation hook with permission/error state.
// - watch: true (default) → uses watchPosition (live updates)
// - watch: false → reads position once on demand via .getCurrent()
export default function useLocation({ watch = true, options } = {}) {
  const [position, setPosition] = useState(null); // { lat, lng, accuracy, at }
  const [error, setError] = useState(null); // { code, message }
  const [supported] = useState(
    () => typeof navigator !== 'undefined' && 'geolocation' in navigator
  );
  const watchIdRef = useRef(null);

  const handleSuccess = useCallback((pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    setError(null);
    setPosition({
      lat: latitude,
      lng: longitude,
      accuracy,
      at: new Date(pos.timestamp || Date.now()).toISOString(),
    });
  }, []);

  const handleError = useCallback((err) => {
    setError({
      code: err.code,
      message:
        err.code === err.PERMISSION_DENIED
          ? 'Location permission denied'
          : err.code === err.POSITION_UNAVAILABLE
          ? 'Location currently unavailable'
          : err.code === err.TIMEOUT
          ? 'Location request timed out'
          : err.message || 'Failed to read location',
    });
  }, []);

  useEffect(() => {
    if (!watch || !supported) return undefined;
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { ...DEFAULT_OPTIONS, ...(options || {}) }
    );
    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [watch, supported, handleSuccess, handleError, options]);

  const getCurrent = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!supported) {
          const err = new Error('Geolocation not supported');
          setError({ code: -1, message: err.message });
          return reject(err);
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            handleSuccess(pos);
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          (err) => {
            handleError(err);
            reject(err);
          },
          { ...DEFAULT_OPTIONS, ...(options || {}) }
        );
      }),
    [supported, handleSuccess, handleError, options]
  );

  return { position, error, supported, getCurrent };
}
