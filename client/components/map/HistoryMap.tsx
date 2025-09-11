import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Impor tipe yang benar dari file terpusat
import { PositionPoint } from "@/lib/location"; 
import { useEffect } from "react";

// (Kode ikon marker tetap sama)
const icon = L.icon({ iconUrl: "/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const selectedIcon = L.icon({ iconUrl: "/marker-icon-selected.png", iconSize: [32, 52], iconAnchor: [16, 52] });

function MapEffects({ points, selectedIndex }: { points: PositionPoint[]; selectedIndex?: number | null }) {
  const map = useMap();
  useEffect(() => {
    // Invalidate size untuk memastikan peta tampil benar saat tab diaktifkan
    setTimeout(() => map.invalidateSize(), 100);

    if (!points || points.length === 0) return;

    if (selectedIndex != null && points[selectedIndex]) {
      const p = points[selectedIndex];
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15));
    } else {
      map.fitBounds(points.map(p => [p.lat, p.lng]), { padding: [50, 50] });
    }
  }, [map, points, selectedIndex]);
  return null;
}

// Pastikan props "points" menggunakan tipe `PositionPoint[]`
export function HistoryMap({ points, selectedIndex }: { points: PositionPoint[]; selectedIndex?: number | null }) {
  if (!points || points.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-muted">
            <p className="text-muted-foreground">Tidak ada data riwayat untuk ditampilkan di peta.</p>
        </div>
    );
  }

  return (
    <MapContainer center={[points[0].lat, points[0].lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={points.map(p => [p.lat, p.lng])} color="blue" />
      {points.map((p, i) => (
        <Marker 
            key={p.timestamp} 
            position={[p.lat, p.lng]} 
            icon={selectedIndex === i ? selectedIcon : icon}
        >
          <Popup>
            {new Date(p.timestamp).toLocaleString("id-ID", { timeStyle: "medium", dateStyle: "short" })}
          </Popup>
        </Marker>
      ))}
      <MapEffects points={points} selectedIndex={selectedIndex} />
    </MapContainer>
  );
}
