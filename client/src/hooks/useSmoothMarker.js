import { useEffect, useRef, useState } from 'react';

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * useSmoothMarker
 *
 * Smoothly animates a GPS marker from its previous position to a new target
 * using requestAnimationFrame, so the marker glides instead of jumping.
 *
 * @param {Object|null} target  - { lat, lng } target coordinates
 * @param {Object}      options - { duration: number } animation duration in ms
 * @returns {Object|null}       - { lat, lng } current animated position
 */
export default function useSmoothMarker(target, { duration = 1200 } = {}) {
  const [animated, setAnimated] = useState(target);
  const rafRef = useRef(null);
  const fromRef = useRef(null);        // position at animation start
  const targetRef = useRef(target);   // current destination
  const animatedRef = useRef(target); // latest animated value (avoids stale closure)
  const startRef = useRef(performance.now());

  useEffect(() => {
    // Nothing to animate toward
    if (!target || typeof target.lat !== 'number' || typeof target.lng !== 'number') {
      return undefined;
    }

    // First position — snap immediately
    if (!animatedRef.current) {
      fromRef.current = target;
      targetRef.current = target;
      animatedRef.current = target;
      setAnimated(target);
      return undefined;
    }

    // If the target hasn't changed meaningfully, skip
    const prev = targetRef.current;
    if (
      prev &&
      Math.abs(prev.lat - target.lat) < 0.000001 &&
      Math.abs(prev.lng - target.lng) < 0.000001
    ) {
      return undefined;
    }

    // Start a new animation from the current animated position to the new target
    fromRef.current = animatedRef.current;
    targetRef.current = target;
    startRef.current = performance.now();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out for natural deceleration
      const eased = 1 - Math.pow(1 - t, 3);

      const next = {
        lat: lerp(fromRef.current.lat, targetRef.current.lat, eased),
        lng: lerp(fromRef.current.lng, targetRef.current.lng, eased),
      };

      animatedRef.current = next;
      setAnimated({ ...next }); // new reference so React re-renders

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target?.lat, target?.lng, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return animated;
}
