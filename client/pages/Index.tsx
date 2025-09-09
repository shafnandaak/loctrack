import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HistoryMap } from "@/components/map/HistoryMap";
import { LiveMap } from "@/components/map/LiveMap";
import { BadgeCheck, MapPin, Play, Square, Upload, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
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
import { useToast } from "@/hooks/use-toast";

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
        const list = (localStorage.getItem("loctrack:admins") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
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
            <TabsTrigger value="monitor" id="monitor">
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="share" id="share">
              Share Lokasi
            </TabsTrigger>
            <TabsTrigger value="history" id="history">
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monitor" className="mt-6">
            <MonitorSection tick={usersTick} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="share" className="mt-6">
            <ShareSection
              onChanged={() => setUsersTick((t) => t + 1)}
              isAdmin={isAdmin}
            />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <HistorySection tick={usersTick} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-12 border-t">
        <div className="container py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} LocTrack �� Sistem monitoring share
          lokasi dengan riwayat harian.
        </div>
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
          Monitoring Share Lokasi Multi-User{" "}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Kelola tim yang membagikan lokasi dan pantau pergerakan mereka secara
          langsung. Setiap pengguna memiliki riwayat per hari untuk kebutuhan
          laporan.
        </p>
      </div>
      <div className="rounded-xl border bg-white/70 p-3 shadow-sm flex items-center justify-center">
        <img
          loading="lazy"
          srcSet="https://cdn.builder.io/api/v1/image/assets%2F950ca9a42f7f4aefbbe6684221304168%2F1f29cd77e83c407eaffd4d076f40ee94?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2F950ca9a42f7f4aefbbe6684221304168%2F1f29cd77e83c407eaffd4d076f40ee94?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2F950ca9a42f7f4aefbbe6684221304168%2F1f29cd77e83c407eaffd4d076f40ee94?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2F950ca9a42f7f4aefbbe6684221304168%2F1f29cd77e83c407eaffd4d076f40ee94?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2F950ca9a42f7f4aefbbe6684221304168%2F1f29cd77e83c407eaffd4d076f40ee94?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2F950ca9a42f7f4aefbbe6684221304168%2F1f29cd77e83c407eaffd4d076f40ee94?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2F950ca9a42f7f4aefbbe6684221304168%2F1f29cd77e83c407eaffd4d076f40ee94?width=2000 2000w"
          style={{
            aspectRatio: "1.96",
            objectFit: "cover",
            objectPosition: "center",
            width: "100%",
            marginTop: "20px",
            minHeight: "20px",
            minWidth: "20px",
            overflow: "hidden",
          }}
          alt="LocTrack"
        />
      </div>
    </div>
  );
}

