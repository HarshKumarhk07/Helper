// OSRM routing client.
// Default: free public OSRM server (router.project-osrm.org).
// Override with OSRM_BASE_URL env var, or set OPENROUTESERVICE_API_KEY to use ORS.

const DEFAULT_OSRM = 'https://router.project-osrm.org';
const ROUTE_CACHE_TTL_MS = 30_000; // 30s — coarse enough for ETA, cheap enough for live updates
const ROUTE_CACHE_BUCKET_M = 25;   // round positions to ~25m buckets to keep the cache hit-rate high

const cache = new Map(); // key -> { route, expiresAt }

const round = (num, places = 4) => {
  const f = Math.pow(10, places);
  return Math.round(num * f) / f;
};

// Build a cache key from rounded lat/lng so small jitter doesn't bust the cache.
const cacheKey = ({ from, to }) =>
  `${round(from.lat)},${round(from.lng)}|${round(to.lat)},${round(to.lng)}`;

// Haversine distance in meters — used as a fallback if routing fails or for "is the worker near?" checks.
export const haversineMeters = (a, b) => {
  if (!a || !b) return null;
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const parseOsrmGeometry = (geometry) => {
  // OSRM geojson geometry: { type: 'LineString', coordinates: [[lng,lat], ...] }
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];
  // Normalize to [{ lat, lng }] for the frontend (Leaflet wants [lat, lng]).
  return geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
};

const buildHaversineFallback = ({ from, to }) => {
  const distance = haversineMeters(from, to);
  if (distance == null) return null;
  // Crude ETA assuming a 25 km/h average urban speed.
  const duration = (distance / 1000) * (3600 / 25);
  return {
    distance,
    duration,
    coordinates: [from, to],
    fallback: true,
  };
};

const fetchOsrm = async ({ from, to, signal }) => {
  const base = (process.env.OSRM_BASE_URL || DEFAULT_OSRM).replace(/\/$/, '');
  const url = `${base}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=false&steps=false`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`OSRM ${data.code || 'no-route'}`);
  }
  const route = data.routes[0];
  return {
    distance: route.distance, // meters
    duration: route.duration, // seconds
    coordinates: parseOsrmGeometry(route.geometry),
    fallback: false,
  };
};

// Returns the cached route if still fresh, otherwise fetches a new one.
// On any failure, returns a haversine straight-line fallback so the UI still works.
export const getRoute = async ({ from, to } = {}) => {
  if (
    !from ||
    !to ||
    typeof from.lat !== 'number' ||
    typeof from.lng !== 'number' ||
    typeof to.lat !== 'number' ||
    typeof to.lng !== 'number'
  ) {
    return null;
  }

  const key = cacheKey({ from, to });
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.route;
  }

  // Best-effort timeout — don't block the socket loop on a slow OSRM.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const route = await fetchOsrm({ from, to, signal: controller.signal });
    cache.set(key, { route, expiresAt: Date.now() + ROUTE_CACHE_TTL_MS });
    return route;
  } catch (err) {
    // Use a fallback but DON'T cache it long — we want to retry routing soon.
    const fallback = buildHaversineFallback({ from, to });
    if (fallback) {
      cache.set(key, {
        route: fallback,
        expiresAt: Date.now() + 5_000,
      });
    }
    return fallback;
  } finally {
    clearTimeout(timer);
  }
};

// Quick-look helpers used by the socket layer to throttle re-routing.
export const significantMove = (a, b, thresholdMeters = 50) => {
  if (!a || !b) return true;
  return haversineMeters(a, b) > thresholdMeters;
};

// Friendlier output shape for the wire.
export const buildEta = ({ route }) => {
  if (!route) return null;
  return {
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    fallback: !!route.fallback,
  };
};
