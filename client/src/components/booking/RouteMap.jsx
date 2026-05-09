import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSmoothMarker from '../../hooks/useSmoothMarker.js';

// Carto dark tiles — no API key required, dark theme suitable for a tracking UI.
const DARK_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Inline SVG icons — keep the bundle clean of asset deps.
const workerIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(56,189,248,0.25);animation:vh-pulse 1.6s ease-out infinite;"></span>
      <span style="position:relative;width:18px;height:18px;border-radius:9999px;background:#38bdf8;box-shadow:0 0 0 3px #0f172a, 0 0 18px rgba(56,189,248,0.7);"></span>
    </div>
    <style>
      @keyframes vh-pulse {
        0%   { transform: scale(0.6); opacity: 0.9; }
        80%  { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1.6); opacity: 0; }
      }
    </style>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const destinationIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:28px;height:28px;border-radius:9999px;background:#fb7185;box-shadow:0 0 0 3px #0f172a;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;">
        ★
      </div>
      <div style="width:2px;height:10px;background:#fb7185;margin-top:-2px;"></div>
    </div>
  `,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
});

// Auto-fit bounds to encompass the worker, destination and route.
function FitBounds({ bounds, version }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds || bounds.length < 2) return;
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
  return null;
}

// Pan to follow the worker once we've already done the initial fit.
function FollowWorker({ position, follow }) {
  const map = useMap();
  useEffect(() => {
    if (!follow || !position) return;
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.6 });
  }, [follow, position?.lat, position?.lng, map]);
  return null;
}

export default function RouteMap({
  workerLocation, // { lat, lng } | null
  destination,    // { lat, lng } | null
  route,          // { coordinates: [{lat, lng}] } | null
  follow = false, // pan to keep worker centered on each update
  height = 400,
}) {
  const animatedWorker = useSmoothMarker(workerLocation);

  const polyline = useMemo(() => {
    if (!route?.coordinates?.length) return null;
    return route.coordinates.map((p) => [p.lat, p.lng]);
  }, [route]);

  const initialCenter = useMemo(() => {
    if (workerLocation) return [workerLocation.lat, workerLocation.lng];
    if (destination) return [destination.lat, destination.lng];
    return [28.6139, 77.209]; // sane Delhi fallback so the map renders
  }, [workerLocation, destination]);

  // Recompute bounds whenever the route or destination changes meaningfully —
  // a counter is enough to avoid passing a deep-equality dependency.
  const fitVersionRef = useRef(0);
  const fitVersion = useMemo(() => {
    fitVersionRef.current += 1;
    return fitVersionRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    route?.coordinates?.length,
    destination?.lat,
    destination?.lng,
    workerLocation && !animatedWorker ? 1 : 0,
  ]);

  const bounds = useMemo(() => {
    const pts = [];
    if (workerLocation) pts.push([workerLocation.lat, workerLocation.lng]);
    if (destination) pts.push([destination.lat, destination.lng]);
    if (polyline) {
      // sample to avoid extreme outlier polyline points dominating bounds
      pts.push(polyline[0]);
      pts.push(polyline[polyline.length - 1]);
    }
    return pts.length > 1 ? pts : null;
  }, [workerLocation, destination, polyline]);

  return (
    <div
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]"
    >
      <MapContainer
        center={initialCenter}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer url={DARK_TILE_URL} attribution={DARK_TILE_ATTRIBUTION} />

        {polyline && (
          <Polyline
            positions={polyline}
            pathOptions={{
              color: '#38bdf8',
              weight: 5,
              opacity: 0.9,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          />
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          />
        )}

        {animatedWorker && (
          <Marker
            position={[animatedWorker.lat, animatedWorker.lng]}
            icon={workerIcon}
          />
        )}

        {bounds && <FitBounds bounds={bounds} version={fitVersion} />}
        <FollowWorker position={animatedWorker} follow={follow} />
      </MapContainer>
    </div>
  );
}