function MonitorSection({
  tick,
  isAdmin,
}: {
  tick: number;
  isAdmin?: boolean;
}) {
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
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "lastSeen">("name");

  const filteredUsers = useMemo(() => {
    let arr = users.filter((u) =>
      kecFilter ? (u.kecamatan || "") === kecFilter : true,
    );
    if (searchTerm)
      arr = arr.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else
      arr.sort((a, b) => {
        const ta = live[a.id]?.timestamp || 0;
        const tb = live[b.id]?.timestamp || 0;
        return tb - ta;
      });
    return arr;
  }, [users, kecFilter, searchTerm, sortBy, live]);

  function exportUserCsv(userId: string) {
    const day = dateKey();
    const pts = getHistory(userId, day);
    if (!pts.length) {
      alert("Tidak ada data untuk hari ini");
      return;
    }
    const rows = ["timestamp,lat,lng,accuracy,sessionId"].concat(
      pts.map(
        (p) =>
          `${new Date(p.timestamp).toISOString()},${p.lat},${p.lng},${p.accuracy ?? ""},${p.sessionId ?? ""}`,
      ),
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `history-${userId}-${day}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Peta Sebaran Pengguna
          </CardTitle>
          <CardDescription>
            Geser dan zoom untuk melihat sebaran pengguna secara realtime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[640px] rounded-lg overflow-hidden">
            <LiveMap isAdmin={isAdmin} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Pengguna yang pernah aktif berbagi lokasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid grid-cols-1 gap-2">
            <div>
              <label className="text-sm font-medium">
                Filter Kecamatan (Admin)
              </label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                value={kecFilter ?? ""}
                onChange={(e) => setKecFilter(e.target.value || null)}
              >
                <option value="">Tampilkan semua</option>
                {kecamatanOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 rounded-md border px-2 py-1"
                placeholder="Cari nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="rounded-md border px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Urut: Nama</option>
                <option value="lastSeen">Urut: Terbaru</option>
              </select>
            </div>
          </div>
          <ul className="space-y-3">
            {filteredUsers.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Belum ada pengguna.
              </li>
            )}
            {filteredUsers.map((u) => {
              const lp = live[u.id];
              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: u.color }}
                    />
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lp
                          ? new Date(lp.timestamp).toLocaleTimeString()
                          : "offline"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lp && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {lp.lat.toFixed(4)},{" "}
                        {lp.lng.toFixed(4)}
                      </span>
                    )}
                    <button
                      onClick={() => exportUserCsv(u.id)}
                      className="rounded-md border px-2 py-1 text-xs"
                    >
                      Export CSV
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ShareSection({
  onChanged,
  isAdmin,
}: {
  onChanged: () => void;
  isAdmin?: boolean;
}) {
  const [name, setName] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [watching, setWatching] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastPointRef = useRef<PositionPoint | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);

  useEffect(() => {
    // prefer local session, fallback to supabase
    const local = (() => {
      try {
        return JSON.parse(sessionStorage.getItem("loctrack:session") || "null");
      } catch {
        return null;
      }
    })();
    if (local) {
      setAuthUser(local);
      setName(local.name || local.email?.split("@")[0] || "");
      setKecamatan(local.kecamatan || "");
      return;
    }
    (async () => {
      const u = await getCurrentUser().catch(() => null);
      setAuthUser(u);
      if (u) {
        // try to load persisted profile from server
        try {
          const res = await fetch("/api/points?action=users");
          if (res.ok) {
            const users = await res.json();
            const found = users.find(
              (x: any) => x.id === u.id || x.email === u.email,
            );
            if (found) {
              setName(
                found.name ||
                  u.user_metadata?.full_name ||
                  u.email.split("@")[0],
              );
              setKecamatan(found.kecamatan || "");
              try {
                upsertUser({
                  id: found.id,
                  name: found.name,
                  color: found.color || "#06b6d4",
                  kecamatan: found.kecamatan,
                });
              } catch {}
              return;
            }
          }
        } catch {}
        setName(u.user_metadata?.full_name || u.email.split("@")[0]);
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
    const id =
      (authUser && (authUser.id || authUser.sub || authUser.email)) ||
      slugify(name) ||
      randomId();
    const color = randomColor(id);
    const u: User = {
      id,
      name: name || id,
      color,
      kecamatan: kecamatan || undefined,
    };
    upsertUser(u);
    // persist to server if possible
    (async () => {
      try {
        await fetch("/api/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "user", user: u }),
        });
      } catch {}
    })();
    onChanged();
    return u;
  }, [name, kecamatan, onChanged, authUser]);

  // send point if moved more than 50m from lastPoint
  const shouldSend = useCallback((p: PositionPoint) => {
    const last = lastPointRef.current;
    if (!last) return true;
    return distanceMeters(last, p) >= 50;
  }, []);

  const { toast } = useToast();

  function geoErrMsg(err: any) {
    try {
      if (!err) return "Kesalahan lokasi tidak diketahui";
      const code = err.code;
      if (code === 1)
        return "Izin lokasi ditolak. Aktifkan izin lokasi pada browser dan coba lagi.";
      if (code === 2)
        return "Lokasi tidak tersedia. Periksa koneksi GPS atau coba lagi nanti.";
      if (code === 3) return "Permintaan lokasi timeout. Coba lagi.";
      return err.message || String(err);
    } catch (e) {
      return "Kesalahan lokasi";
    }
  }

  const startWatch = useCallback(
    (user: User, skipConfirm = false) => {
      if (isAdmin) {
        alert("Akun admin tidak dapat membagikan lokasi.");
        return;
      }
      if (!("geolocation" in navigator)) {
        alert("Perangkat tidak mendukung Geolocation");
        return;
      }
      if (
        !skipConfirm &&
        !confirm("Apakah anda yakin akan memulai live location?")
      )
        return;

      // persist kecamatan on user record
      upsertUser({
        id: user.id,
        name: user.name,
        color: user.color,
        kecamatan: kecamatan || undefined,
      });
      const today = dateKey();
      const sharedKey = `loctrack:shared:${user.id}:${today}`;
      try {
        localStorage.setItem(
          sharedKey,
          JSON.stringify({ startedAt: Date.now() }),
        );
      } catch {}

      const key = dateKey();
      const options: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      };
      const sessionId = randomId();

      // seed current position once to avoid wrong default locations
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const p: PositionPoint = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: Date.now(),
              sessionId,
            };
            lastPointRef.current = p;
            setLivePosition(user.id, p);
            pushHistoryPoint(user.id, key, p);
            onChanged();
          },
          (err) => {
            const msg = geoErrMsg(err);
            try {
              toast({ title: "Lokasi gagal", description: msg });
            } catch {}
            console.error("getCurrentPosition error", err);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
        );
      } catch (e) {
        try {
          toast({
            title: "Lokasi gagal",
            description: "Tidak dapat mengakses fitur lokasi pada perangkat.",
          });
        } catch {}
      }

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
          console.error("watchPosition error", err);
          const msg = geoErrMsg(err);
          try {
            toast({ title: "Lokasi error", description: msg });
          } catch {}
          // If permission denied, stop watching
          if (err && err.code === 1) {
            try {
              if (watchRef.current != null)
                navigator.geolocation.clearWatch(watchRef.current);
            } catch {}
            watchRef.current = null;
            setWatching(false);
          }
        },
        options,
      );
      watchRef.current = id;
      setWatching(true);
    },
    [isAdmin, kecamatan, onChanged, shouldSend],
  );

  const handleStart = useCallback(() => {
    const user = ensureUser();
    startWatch(user, false);
  }, [ensureUser, startWatch]);

  const handleStop = useCallback(() => {
    if (!confirm("Apakah anda yakin akan mengakhiri live location?")) return;
    if (watchRef.current != null)
      navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setWatching(false);
    // mark end of share session
    const today = dateKey();
    const id =
      (authUser && (authUser.id || authUser.sub || authUser.email)) ||
      slugify(name) ||
      randomId();
    const sharedKey = `loctrack:shared:${id}:${today}`;
    try {
      localStorage.removeItem(sharedKey);
    } catch {}
  }, [name, authUser]);

  // auto-resume if there is an active sharedKey for today and we're online
  useEffect(() => {
    const tryResume = () => {
      try {
        const id =
          (authUser && (authUser.id || authUser.sub || authUser.email)) ||
          slugify(name) ||
          randomId();
        const today = dateKey();
        const sharedKey = `loctrack:shared:${id}:${today}`;
        if (
          localStorage.getItem(sharedKey) &&
          !watchRef.current &&
          navigator.onLine
        ) {
          // resume without confirm
          const u: User = {
            id,
            name: name || id,
            color: randomColor(id),
            kecamatan: kecamatan || undefined,
          };
          startWatch(u, true);
        }
      } catch {}
    };
    tryResume();
    window.addEventListener("online", tryResume);
    return () => window.removeEventListener("online", tryResume);
  }, [authUser, name, kecamatan, startWatch]);

  const users = useMemo(
    () => getUsers(),
    [
      /* tick handled above */
    ],
  );
  const storedUser = users.find(
    (u) =>
      u.id ===
      ((authUser && (authUser.id || authUser.sub || authUser.email)) ||
        slugify(name) ||
        randomId()),
  );
  const profileLocked = !!(storedUser && storedUser.name);

  const deleteHistoryAccount = useCallback(async () => {
    const id =
      (authUser && (authUser.id || authUser.sub || authUser.email)) ||
      slugify(name) ||
      randomId();
    if (
      !confirm(
        "Hapus seluruh history akun ini pada server & local? Tindakan ini tidak dapat dibatalkan.",
      )
    )
      return;
    try {
      await fetch(
        `/api/points?action=history-delete&userId=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
    } catch {}
    // clear local storage history keys
    try {
      const prefix = "loctrack:history:" + id + ":";
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(prefix)) localStorage.removeItem(k);
      });
    } catch {}
    alert("History dihapus.");
    onChanged();
  }, [authUser, name, onChanged]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Bagikan Lokasi Saat Ini
          </CardTitle>
          <CardDescription>
            Aktifkan untuk mengirim lokasi saat berpindah ≥5m dan menyimpan
            riwayat harian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="Email"
                value={
                  (authUser &&
                    (authUser.email || authUser.user_metadata?.email)) ||
                  ""
                }
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nama (sekali atur)</label>
              <Input
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={profileLocked}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kecamatan</label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
              >
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
                ].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <Button
                onClick={() => {
                  // save profile but prevent changing name if locked
                  const user = ensureUser();
                  if (profileLocked) {
                    // only update kecamatan
                    upsertUser({
                      id: user.id,
                      name: user.name,
                      color: user.color,
                      kecamatan: kecamatan || undefined,
                    });
                  } else {
                    ensureUser();
                  }
                  alert("Profil tersimpan");
                }}
                className="gap-2"
              >
                Simpan Profil
              </Button>
              <Button
                onClick={deleteHistoryAccount}
                variant="destructive"
                className="gap-2"
              >
                Hapus History
              </Button>
              {!watching ? (
                <Button onClick={handleStart} className="gap-2">
                  <Play className="h-4 w-4" /> Mulai Share
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleStop}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" /> Stop
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Saat aktif, aplikasi akan mengirim lokasi otomatis saat berpindah
            ≥5m dan menyimpannya per hari. Nama hanya dapat diatur sekali dan
            akan melekat ke akun Google Anda.
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
        <CardDescription>
          Jarak tempuh per pengguna (otomatis dari riwayat hari ini).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {summaries.length === 0 && (
            <li className="text-sm text-muted-foreground">Belum ada data.</li>
          )}
          {summaries.map(({ u, dist, list }) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: u.color }}
                />
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {list.length} titik
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium">
                {(dist / 1000).toFixed(2)} km
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function HistorySection({
  tick,
  isAdmin,
}: {
  tick: number;
  isAdmin?: boolean;
}) {
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
        const res = await fetch(
          `/api/points?action=history&userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(key)}`,
        );
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
    return () => {
      mounted = false;
    };
  }, [userId, key, tick]);

  const jsonBlob = useMemo(() => {
    if (!user) return null;
    const data = new Blob([JSON.stringify({ [key]: points }, null, 2)], {
      type: "application/json",
    });
    return URL.createObjectURL(data);
  }, [points, user, key]);

  const pointDurations = useMemo(() => {
    const res: { point: PositionPoint; durationSec: number }[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const next = points[i + 1];
      const dur = next
        ? Math.max(0, Math.floor((next.timestamp - p.timestamp) / 1000))
        : 0;
      res.push({ point: p, durationSec: dur });
    }
    return res;
  }, [points]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter & Ekspor</CardTitle>
          <CardDescription>
            Pilih pengguna dan tanggal untuk melihat riwayat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm font-medium">Pengguna</label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Tanggal</label>
              <div className="mt-2 rounded-md border p-2">
                <div className="flex gap-2 items-center">
                  <select
                    className="rounded-md border px-2 py-1"
                    value={date.getDate()}
                    onChange={(e) => {
                      const day = Number(e.target.value);
                      const nd = new Date(date);
                      nd.setDate(day);
                      setDate(nd);
                    }}
                  >
                    {Array.from({ length: 31 }).map((_, i) => {
                      const d = i + 1;
                      return (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    className="rounded-md border px-2 py-1"
                    value={date.getMonth()}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      const nd = new Date(date);
                      nd.setMonth(m);
                      setDate(nd);
                    }}
                  >
                    {[
                      "Januari",
                      "Februari",
                      "Maret",
                      "April",
                      "Mei",
                      "Juni",
                      "Juli",
                      "Agustus",
                      "September",
                      "Oktober",
                      "November",
                      "Desember",
                    ].map((mn, idx) => (
                      <option key={mn} value={idx}>
                        {mn}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-md border px-2 py-1"
                    value={date.getFullYear()}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      const nd = new Date(date);
                      nd.setFullYear(y);
                      setDate(nd);
                    }}
                  >
                    {(() => {
                      const cur = new Date().getFullYear();
                      const years = [] as number[];
                      for (let y = cur - 2; y <= cur + 1; y++) years.push(y);
                      return years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ));
                    })()}
                  </select>
                  <button
                    onClick={() => setShowCalendar((s) => !s)}
                    className="ml-2 rounded-md border px-2 py-1 text-sm"
                  >
                    Pilih dari kalender
                  </button>
                </div>
                {showCalendar && (
                  <div className="mt-3">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) setDate(d);
                        setShowCalendar(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="flex gap-2">
                <a
                  href={jsonBlob || undefined}
                  download={`loctrack-${user?.name || "user"}-${key}.json`}
                >
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" /> Export JSON
                  </Button>
                </a>
                <button
                  onClick={() => {
                    if (user) exportUserCsv(user.id);
                  }}
                  className="rounded-md border px-3 py-1"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Tabel Riwayat — {user?.name || "-"} • {format(date, "dd MMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-2">Koordinat</th>
                  <th className="px-2 py-2">Timestamp</th>
                  <th className="px-2 py-2">Durasi (s)</th>
                </tr>
              </thead>
              <tbody>
                {pointDurations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-muted-foreground">
                      Tidak ada titik
                    </td>
                  </tr>
                )}
                {pointDurations.map((pd, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-2">
                      <button
                        className="text-blue-600 underline"
                        onClick={() => setSelectedIndex(idx)}
                      >
                        {pd.point.lat.toFixed(6)}, {pd.point.lng.toFixed(6)}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      {new Date(pd.point.timestamp).toLocaleString()}
                    </td>
                    <td className="px-2 py-2">{pd.durationSec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Map — Rute</CardTitle>
          <CardDescription>
            Klik koordinat di tabel untuk menyorot titik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[480px] rounded-lg overflow-hidden">
            <HistoryMap
              points={points}
              color={user?.color}
              selectedIndex={selectedIndex}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function randomId() {
  return Math.random().toString(36).slice(2, 10);
}
