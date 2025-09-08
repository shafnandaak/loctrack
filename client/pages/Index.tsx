import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { LiveMap } from "@/components/map/LiveMap";
import { HistoryMap } from "@/components/map/HistoryMap";
import { BadgeCheck, MapPin, Play, Square, Upload, Users } from "lucide-react";
import {
  PositionPoint,
  User,
  dateKey,
  getAllLivePositions,
  getHistory,
  getUsers,
  importUserHistory,
  onStorageChange,
  pushHistoryPoint,
  randomColor,
  setLivePosition,
  totalDistance,
  upsertUser,
  distanceMeters,
} from "@/lib/loctrack";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/supabase";

export default function Index() {
  const [tab, setTab] = useState("monitor");
  const [usersTick, setUsersTick] = useState(0);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => onStorageChange(() => setUsersTick((t) => t + 1)), []);
  useEffect(() => {
    (async () => {
      const u = await getCurrentUser().catch(() => null);
      setAuthUser(u);
      try {
        const list = (localStorage.getItem("loctrack:admins") || "").split(",").map((s) => s.trim()).filter(Boolean);
        setIsAdmin(!!u && list.includes(u.email));
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-indigo-50">
      <Header />
      <main className="container py-8">
        <Hero isAdmin={isAdmin} />
        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList>
            <TabsTrigger value="monitor" id="monitor">Monitoring</TabsTrigger>
            <TabsTrigger value="share" id="share">Share Lokasi</TabsTrigger>
            <TabsTrigger value="history" id="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="monitor" className="mt-6">
            <MonitorSection tick={usersTick} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="share" className="mt-6">
            <ShareSection onChanged={() => setUsersTick((t) => t + 1)} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <HistorySection tick={usersTick} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-12 border-t">
        <div className="container py-6 text-sm text-muted-foreground">© {new Date().getFullYear()} LocTrack �� Sistem monitoring share lokasi dengan riwayat harian.</div>
      </footer>
    </div>
  );
}

function Hero({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
          Real‑time & Rekap Harian
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Monitoring Share Lokasi Multi‑User {"\u00A0"}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Kelola tim yang membagikan lokasi dan pantau pergerakan mereka secara langsung.
          Setiap pengguna memiliki riwayat per hari untuk kebutuhan laporan.
        </p>
      </div>
      <div className="rounded-xl border bg-white/70 p-3 shadow-sm">
        <div className="aspect-[16/9] rounded-lg overflow-hidden">
          <LiveMap isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

function MonitorSection({ tick }: { tick: number }) {
  const users = useMemo(() => getUsers(), [tick]);
  const live = useMemo(() => getAllLivePositions(), [tick]);
  const [kecFilter, setKecFilter] = useState<string | null>(null);
  const [kecOptions, setKecOptions] = useState<string[]>([]);

  // reverse geocode cache in sessionStorage
  function cacheKey(lat: number, lng: number) {
    return `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  async function getKecamatan(lat: number, lng: number) {
    const key = cacheKey(lat, lng);
    const cached = sessionStorage.getItem(key);
    if (cached) return cached;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      if (!res.ok) return null;
      const json = await res.json();
      const addr = json.address || {};
      const kec = addr.suburb || addr.village || addr.county || addr.city_district || addr.town || null;
      if (kec) sessionStorage.setItem(key, kec);
      return kec;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const set = new Set<string>();
      for (const u of users) {
        const lp = live[u.id];
        if (!lp) continue;
        const k = await getKecamatan(lp.lat, lp.lng);
        if (k) set.add(k);
      }
      if (mounted) setKecOptions(Array.from(set).slice(0, 30));
    })();
    return () => { mounted = false; };
  }, [users, live]);

  const filteredUsers = useMemo(() => {
    if (!kecFilter) return users;
    return users.filter((u) => {
      const lp = live[u.id];
      if (!lp) return false;
      const key = cacheKey(lp.lat, lp.lng);
      const k = sessionStorage.getItem(key);
      return k === kecFilter;
    });
  }, [users, live, kecFilter]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Peta Live Semua Pengguna</CardTitle>
          <CardDescription>Marker bergerak secara otomatis ketika ada pembaruan lokasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] rounded-lg overflow-hidden">
            <LiveMap />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Pengguna yang pernah aktif berbagi lokasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <label className="text-sm font-medium">Filter Kecamatan (Admin)</label>
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={kecFilter ?? ""} onChange={(e) => setKecFilter(e.target.value || null)}>
              <option value="">Tampilkan semua</option>
              {kecOptions.map((k) => (<option key={k} value={k}>{k}</option>))}
            </select>
          </div>
          <ul className="space-y-3">
            {filteredUsers.length === 0 && <li className="text-sm text-muted-foreground">Belum ada pengguna.</li>}
            {filteredUsers.map((u) => {
              const lp = live[u.id];
              return (
                <li key={u.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: u.color }} />
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{lp ? new Date(lp.timestamp).toLocaleTimeString() : "offline"}</div>
                    </div>
                  </div>
                  {lp && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {lp.lat.toFixed(4)}, {lp.lng.toFixed(4)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ShareSection({ onChanged }: { onChanged: () => void }) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [intervalSec, setIntervalSec] = useState(10);
  const [watching, setWatching] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const lastPointRef = useRef<PositionPoint | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser().catch(() => null);
      setAuthUser(u);
      if (u) {
        setName(u.user_metadata?.full_name || u.email.split("@")[0]);
        setUserId(u.email);
      } else {
        const existing = getUsers()[0];
        if (existing) {
          setName(existing.name);
          setUserId(existing.id);
        }
      }
    })();
  }, []);

  const ensureUser = useCallback(() => {
    const id = userId || slugify(name) || randomId();
    const color = randomColor(id);
    const u: User = { id, name: name || id, color };
    upsertUser(u);
    setUserId(id);
    onChanged();
    return u;
  }, [name, userId, onChanged]);

  // send point if moved more than 5m from lastPoint
  const shouldSend = useCallback((p: PositionPoint) => {
    const last = lastPointRef.current;
    if (!last) return true;
    return distanceMeters(last, p) >= 5;
  }, []);

  const handleStart = useCallback(() => {
    if (!("geolocation" in navigator)) {
      alert("Perangkat tidak mendukung Geolocation");
      return;
    }
    const user = ensureUser();
    const key = dateKey();
    const options: PositionOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 };
    lastSentRef.current = 0;
    const sessionId = randomId();
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p: PositionPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
          sessionId,
        };
        if (!shouldSend(p)) return;
        lastPointRef.current = p;
        const now = Date.now();
        if (now - lastSentRef.current >= intervalSec * 1000) {
          setLivePosition(user.id, p);
          pushHistoryPoint(user.id, key, p);
          lastSentRef.current = now;
          onChanged();
        }
      },
      (err) => {
        console.error(err);
        alert("Gagal membaca lokasi: " + err.message);
      },
      options,
    );
    watchRef.current = id;
    setWatching(true);
  }, [ensureUser, intervalSec, onChanged, shouldSend]);

  const handleStop = useCallback(() => {
    if (!confirm("Apakah anda yakin akan mengakhiri live location?")) return;
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setWatching(false);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Bagikan Lokasi Saat Ini</CardTitle>
          <CardDescription>Aktifkan untuk mengirim lokasi berkala dan menyimpan riwayat harian.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input placeholder="Nama Anda" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">ID Pengguna</label>
              <Input placeholder="otomatis" value={userId} onChange={(e) => setUserId(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Interval Update (detik)</label>
              <Input type="number" min={3} value={intervalSec} onChange={(e) => setIntervalSec(Math.max(3, Number(e.target.value || 0)))} />
            </div>
            <div className="flex items-end gap-3">
              {!watching ? (
                <Button onClick={handleStart} className="gap-2"><Play className="h-4 w-4" /> Mulai Share</Button>
              ) : (
                <Button variant="destructive" onClick={handleStop} className="gap-2"><Square className="h-4 w-4" /> Stop</Button>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Saat aktif, aplikasi akan mengirim lokasi dengan akurasi tinggi dan menyimpannya per hari. Titik hanya dikirim jika berpindah ≥ 5m.
          </div>
        </CardContent>
      </Card>
      <RecentTodayCard />
    </div>
  );
}

function RecentTodayCard() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  const users = useMemo(() => getUsers(), [tick]);
  const today = dateKey();
  const summaries = users.map((u) => {
    const list = getHistory(u.id, today);
    return { u, list, dist: totalDistance(list) };
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan Hari Ini</CardTitle>
        <CardDescription>Jarak tempuh per pengguna (otomatis dari riwayat hari ini).</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {summaries.length === 0 && <li className="text-sm text-muted-foreground">Belum ada data.</li>}
          {summaries.map(({ u, dist, list }) => (
            <li key={u.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: u.color }} />
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{list.length} titik</div>
                </div>
              </div>
              <div className="text-sm font-medium">{(dist / 1000).toFixed(2)} km</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function HistorySection({ tick }: { tick: number }) {
  const users = useMemo(() => getUsers(), [tick]);
  const [userId, setUserId] = useState(users[0]?.id || "");
  const [date, setDate] = useState<Date>(new Date());
  const key = useMemo(() => dateKey(date), [date]);
  const points = useMemo(() => (userId ? getHistory(userId, key) : []), [userId, key, tick]);
  const user = users.find((u) => u.id === userId) || null;

  useEffect(() => {
    if (!userId && users[0]) setUserId(users[0].id);
  }, [users, userId]);

  const onImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importUserHistory(text);
    alert("Import berhasil");
  }, []);

  const jsonBlob = useMemo(() => {
    if (!user) return null;
    const data = new Blob([JSON.stringify({ [key]: points }, null, 2)], { type: "application/json" });
    return URL.createObjectURL(data);
  }, [points, user, key]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Rute {user?.name || "-"} — {format(date, "dd MMM yyyy")}</CardTitle>
          <CardDescription>Visualisasi riwayat lokasi per hari.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] rounded-lg overflow-hidden">
            <HistoryMap points={points} color={user?.color} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filter & Ekspor</CardTitle>
          <CardDescription>Pilih pengguna dan tanggal untuk melihat riwayat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Pengguna</label>
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={userId} onChange={(e) => setUserId(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Tanggal</label>
            <div className="mt-2 rounded-md border p-2">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href={jsonBlob || undefined} download={`loctrack-${user?.name || "user"}-${key}.json`}>
              <Button className="gap-2"><Upload className="h-4 w-4" /> Export JSON</Button>
            </a>
            <label className="text-sm text-muted-foreground">
              <span className="sr-only">Import</span>
              <input type="file" accept="application/json" onChange={onImport} className="block" />
            </label>
          </div>
          <div className="text-sm text-muted-foreground">Titik: {points.length} • Jarak: {(totalDistance(points)/1000).toFixed(2)} km</div>
        </CardContent>
      </Card>
    </div>
  );
}

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function randomId() {
  return Math.random().toString(36).slice(2, 10);
}
