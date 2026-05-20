import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSmoothMarker from '../../hooks/useSmoothMarker.js';

// Satellite tiles (Esri World Imagery) — suitable for live tracking.
const DARK_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const DARK_TILE_ATTRIBUTION = 'Tiles © Esri — Source: Esri, USGS, NOAA';

// ─── Custom DivIcons ────────────────────────────────────────────────────────

const workerIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(56,189,248,0.22);animation:vh-pulse 1.8s ease-out infinite;"></span>
      <span style="position:absolute;inset:6px;border-radius:9999px;background:rgba(56,189,248,0.12);animation:vh-pulse 1.8s ease-out infinite;animation-delay:0.3s;"></span>
      <span style="position:relative;width:20px;height:20px;border-radius:9999px;background:#38bdf8;box-shadow:0 0 0 3px #0f172a,0 0 20px rgba(56,189,248,0.8);display:flex;align-items:center;justify-content:center;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </span>
    </div>
    <style>
      @keyframes vh-pulse {
        0%   { transform: scale(0.5); opacity: 0.85; }
        80%  { transform: scale(1.7); opacity: 0; }
        100% { transform: scale(1.7); opacity: 0; }
      }
    </style>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
});

const customerIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="position:relative;width:44px;height:52px;display:flex;flex-direction:column;align-items:center;">
      <div style="position:relative;width:36px;height:36px;border-radius:9999px;background:linear-gradient(135deg,#fb7185,#f43f5e);box-shadow:0 0 0 3px #0f172a,0 0 18px rgba(251,113,133,0.6);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <div style="width:3px;height:14px;background:linear-gradient(#fb7185,transparent);border-radius:0 0 2px 2px;margin-top:1px;"></div>
    </div>
  `,
  iconSize: [44, 52],
  iconAnchor: [22, 52],
  popupAnchor: [0, -52],
});

// ─── Map controller components ───────────────────────────────────────────────

/**
 * Fits the map bounds to include both markers + route on mount and
 * whenever the key changes. Uses a ref to avoid re-running on every render.
 */
function FitBounds({ bounds, boundsKey }) {
  const map = useMap();
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!bounds || bounds.length < 2) return;
    if (boundsKey === lastKeyRef.current) return; // no change
    lastKeyRef.current = boundsKey;

    try {
      const latLngBounds = L.latLngBounds(bounds);
      if (latLngBounds.isValid()) {
        map.fitBounds(latLngBounds, {
          padding: [60, 60],
          maxZoom: 16,
          animate: true,
          duration: 0.8,
        });
        console.debug('[map] fitBounds →', bounds.length, 'points');
      }
    } catch (e) {
      console.warn('[map] fitBounds error', e);
    }
  }, [boundsKey, bounds, map]);

  return null;
}

/** Pan/fly to keep the worker centred (only when follow=true and no destination). */
function FollowWorker({ position, follow }) {
  const map = useMap();
  const lastPosRef = useRef(null);

  useEffect(() => {
    if (!follow || !position) return;
    const { lat, lng } = position;
    if (
      lastPosRef.current &&
      Math.abs(lastPosRef.current.lat - lat) < 0.00001 &&
      Math.abs(lastPosRef.current.lng - lng) < 0.00001
    )
      return;
    lastPosRef.current = position;
    map.panTo([lat, lng], { animate: true, duration: 0.6 });
  }, [follow, position?.lat, position?.lng, map]);

  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasCoords(p) {
  return (
    p != null &&
    typeof p.lat === 'number' &&
    Number.isFinite(p.lat) &&
    typeof p.lng === 'number' &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * RouteMap
 *
 * Props:
 *   workerLocation  — { lat, lng } | null   Worker / provider position
 *   destination     — { lat, lng } | null   Customer / service address position
 *   route           — { coordinates: [{lat,lng}] } | null  OSRM/ORS polyline
 *   follow          — boolean               Pan to keep worker centred on updates
 *   height          — number | string       CSS height of the map container
 *   showNoDataMsg   — boolean               Show placeholder when no coords at all
 */
export default function RouteMap({
  workerLocation,
  destination,
  route,
  follow = false,
  height = 400,
  showNoDataMsg = false,
}) {
  // Smoothly animate the worker marker between GPS pings.
  const animatedWorker = useSmoothMarker(workerLocation);

  const validWorker = hasCoords(animatedWorker)
    ? animatedWorker
    : hasCoords(workerLocation)
    ? workerLocation
    : null;
  const validDestination = hasCoords(destination) ? destination : null;

  // Debug log whenever either marker changes
  useEffect(() => {
    console.debug('[RouteMap] markers update', {
      worker: validWorker
        ? { lat: validWorker.lat.toFixed(5), lng: validWorker.lng.toFixed(5) }
        : null,
      customer: validDestination
        ? { lat: validDestination.lat.toFixed(5), lng: validDestination.lng.toFixed(5) }
        : null,
      routePoints: route?.coordinates?.length ?? 0,
    });
  }, [
    validWorker?.lat,
    validWorker?.lng,
    validDestination?.lat,
    validDestination?.lng,
    route?.coordinates?.length,
  ]);

  // Build polyline array for Leaflet.
  const polyline = useMemo(() => {
    if (!route?.coordinates?.length) return null;
    const pts = route.coordinates.map((p) => [p.lat, p.lng]);
    console.debug('[RouteMap] polyline built', pts.length, 'points');
    return pts;
  }, [route?.coordinates]);

  // Initial center for the MapContainer (only used on first mount).
  const initialCenter = useMemo(() => {
    if (validWorker) return [validWorker.lat, validWorker.lng];
    if (validDestination) return [validDestination.lat, validDestination.lng];
    return [20.5937, 78.9629]; // India centre — better default than 0,0
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A string key that changes only when either marker or route meaningfully changes.
  // Used by FitBounds to avoid re-fitting on every minor positional jitter.
  const boundsKey = useMemo(() => {
    const w = validWorker
      ? `${validWorker.lat.toFixed(4)},${validWorker.lng.toFixed(4)}`
      : 'no-worker';
    const c = validDestination
      ? `${validDestination.lat.toFixed(4)},${validDestination.lng.toFixed(4)}`
      : 'no-customer';
    const r = route?.coordinates?.length ?? 0;
    return `${w}|${c}|${r}`;
  }, [validWorker, validDestination, route?.coordinates?.length]);

  // Bounds array for FitBounds — includes both markers and first/last route point.
  const bounds = useMemo(() => {
    const pts = [];
    if (validWorker) pts.push([validWorker.lat, validWorker.lng]);
    if (validDestination) pts.push([validDestination.lat, validDestination.lng]);
    // Adding route endpoints helps Leaflet fit to the actual driven path.
    if (polyline?.length > 1) {
      pts.push(polyline[0]);
      pts.push(polyline[polyline.length - 1]);
    }
    return pts.length >= 2 ? pts : null;
  }, [validWorker, validDestination, polyline]);

  const shouldFollowWorker = follow && !validDestination;

  // No-data placeholder
  if (!validWorker && !validDestination && showNoDataMsg) {
    return (
      <div
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]"
      >
        <div className="text-center text-sm text-white/40 px-6">
          <div className="text-2xl mb-2">📍</div>
          <div>Waiting for location data…</div>
          <div className="text-xs mt-1 text-white/25">
            Both worker and customer positions will appear here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      className="relative z-0 isolate overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]"
    >
      <MapContainer
        center={initialCenter}
        zoom={validWorker || validDestination ? 14 : 5}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer url={DARK_TILE_URL} attribution={DARK_TILE_ATTRIBUTION} />

        {/* Route polyline — rendered before markers so it stays below them */}
        {polyline && (
          <Polyline
            positions={polyline}
            pathOptions={{
              color: '#38bdf8',
              weight: 5,
              opacity: 0.88,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          />
        )}

        {/* Customer / destination marker — ALWAYS render if we have valid coords */}
        {validDestination && (
          <Marker
            position={[validDestination.lat, validDestination.lng]}
            icon={customerIcon}
            zIndexOffset={100}
          >
            <Popup className="leaflet-popup-dark">
              <div className="text-xs font-medium">📍 Customer Location</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {validDestination.lat.toFixed(5)}, {validDestination.lng.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Worker / provider marker — animated via useSmoothMarker */}
        {validWorker && (
          <Marker
            position={[validWorker.lat, validWorker.lng]}
            icon={workerIcon}
            zIndexOffset={200}
          >
            <Popup>
              <div className="text-xs font-medium">🔵 Worker Location</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {validWorker.lat.toFixed(5)}, {validWorker.lng.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Auto-fit — only fires when boundsKey changes */}
        {bounds && <FitBounds bounds={bounds} boundsKey={boundsKey} />}

        {/* Follow worker (only when follow=true and no destination) */}
        <FollowWorker position={validWorker} follow={shouldFollowWorker} />
      </MapContainer>
    </div>
  );
}
