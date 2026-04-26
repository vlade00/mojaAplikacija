import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

const SALON_CENTER: [number, number] = [44.7585, 20.486];

const salonMarkerIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type SalonMapPreviewProps = {
  /** npr. aspect-[16/9] roditelj sa relative + absolute inset-0 unutra */
  className?: string;
};

/**
 * Interaktivna mapa (Carto Voyager — čitljiva, „aplikacijski“ izgled, bez Google API ključa).
 */
function SalonMapPreview({ className = '' }: SalonMapPreviewProps) {
  return (
    <div className={`h-full w-full min-h-[160px] ${className}`}>
      <MapContainer
        center={SALON_CENTER}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        className="z-0 h-full w-full [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-attribution]:bg-white/90 [&_.leaflet-control-attribution]:rounded-tl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={SALON_CENTER} icon={salonMarkerIcon}>
          <Popup>HairStudio — Braće Jerković 72, Beograd</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default SalonMapPreview;
