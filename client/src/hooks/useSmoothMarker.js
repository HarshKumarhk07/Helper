import { useEffect, useRef, useState } from 'react';

const lerp = (a, b, t) => a + (b - a) * t;

// Smooths position updates using requestAnimationFrame.
// Each new target is animated over `duration` ms (default ~9s — slightly less
// than a 10s polling interval so the marker arrives just before the next ping).
//
// usage:
//   const animated = useSmoothMarker(target);
//   <Marker position={animated || target} />
export default function useSmoothMarker(target, { duration = 9000 } = {}) {
  const [animated, setAnimated] = useState(target);
  const rafRef = useRef(null);
  const fromRef = useRef(target);
  const startRef = useRef(performance.now());
  const targetRef = useRef(target);

  useEffect(() => {
    if (!target) return undefined;

    // First-ever target: snap to it instantly so we don't animate from nothing.
    if (!targetRef.current || !animated) {
      fromRef.current = target;
      targetRef.current = target;
      setAnimated(target);
      return undefined;
    }

    // New target — animate from current animated position to it.
    fromRef.current = animated;
    targetRef.current = target;
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out for a natural slow-down at the new position
      const eased = 1 - Math.pow(1 - t, 3);
      const next = {
        lat: lerp(fromRef.current.lat, targetRef.current.lat, eased),
        lng: lerp(fromRef.current.lng, targetRef.current.lng, eased),
      };
      setAnimated(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.lat, target?.lng, duration]);

  return animated;
}
