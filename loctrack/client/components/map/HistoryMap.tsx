import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  duration: number; // Durasi dalam milidetik dari titik sebelumnya
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes} m ${remainingSeconds} d`;
  }
  return `${seconds} d`; // 'd' untuk detik
}

function MapEffects({ points, selectedIndex }: { points: LocationPoint[]; selectedIndex?: number | null }) {
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

type Props = {
  user: string;
  date: string;
  color?: string;
  selectedIndex?: number | null;
};

export function HistoryMap({ user, date, color = "#22c55e", selectedIndex }: Props) {
  const [points, setPoints] = useState<LocationPoint[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !date) {
        setPoints([]);
        return;
      }

      try {
        const startDate = new Date(`${date}T00:00:00`);
        const endDate = new Date(`${date}T23:59:59`);
        const historyRef = collection(db, 'location_history');
        const q = query(
          historyRef,
          where('userId', '==', user),
          where('recorded_at', '>=', startDate),
          where('recorded_at', '<=', endDate),
          orderBy('recorded_at', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedPoints = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            lat: data.latitude as number,
            lng: data.longitude as number,
            timestamp: (data.recorded_at as Timestamp).toMillis(),
            duration: 0,
          };
        });

        for (let i = 1; i < fetchedPoints.length; i++) {
          const prevPoint = fetchedPoints[i - 1];
          const currentPoint = fetchedPoints[i];
          currentPoint.duration = currentPoint.timestamp - prevPoint.timestamp;
        }

        setPoints(fetchedPoints);
      } catch (error) {
        console.error("Error fetching location history:", error);
        setPoints([]);
      }
    };

    fetchHistory();
  }, [user, date]);

  const center = points.length ? [points[0].lat, points[0].lng] as [number, number] : ([-6.2, 106.816666] as [number, number]);
  const poly = points.map((p) => [p.lat, p.lng]) as [number, number][];

  if (!points.length) {
    return (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
            <p className="text-muted-foreground">Memuat data history atau tidak ada data pada tanggal ini.</p>
        </div>
    );
  }

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", borderRadius: 12 }}>
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

      {/* Baris kode yang menyebabkan error sebelumnya sudah dihapus */}

    </MapContainer>
  );
}