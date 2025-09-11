import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo
} from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Impor interface dan fungsi dari HistoryMap
import { HistoryMap, LocationPoint, formatDuration } from "@/components/map/HistoryMap"; 
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore"; 
import { Input } from "@/components/ui/input";
import { Play, Square, Users, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Konfigurasi Leaflet Icon
const DefaultIcon = L.icon({
    iconUrl: "/marker-icon.png",
    iconRetinaUrl: "/marker-icon-2x.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ... (sisa kode Index, LiveMap, Hero, dll. tetap sama) ...
const ADMIN_EMAIL = "shafnanda18@gmail.com"; 

interface AppUser {
  id: string;
  name: string;
  color?: string;
  kecamatan?: string;
}

interface LiveLocationPoint {
    lat: number;
    lng: number;
    timestamp: number;
    user: AppUser;
}

function dateKey(date: Date = new Date()) {
  return date.toISOString().split("T")[0];
}

export default function Index() {
  const [tab, setTab] = useState("history");
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        setTab("monitor");
      } else {
        setIsAdmin(false);
        setTab(currentTab => currentTab === 'monitor' ? 'history' : currentTab);
      }
    });
    return unsubscribe;
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'No Name',
        color: doc.data().color || '#000000',
        kecamatan: doc.data().kecamatan || '',
      }));
      setAllUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-indigo-50">
      <Header />
      <main className="container py-8">
        <Hero />
        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList>
            {isAdmin && (
              <TabsTrigger value="monitor" id="monitor">Monitoring</TabsTrigger>
            )}
            <TabsTrigger value="share" id="share">Share Lokasi</TabsTrigger>
            <TabsTrigger value="history" id="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monitor" className="mt-6">
            {isAdmin ? <MonitorSection allUsers={allUsers} /> : <NotAdminSection />}
          </TabsContent>
          <TabsContent value="share" className="mt-6">
            <ShareSection authUser={authUser} onProfileSave={refreshUsers} />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <HistorySection allUsers={allUsers} isAdmin={isAdmin} authUser={authUser} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-12 border-t">
        <div className="container py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} LocTrack - Dibuat dengan Firebase.
        </div>
      </footer>
    </div>
  );
}
function LiveMap({ livePoints }: { livePoints: LiveLocationPoint[] }) {
    const center: [number, number] = livePoints.length > 0 ? [livePoints[0].lat, livePoints[0].lng] : [-7.32, 108.21];
  
    return (
      <MapContainer {...{center: center, zoom: 13, style: { height: "100%", width: "100%" }}}>
        <TileLayer
          {...{
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }}
        />
        {livePoints.map(point => (
            <Marker key={point.user.id} position={[point.lat, point.lng]}>
              <Popup>
                <b>{point.user.name}</b><br/>
                Terakhir terlihat: {new Date(point.timestamp).toLocaleTimeString()}
              </Popup>
            </Marker>
        ))}
      </MapContainer>
    );
  }

function Hero() {
    return (
      <div className="text-center">
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Monitoring Share Lokasi Multi-User
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Kelola tim yang membagikan lokasi dan pantau pergerakan mereka. Setiap pengguna memiliki riwayat per hari untuk kebutuhan laporan.
        </p>
      </div>
    );
  }
  
function NotAdminSection() {
      return <Card><CardHeader><CardTitle>Akses Ditolak</CardTitle><CardDescription>Anda tidak memiliki izin untuk melihat halaman ini.</CardDescription></CardHeader></Card>;
}

