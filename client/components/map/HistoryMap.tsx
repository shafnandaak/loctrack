import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PositionPoint } from "@/lib/location"; 
import { useEffect } from "react";


const startIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', shadowSize: [41, 41] });
const endIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', shadowSize: [41, 41] });
const defaultIcon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', shadowSize: [41, 41] });

function MapEffects({ points }: { points: PositionPoint[] }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
    if (!points || points.length === 0) return;
    map.fitBounds(points.map(p => [p.lat, p.lng]), { padding: [50, 50] });
  }, [map, points]);
  return null;
}

function SelectedPointEffect({ point, zoom = 16 }: { point: PositionPoint | null, zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (point) {
      map.flyTo([point.lat, point.lng], zoom);
    }
  }, [map, point, zoom]);
  return null;
}

export function HistoryMap({ points, selectedIndex }: { points: PositionPoint[]; selectedIndex?: number | null }) {
  if (!points || points.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <p className="text-muted-foreground">Tidak ada data riwayat untuk ditampilkan.</p>
      </div>
    );
  }

   const selectedPoint = (typeof selectedIndex === 'number' && points[selectedIndex]) 
    ? points[selectedIndex] 
    : null;

  return (
    <MapContainer center={[points[0].lat, points[0].lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
      <Polyline positions={points.map(p => [p.lat, p.lng])} color="blue" weight={5} />
      
      {points.map((p, i) => {
        let icon = defaultIcon;
        if (i === 0) icon = startIcon;
        if (i === points.length - 1) icon = endIcon;

        return (
          <Marker 
            key={p.timestamp} 
            position={[p.lat, p.lng]} 
            icon={icon}
            opacity={selectedIndex === i ? 1 : 0.7}
          >
            <Popup>
              <b>{i === 0 ? "Mulai" : i === points.length - 1 ? "Selesai" : `Titik ${i+1}`}</b><br/>
              {new Date(p.timestamp).toLocaleTimeString("id-ID")}
            </Popup>
          </Marker>
        );
      })}
      <MapEffects points={points} />
      <SelectedPointEffect point={selectedPoint} />
    </MapContainer>
  );
}