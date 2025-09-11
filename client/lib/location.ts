// Definisikan tipe data PositionPoint di sini atau impor dari berkas tipe terpusat
export type PositionPoint = {
  lat: number;
  lng: number;
  timestamp: number; // ms epoch
  accuracy?: number | null;
};

/**
 * Menghitung durasi antara dua titik dalam format string (menit, detik).
 * @param start Titik awal.
 * @param end Titik akhir.
 * @returns String durasi yang diformat.
 */
export function formatDuration(start: PositionPoint, end: PositionPoint): string {
  if (!start || !end) return "-";
  
  const seconds = Math.floor((end.timestamp - start.timestamp) / 1000);
  if (seconds < 0) return "-";
  if (seconds < 60) return `${seconds} detik`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes} menit ${remainingSeconds} detik`;
}

/**
 * Menghitung jarak antara dua titik geografis dalam meter.
 */
export function distanceMeters(a: PositionPoint, b: PositionPoint): number {
  const R = 6371e3; // meter
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

/**
 * Menghitung total jarak dari serangkaian titik.
 */
export function totalDistance(list: PositionPoint[]): number {
  let dist = 0;
  if (!list || list.length < 2) return 0;
  for (let i = 1; i < list.length; i++) {
    dist += distanceMeters(list[i - 1], list[i]);
  }
  return dist;
}