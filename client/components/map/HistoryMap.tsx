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
};

export function HistoryMap({ points, color = "#22c55e" }: Props) {
  const center = points.length ? [points[0].lat, points[0].lng] as [number, number] : ([-6.2, 106.816666] as [number, number]);
  const poly = points.map((p) => [p.lat, p.lng]) as [number, number][];
  const dist = totalDistance(points);

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {poly.length >= 2 && (
        <Polyline positions={poly} pathOptions={{ color, weight: 4 }} />
      )}
      {points[0] && (
        <Marker position={[points[0].lat, points[0].lng]}>
          <Popup>
            Start: {new Date(points[0].timestamp).toLocaleTimeString()}
          </Popup>
        </Marker>
      )}
      {points[points.length - 1] && (
        <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]}>
          <Popup>
            Selesai: {new Date(points[points.length - 1].timestamp).toLocaleTimeString()}<br />
            Jarak: {(dist / 1000).toFixed(2)} km
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