function ShareSection({ authUser, onProfileSave }: { authUser: FirebaseUser | null, onProfileSave: () => void }) {
    const [name, setName] = useState("");
    const [kecamatan, setKecamatan] = useState("");
    const [isWatching, setIsWatching] = useState(false);
    const [isNameEditable, setIsNameEditable] = useState(false)
    const watchIdRef = useRef<number | null>(null);
  
    useEffect(() => {
      if (!authUser) {
          setName("");
          setKecamatan("");
          return;
      };
  
      const fetchUserProfile = async () => {
        const userDocRef = doc(db, "users", authUser.uid);
        const docSnap = await getDoc(userDocRef);
  
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setName(userData.name || authUser.displayName || "");
          setKecamatan(userData.kecamatan || "");
          setIsNameEditable(false);
        } else {
          setName(authUser.displayName || "");
          setKecamatan("");
          setIsNameEditable(true);
        }
      };
  
      fetchUserProfile();
    }, [authUser]);
  
    const handleSaveProfile = async () => {
      if (!authUser) {
        alert("Anda harus login untuk menyimpan profil.");
        return;
      }
      if (!name) {
        alert("Nama tidak boleh kosong.");
        return;
      }
  
      try {
        const userDocRef = doc(db, "users", authUser.uid);
        const docSnap = await getDoc(userDocRef);
        const existingColor = docSnap.exists() ? docSnap.data().color : null;
        
        await setDoc(userDocRef, {
          name: name,
          kecamatan: kecamatan,
          email: authUser.email, 
          color: existingColor || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
        }, { merge: true });
  
        alert("Profil berhasil disimpan!");
        onProfileSave();
        setIsNameEditable(false);
      } catch (error) {
        console.error("Error saving profile: ", error);
        alert("Gagal menyimpan profil.");
      }
    };
    
    const handleStartWatching = () => {
      if (!authUser) {
          alert("Anda harus login untuk memulai share lokasi.");
          return;
      }
      if (!("geolocation" in navigator)) {
          alert("Browser Anda tidak mendukung Geolocation.");
          return;
      }
  
      handleSaveProfile();
  
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            await addDoc(collection(db, "location_history"), {
              userId: authUser.uid,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              recorded_at: serverTimestamp(),
            });
          } catch (error) {
            console.error("Gagal mengirim lokasi ke Firestore:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert(`Error lokasi: ${error.message}`);
          setIsWatching(false);
        },
        { enableHighAccuracy: true }
      );
      setIsWatching(true);
      alert("Berbagi lokasi dimulai!");
    };
  
    const handleStopWatching = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatching(false);
      alert("Berbagi lokasi dihentikan.");
    };
  
    if (!authUser) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Silakan Login</CardTitle>
                  <CardDescription>Anda perlu login untuk dapat membagikan lokasi dan mengatur profil.</CardDescription>
              </CardHeader>
          </Card>
      )
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profil & Share Lokasi</CardTitle>
          <CardDescription>
            Perbarui profil Anda dan mulai bagikan lokasi secara real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
              <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={authUser.email || ""} disabled />
              </div>
              <div>
                  <label className="text-sm font-medium">Nama</label>
                  <Input placeholder="Nama Anda" value={name} onChange={e => setName(e.target.value)} disabled={!isNameEditable} />
              </div>
              <div>
                  <label className="text-sm font-medium">Kecamatan</label>
                  <select 
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                      value={kecamatan}
                      onChange={e => setKecamatan(e.target.value)}
                  >
                      <option value="">Pilih Kecamatan</option>
                      {["Bungursari", "Cibeureum", "Purbaratu", "Indihiang", "Kawalu", "Mangkubumi", "Tamansari", "Cihideung", "Tawang", "Cipedes"].map(k => (
                          <option key={k} value={k}>{k}</option>
                      ))}
                  </select>
              </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={handleSaveProfile}>Simpan Profil</Button>
              {!isWatching ? (
                  <Button onClick={handleStartWatching} className="gap-2">
                      <Play className="h-4 w-4" /> Mulai Share
                  </Button>
              ) : (
                  <Button onClick={handleStopWatching} variant="destructive" className="gap-2">
                      <Square className="h-4 w-4" /> Stop Share
                  </Button>
              )}
          </div>
        </CardContent>
      </Card>
    );
  }

function MonitorSection({ allUsers }: { allUsers: AppUser[] }) {
    const [livePoints, setLivePoints] = useState<LiveLocationPoint[]>([]);
    const [kecamatanFilter, setKecamatanFilter] = useState<string>("");

    const kecamatanOptions = useMemo(() => {
        const kecamatans = new Set(allUsers.map(u => u.kecamatan).filter(Boolean));
        return Array.from(kecamatans);
    }, [allUsers]);

    const filteredUsers = useMemo(() => {
        if (!kecamatanFilter) return allUsers;
        return allUsers.filter(u => u.kecamatan === kecamatanFilter);
    }, [allUsers, kecamatanFilter]);

    useEffect(() => {
      if (filteredUsers.length === 0) {
        setLivePoints([]);
        return;
      }
  
      const unsubscribes = filteredUsers.map(user => {
        const q = query(
          collection(db, "location_history"),
          where("userId", "==", user.id),
          orderBy("recorded_at", "desc"),
          limit(1)
        );
  
        return onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            setLivePoints(prev => prev.filter(p => p.user.id !== user.id));
            return;
          }
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.latitude && data.longitude && data.recorded_at) {
                const newPoint = {
                  lat: data.latitude,
                  lng: data.longitude,
                  timestamp: data.recorded_at.toMillis(),
                  user: user,
                };
    
                setLivePoints(prevPoints => {
                  const otherPoints = prevPoints.filter(p => p.user.id !== user.id);
                  return [...otherPoints, newPoint];
                });
            }
          });
        });
      });
  
      return () => unsubscribes.forEach(unsub => unsub());
    }, [filteredUsers]);
  
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Peta Sebaran Pengguna
                </CardTitle>
                <CardDescription>
                  Lokasi terakhir dari setiap pengguna yang aktif.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[640px] rounded-lg overflow-hidden">
                  <LiveMap livePoints={livePoints} />
                </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna Aktif</CardTitle>
                    <div className="pt-2">
                        <label className="text-sm font-medium">Filter Kecamatan</label>
                        <select
                            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                            value={kecamatanFilter}
                            onChange={(e) => setKecamatanFilter(e.target.value)}
                        >
                            <option value="">Semua Kecamatan</option>
                            {kecamatanOptions.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {livePoints.length === 0 && <li className="text-sm text-muted-foreground">Menunggu data lokasi masuk...</li>}
                        {livePoints.sort((a,b) => b.timestamp - a.timestamp).map(({ user, lat, lng, timestamp }) => (
                           <li key={user.id} className="flex items-center justify-between rounded-md border p-3">
                             <div className="flex items-center gap-3">
                               <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: user.color }} />
                               <div>
                                 <div className="font-medium">{user.name}</div>
                                 <div className="text-xs text-muted-foreground">
                                   {new Date(timestamp).toLocaleTimeString()}
                                 </div>
                               </div>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                 <MapPin className="h-3.5 w-3.5" /> {lat.toFixed(4)}, {lng.toFixed(4)}
                               </span>
                             </div>
                           </li>
                         ))}
                    </ul>
                </CardContent>
            </Card>
      </div>
    );
  }


