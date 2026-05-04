import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { socket } from '../../lib/socket.js';
import { X } from 'lucide-react';

const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzE4MTgxYSI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Component to handle smooth pan/zoom
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function LiveTrackerModal({ booking, onClose }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const eventName = `locationUpdate_${booking._id}`;
    
    const handleLocationUpdate = (data) => {
      setPosition([data.lat, data.lng]);
    };

    socket.on(eventName, handleLocationUpdate);

    return () => {
      socket.off(eventName, handleLocationUpdate);
    };
  }, [booking._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl dark:bg-[#18181A]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-paper p-2 text-ink shadow hover:bg-sand dark:bg-[#28282A] dark:text-paper"
        >
          <X size={20} />
        </button>
        
        <div className="p-6 pb-4">
          <h2 className="heading-display text-2xl font-bold text-ink dark:text-paper">LIVE TRACKING</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/60">
            Worker is on the way for {booking.service?.name}
          </p>
          <div className="mt-2 text-xs font-bold uppercase tracking-widest">
            {position ? <span className="text-green-600">Location receiving live</span> : <span className="text-orange-500">Waiting for worker signal...</span>}
          </div>
          
          <div className="mt-4 flex gap-4 text-xs">
            <div className="rounded border border-ink/10 p-2 dark:border-paper/10 text-ink dark:text-paper">
              <div>Start PIN:</div>
              <div className="font-mono text-lg font-bold">{booking.startPin}</div>
            </div>
            <div className="rounded border border-ink/10 p-2 dark:border-paper/10 text-ink dark:text-paper">
              <div>End PIN:</div>
              <div className="font-mono text-lg font-bold">{booking.endPin}</div>
            </div>
          </div>
        </div>

        <div className="h-96 w-full bg-sand">
          <MapContainer 
            center={position || [booking.address?.lat || 28.6139, booking.address?.lng || 77.2090]} 
            zoom={13} 
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {position && (
              <>
                <Marker position={position} icon={customIcon} />
                <MapUpdater position={position} />
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
