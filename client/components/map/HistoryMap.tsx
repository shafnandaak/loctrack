import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import "leaflet/dist/images/marker-icon.png";
import "leaflet/dist/images/marker-icon-2x.png";
import "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Interface ini akan kita gunakan juga di Index.tsx
export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  duration: number;
}

// Komponen MapEffects diubah sedikit untuk fokus ke titik yang dipilih
function MapEffects({ points, selectedIndex }: { points: LocationPoint[]; selectedIndex: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;

    // Jika ada index yang dipilih, fokus ke sana
    if (selectedIndex !== null && points[selectedIndex]) {
      const p = points[selectedIndex];
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15));
    }
  }, [map, points, selectedIndex]); // Efek hanya berjalan jika selectedIndex berubah
  return null;
}

// Props diubah, sekarang menerima 'points' langsung
type Props = {
  points: LocationPoint[];
  color?: string;
  selectedIndex: number | null;
};

export function HistoryMap({ points, color = "#22c55e", selectedIndex }: Props) {
  const center = points.length ? [points[0].lat, points[0].lng] as [number, number] : ([-7.32, 108.21] as [number, number]);
  const poly = points.map((p) => [p.lat, p.lng]) as [number, number][];

  if (!points.length) {
    return (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
            <p className="text-muted-foreground">Tidak ada data history pada tanggal ini.</p>
        </div>
    );
  }

  return (
    <MapContainer {...{center: center, zoom: 13, style: { height: "100%", width: "100%", borderRadius: 12 }}}>
      <TileLayer
        {...{
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }}
      />
      <MapEffects points={points} selectedIndex={selectedIndex} />
      {poly.length >= 2 && (
        <Polyline positions={poly} pathOptions={{ color, weight: 4 }} />
      )}
      {points.map((pt, i) => (
        <Marker key={i} position={[pt.lat, pt.lng]}>
          <Popup>
            Waktu: {new Date(pt.timestamp).toLocaleTimeString()}
            <br />
            Durasi: {i > 0 ? formatDuration(pt.duration) : 'Titik awal'}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// Pindahkan fungsi formatDuration ke sini agar bisa digunakan di komponen lain jika perlu
export function formatDuration(ms: number) {
    if (ms < 1000) return `0d`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
  
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}d`;
    }
    return `${seconds}d`;
  }