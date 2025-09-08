import { differenceInCalendarDays, format } from "date-fns";

export type PositionPoint = {
  lat: number;
  lng: number;
  timestamp: number; // ms epoch
  accuracy?: number | null;
  sessionId?: string | null;
};

export type User = {
  id: string;
  name: string;
  color: string; // hex
  kecamatan?: string | null;
};

export type StopSegment = {
  start: number;
  end: number;
  duration: number;
  lat: number;
  lng: number;
  count: number;
};

/**
 * Analyze stop segments where consecutive points are within stopRadius meters.
 * Returns segments with duration >= minStopDuration (ms)
 */
export function analyzeStops(points: PositionPoint[], stopRadius = 10, minStopDuration = 60_000): StopSegment[] {
  if (!points || points.length === 0) return [];
  const segments: StopSegment[] = [];
  let i = 0;
  while (i < points.length) {
    let j = i + 1;
    const base = points[i];
    const cluster = [base];
    while (j < points.length) {
      const p = points[j];
      const d = distanceMeters(cluster[cluster.length - 1], p);
      if (d <= stopRadius) {
        cluster.push(p);
        j++;
      } else break;
    }
    const start = cluster[0].timestamp;
    const end = cluster[cluster.length - 1].timestamp;
    const duration = end - start;
    if (duration >= minStopDuration) {
      const lat = cluster.reduce((s, x) => s + x.lat, 0) / cluster.length;
      const lng = cluster.reduce((s, x) => s + x.lng, 0) / cluster.length;
      segments.push({ start, end, duration, lat, lng, count: cluster.length });
    }
    i = j;
  }
  return segments;
}

const LS_USERS = "loctrack:users";
const LS_LIVE = "loctrack:live"; // Record<userId, PositionPoint>
const LS_HISTORY_PREFIX = "loctrack:history"; // `${LS_HISTORY_PREFIX}:${userId}:${yyyy-MM-dd}` -> PositionPoint[]

export function dateKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(LS_USERS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as User[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function upsertUser(user: User) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user; else users.push(user);
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

export function removeUser(userId: string) {
  const users = getUsers().filter((u) => u.id !== userId);
  localStorage.setItem(LS_USERS, JSON.stringify(users));
  const live = getAllLivePositions();
  delete live[userId];
  setAllLivePositions(live);
}

export function getAllLivePositions(): Record<string, PositionPoint> {
  try {
    const raw = localStorage.getItem(LS_LIVE);
    return raw ? (JSON.parse(raw) as Record<string, PositionPoint>) : {};
  } catch {
    return {};
  }
}

function setAllLivePositions(rec: Record<string, PositionPoint>) {
  localStorage.setItem(LS_LIVE, JSON.stringify(rec));
}

export function setLivePosition(userId: string, pos: PositionPoint) {
  const rec = getAllLivePositions();
  rec[userId] = pos;
  setAllLivePositions(rec);
  // best-effort send to server
  (async () => {
    try {
      const users = getUsers();
      const user = users.find((u) => u.id === userId) || { id: userId, name: userId };
      await fetch("/api/points", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user, point: pos }) });
    } catch (e) {
      // ignore
    }
  })();
}

export function getLivePosition(userId: string): PositionPoint | null {
  return getAllLivePositions()[userId] ?? null;
}

export function pushHistoryPoint(userId: string, key: string, point: PositionPoint) {
  const list = getHistory(userId, key);
  // Avoid duplicates: skip if same timestamp already recorded
  if (!list.some((p) => p.timestamp === point.timestamp)) {
    list.push(point);
    localStorage.setItem(historyKey(userId, key), JSON.stringify(list));
    // best-effort send to server
    (async () => {
      try {
        const users = getUsers();
        const user = users.find((u) => u.id === userId) || { id: userId, name: userId };
        await fetch("/api/points", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user, point }) });
      } catch (e) {
        // ignore
      }
    })();
  }
}

export function getHistory(userId: string, key: string): PositionPoint[] {
  try {
    const raw = localStorage.getItem(historyKey(userId, key));
    const arr = raw ? (JSON.parse(raw) as PositionPoint[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function clearHistory(userId: string, key: string) {
  localStorage.removeItem(historyKey(userId, key));
}

export function exportUserHistory(userId: string): string {
  const users = getUsers();
  const user = users.find((u) => u.id === userId) || null;
  const all: Record<string, PositionPoint[]> = {};
  // Collect last 60 days by default
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const list = getHistory(userId, k);
    if (list.length) all[k] = list;
  }
  return JSON.stringify({ version: 1, user, data: all }, null, 2);
}

export function importUserHistory(json: string) {
  const parsed = JSON.parse(json) as {
    version: number;
    user: User | null;
    data: Record<string, PositionPoint[]>;
  };
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
  const target = parsed.user?.id ?? "imported";
  if (parsed.user) upsertUser(parsed.user);
  Object.entries(parsed.data || {}).forEach(([k, list]) => {
    if (!Array.isArray(list)) return;
    localStorage.setItem(historyKey(target, k), JSON.stringify(list));
  });
}

export function distanceMeters(a: PositionPoint, b: PositionPoint) {
  const R = 6371e3; // meters
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

export function totalDistance(list: PositionPoint[]) {
  let dist = 0;
  for (let i = 1; i < list.length; i++) dist += distanceMeters(list[i - 1], list[i]);
  return dist;
}

export const defaultUserColors = [
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#22c55e", // green
  "#f97316", // orange
];

export function randomColor(seed?: string) {
  if (!seed) return defaultUserColors[Math.floor(Math.random() * defaultUserColors.length)];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  const idx = Math.abs(hash) % defaultUserColors.length;
  return defaultUserColors[idx];
}

function historyKey(userId: string, key: string) {
  return `${LS_HISTORY_PREFIX}:${userId}:${key}`;
}

export function onStorageChange(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (!e.key) return cb();
    if (e.key.startsWith(LS_HISTORY_PREFIX) || e.key === LS_LIVE || e.key === LS_USERS) cb();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
