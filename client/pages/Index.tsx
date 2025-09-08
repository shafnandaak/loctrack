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
  analyzeStops,
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

function MonitorSection({ tick, isAdmin }: { tick: number; isAdmin?: boolean }) {
  const users = useMemo(() => getUsers(), [tick]);
  const live = useMemo(() => getAllLivePositions(), [tick]);
  const [kecFilter, setKecFilter] = useState<string | null>(null);
  const kecamatanOptions = [
    "Bungursari",
    "Cibeureum",
    "Purbaratu",
    "Indihiang",
    "Kawalu",
    "Mangkubumi",
    "Tamansari",
    "Cihideung",
    "Tawang",
    "Cipedes",
    "Indihiang",
  ];

  const filteredUsers = useMemo(() => {
    if (!kecFilter) return users;
    return users.filter((u) => (u.kecamatan || "") === kecFilter);
  }, [users, kecFilter]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Peta Live Semua Pengguna</CardTitle>
          <CardDescription>Marker bergerak secara otomatis ketika ada pembaruan lokasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] rounded-lg overflow-hidden">
            <LiveMap isAdmin={isAdmin} />
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

function ShareSection({ onChanged, isAdmin }: { onChanged: () => void; isAdmin?: boolean }) {
  const [name, setName] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [watching, setWatching] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastPointRef = useRef<PositionPoint | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser().catch(() => null);
      setAuthUser(u);
      if (u) {
        setName(u.user_metadata?.full_name || u.email.split("@")[0]);
        // try to infer kecamatan from metadata if present
        setKecamatan(u.user_metadata?.kecamatan || "");
      } else {
        const existing = getUsers()[0];
        if (existing) {
          setName(existing.name);
          setKecamatan((existing as any).kecamatan || "");
        }
      }
    })();
  }, []);

  const ensureUser = useCallback(() => {
    const id = slugify(name) || randomId();
    const color = randomColor(id);
    const u: User = { id, name: name || id, color, kecamatan: kecamatan || undefined };
    upsertUser(u);
    onChanged();
    return u;
  }, [name, kecamatan, onChanged]);

  // send point if moved more than 5m from lastPoint
  const shouldSend = useCallback((p: PositionPoint) => {
    const last = lastPointRef.current;
    if (!last) return true;
    return distanceMeters(last, p) >= 5;
  }, []);

  const handleStart = useCallback(() => {
    if (isAdmin) {
      alert("Akun admin tidak dapat membagikan lokasi.");
      return;
    }
    if (!("geolocation" in navigator)) {
      alert("Perangkat tidak mendukung Geolocation");
      return;
    }
    if (!confirm("Apakah anda yakin akan memulai live location?")) return;
    const user = ensureUser();
    // persist kecamatan on user record
    upsertUser({ id: user.id, name: user.name, color: user.color, kecamatan: kecamatan || undefined });
    const key = dateKey();
    const options: PositionOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 };
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
        setLivePosition(user.id, p);
        pushHistoryPoint(user.id, key, p);
        onChanged();
      },
      (err) => {
        console.error(err);
        alert("Gagal membaca lokasi: " + err.message);
      },
      options,
    );
    watchRef.current = id;
    setWatching(true);
  }, [ensureUser, onChanged, shouldSend, isAdmin]);

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
          <CardDescription>Aktifkan untuk mengirim lokasi saat berpindah ≥5m dan menyimpan riwayat harian.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input placeholder="Nama Anda" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Kecamatan</label>
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)}>
                <option value="">Pilih Kecamatan</option>
                {[
                  "Bungursari",
                  "Cibeureum",
                  "Purbaratu",
                  "Indihiang",
                  "Kawalu",
                  "Mangkubumi",
                  "Tamansari",
                  "Cihideung",
                  "Tawang",
                  "Cipedes",
                  "Indihiang",
                ].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
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
            Saat aktif, aplikasi akan mengirim lokasi otomatis saat berpindah ≥5m dan menyimpannya per hari.
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

function HistorySection({ tick, isAdmin }: { tick: number; isAdmin?: boolean }) {
  const users = useMemo(() => getUsers(), [tick]);
  const [userId, setUserId] = useState(users[0]?.id || "");
  const [date, setDate] = useState<Date>(new Date());
  const key = useMemo(() => dateKey(date), [date]);
  const [points, setPoints] = useState<PositionPoint[]>([]);
  const user = users.find((u) => u.id === userId) || null;

  useEffect(() => {
    if (!userId && users[0]) setUserId(users[0].id);
  }, [users, userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) return setPoints([]);
      try {
        const res = await fetch(`/api/points?action=history&userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(key)}`);
        if (res.ok) {
          const json = await res.json();
          if (mounted) setPoints(Array.isArray(json) ? json : []);
          return;
        }
      } catch (e) {
        // ignore
      }
      // fallback to local
      setPoints(getHistory(userId, key));
    })();
    return () => { mounted = false; };
  }, [userId, key, tick]);

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
          <div className="mt-3">
            <h4 className="text-sm font-medium">Ringkasan perjalanan</h4>
            <div className="text-sm text-muted-foreground mt-2">
              Durasi: {points.length ? Math.max(0, Math.floor((points[points.length-1].timestamp - points[0].timestamp)/1000)) : 0} detik
            </div>
            <div className="text-sm text-muted-foreground">Berhenti (stop) terdeteksi: {analyzeStops(points).length}</div>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {analyzeStops(points).map((s, i) => (
                <li key={i}>Stop {i+1}: {(s.duration/1000).toFixed(0)}s • Titik: {s.count} • Lokasi: {s.lat.toFixed(4)}, {s.lng.toFixed(4)}</li>
              ))}
            </ul>
          </div>
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
