import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAllLivePositions, getUsers } from "@/lib/loctrack";
import { useEffect, useMemo, useState } from "react";

// Fix default icon paths (Vite)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER: [number, number] = [-6.200000, 106.816666]; // Jakarta

export function LiveMap() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const positions = useMemo(() => getAllLivePositions(), [tick]);
  const users = useMemo(() => getUsers(), [tick]);

  const center = useMemo(() => {
    const entries = Object.values(positions);
    if (entries.length) return [entries[0].lat, entries[0].lng] as [number, number];
    return DEFAULT_CENTER;
  }, [positions]);

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {Object.entries(positions).map(([userId, p]) => {
        const u = users.find((x) => x.id === userId);
        return (
          <Marker key={userId} position={[p.lat, p.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{u?.name || userId}</div>
                <div>{new Date(p.timestamp).toLocaleTimeString()}</div>
                {typeof p.accuracy === "number" && <div>Akurasi: ±{Math.round(p.accuracy)} m</div>}
              </div>
            </Popup>
          </Marker>
        );
      })}
      {Object.entries(positions).map(([userId, p]) => (
        typeof p.accuracy === "number" ? (
          <Circle key={userId+"-acc"} center={[p.lat, p.lng]} radius={p.accuracy} pathOptions={{ color: "#3b82f6", opacity: 0.3 }} />
        ) : null
      ))}
    </MapContainer>
  );
}
