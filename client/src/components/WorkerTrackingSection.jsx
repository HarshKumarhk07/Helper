import { MapContainer, TileLayer, Marker } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

export default function WorkerTrackingSection({ lat = 28.6139, lng = 77.209, workerName = "Delivery Partner" }) {
  return (
    <div className="h-[400px] w-full overflow-hidden rounded-card">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution={'Tiles © Esri — Source: Esri, USGS, NOAA'}
            />
        <Marker position={[lat, lng]}>
        </Marker>
      </MapContainer>
      <div className="bg-paper p-3 text-center text-xs tracking-tightish text-ink/70">
        Live tracking: {workerName} is on the way
      </div>
    </div>
  );
}