// --- Komponen HistorySection yang diperbarui dengan TAbel ---
function HistorySection({ allUsers, isAdmin, authUser }: { allUsers: AppUser[], isAdmin: boolean, authUser: FirebaseUser | null }) {
    const [userId, setUserId] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [points, setPoints] = useState<LocationPoint[]>([]); // State untuk menyimpan titik lokasi
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // State untuk titik terpilih
  
    // Logika untuk menentukan user ID yang akan digunakan
    useEffect(() => {
      if (isAdmin) {
        if (!userId && allUsers.length > 0) setUserId(allUsers[0].id);
      } else if (authUser) {
        setUserId(authUser.uid);
      }
    }, [allUsers, userId, isAdmin, authUser]);

    // Logika untuk mengambil dan memproses data history dari Firestore
    useEffect(() => {
        if (!userId || !date) {
            setPoints([]);
            return;
        };

        const fetchAndProcessHistory = async () => {
            const key = dateKey(date);
            const startDate = new Date(`${key}T00:00:00`);
            const endDate = new Date(`${key}T23:59:59`);

            const q = query(
                collection(db, 'location_history'),
                where('userId', '==', userId),
                where('recorded_at', '>=', startDate),
                where('recorded_at', '<=', endDate),
                orderBy('recorded_at', 'asc')
              );
            
            try {
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
                    fetchedPoints[i].duration = fetchedPoints[i].timestamp - fetchedPoints[i-1].timestamp;
                  }
          
                  setPoints(fetchedPoints);
                  setSelectedIndex(null); // Reset pilihan saat data baru dimuat
            } catch (error) {
                console.error("Error fetching history:", error);
                setPoints([]);
            }
        };
        fetchAndProcessHistory();
    }, [userId, date]);
  
    const selectedUser = allUsers.find(u => u.id === userId);
  
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Riwayat Perjalanan</CardTitle>
            <CardDescription>
                {isAdmin ? "Pilih pengguna dan tanggal untuk melihat riwayat." : "Pilih tanggal untuk melihat riwayat Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {isAdmin && (
                <div>
                    <label className="text-sm font-medium">Pengguna</label>
                    <select
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    >
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                </div>
            )}
            <div className="relative">
              <label className="text-sm font-medium">Tanggal</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="text"
                  value={format(date, "dd MMMM yyyy")}
                  readOnly
                  className="w-[200px]"
                />
                <Button onClick={() => setShowCalendar(!showCalendar)} variant="outline">
                  Pilih Tanggal
                </Button>
              </div>
              {showCalendar && (
                <div className="mt-2 p-2 border rounded-md w-min bg-background absolute z-10">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) setDate(d);
                      setShowCalendar(false);
                    }}
                    weekStartsOn={1}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
  
        {/* Card untuk Tabel dan Peta */}
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Tabel Riwayat</CardTitle>
                    <CardDescription>Klik koordinat untuk fokus pada peta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <HistoryTable points={points} onRowClick={setSelectedIndex} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Peta Riwayat — {selectedUser?.name || "Anda"}</CardTitle>
                    <CardDescription>{format(date, "dd MMM yyyy")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[60vh] rounded-lg overflow-hidden">
                        <HistoryMap 
                            points={points} 
                            color={selectedUser?.color}
                            selectedIndex={selectedIndex}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

// --- Komponen BARU untuk Tabel Riwayat ---
function HistoryTable({ points, onRowClick }: { points: LocationPoint[], onRowClick: (index: number) => void }) {
    return (
        <div className="h-[60vh] overflow-auto border rounded-md">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left bg-muted">
                        <th className="px-4 py-2">Koordinat</th>
                        <th className="px-4 py-2">Waktu</th>
                        <th className="px-4 py-2">Durasi</th>
                    </tr>
                </thead>
                <tbody>
                    {points.length === 0 && (
                        <tr>
                            <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                Tidak ada data.
                            </td>
                        </tr>
                    )}
                    {points.map((p, i) => (
                        <tr key={p.timestamp} className="border-t">
                            <td className="px-4 py-2">
                                <button
                                    className="text-blue-600 underline text-left"
                                    onClick={() => onRowClick(i)}
                                >
                                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                                </button>
                            </td>
                            <td className="px-4 py-2">{new Date(p.timestamp).toLocaleTimeString()}</td>
                            <td className="px-4 py-2">{i > 0 ? formatDuration(p.duration) : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}