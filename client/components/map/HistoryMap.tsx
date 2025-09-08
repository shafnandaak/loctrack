import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PositionPoint, totalDistance } from "@/lib/loctrack";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

type Props = {
  points: PositionPoint[];
  color?: string;
  selectedIndex?: number | null;
};

function MapEffects({ points, selectedIndex }: { points: PositionPoint[]; selectedIndex?: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (selectedIndex != null && points[selectedIndex]) {
      const p = points[selectedIndex];
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 14));
    } else {
      const p = points[0];
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 13));
    }
  }, [map, points, selectedIndex]);
  return null;
}

export function HistoryMap({ points, color = "#22c55e", selectedIndex }: Props) {
  const center = points.length ? [points[0].lat, points[0].lng] as [number, number] : ([-6.2, 106.816666] as [number, number]);
  const poly = points.map((p) => [p.lat, p.lng]) as [number, number][];
  const dist = totalDistance(points);

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEffects points={points} selectedIndex={selectedIndex} />
      {poly.length >= 2 && (
        <Polyline positions={poly} pathOptions={{ color, weight: 4 }} />
      )}

      {points.map((pt, i) => (
        <Marker key={i} position={[pt.lat, pt.lng]}>
          <Popup>
            {new Date(pt.timestamp).toLocaleTimeString()}<br />Durasi: {/* duration handled externally */}
          </Popup>
        </Marker>
      ))}

      {points[0] && (
        <Marker position={[points[0].lat, points[0].lng]} />
      )}
    </MapContainer>
  );
}
