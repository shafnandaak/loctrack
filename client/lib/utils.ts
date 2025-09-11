import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { PositionPoint } from "./location"; // Mengimpor dari location.ts

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pointsToCsv(points: PositionPoint[]): string {
  if (!points.length) return "";
  const header = "timestamp,latitude,longitude,accuracy\n";
  const rows = points.map(p => 
    `${new Date(p.timestamp).toISOString()},${p.lat},${p.lng},${p.accuracy || ''}`
  ).join("\n");

  return header + rows;
}
