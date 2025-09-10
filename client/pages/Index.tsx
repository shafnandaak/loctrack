import React, {
  useEffect,
  useState,
} from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryMap } from "@/components/map/HistoryMap";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { Input } from "@/components/ui/input";

// --- LANGKAH 1: TENTUKAN EMAIL ADMIN DI SINI ---
const ADMIN_EMAIL = "shafnanda18@gmail.com"; // Ganti dengan email admin yang Anda inginkan

// Definisikan tipe untuk user dari Firestore
interface AppUser {
  id: string;
  name: string;
  color?: string;
  kecamatan?: string;
}

// Fungsi helper untuk mengubah tanggal menjadi format YYYY-MM-DD
function dateKey(date: Date = new Date()) {
  return date.toISOString().split("T")[0];
}

export default function Index() {
  const [tab, setTab] = useState("history");
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // State untuk status admin

  // --- LANGKAH 2: PERIKSA STATUS ADMIN SAAT LOGIN ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      // Cek apakah email user yang login sama dengan email admin
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        setTab("monitor"); // Jika admin, default ke tab monitor
      } else {
        setIsAdmin(false);
        setTab("history"); // Jika bukan admin, default ke tab history
      }
    });
    return unsubscribe;
  }, []);

  // Ambil semua data user dari Firestore
  useEffect(() => {
    const fetchUsers = async () => {
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
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-indigo-50">
      <Header />
      <main className="container py-8">
        <Hero />
        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList>
            {/* --- LANGKAH 3: TAMPILKAN TAB HANYA JIKA ADMIN --- */}
            {isAdmin && (
              <TabsTrigger value="monitor" id="monitor">Monitoring</TabsTrigger>
            )}
            <TabsTrigger value="share" id="share">Share Lokasi</TabsTrigger>
            <TabsTrigger value="history" id="history">History</TabsTrigger>
          </TabsList>
          
          {/* Konten untuk setiap tab */}
          <TabsContent value="monitor" className="mt-6">
            {isAdmin ? <MonitorSection /> : <NotAdminSection />}
          </TabsContent>
          <TabsContent value="share" className="mt-6">
            <ShareSection />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <HistorySection allUsers={allUsers} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-12 border-t">
        <div className="container py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} LocTrack - Sistem monitoring share lokasi dengan riwayat harian.
        </div>
      </footer>
    </div>
  );
}

// Komponen Hero
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

// Komponen untuk tab yang belum jadi atau akses ditolak
function MonitorSection() {
  return <Card><CardHeader><CardTitle>Halaman Monitoring Admin</CardTitle><CardDescription>Fitur live monitoring akan ditampilkan di sini.</CardDescription></CardHeader></Card>;
}

function ShareSection() {
  return <Card><CardHeader><CardTitle>Bagikan Lokasi</CardTitle><CardDescription>Fitur untuk mulai membagikan lokasi Anda akan ada di sini.</CardDescription></CardHeader></Card>;
}

function NotAdminSection() {
    return <Card><CardHeader><CardTitle>Akses Ditolak</CardTitle><CardDescription>Anda tidak memiliki izin untuk melihat halaman ini.</CardDescription></CardHeader></Card>;
}

// Komponen HistorySection yang sudah berfungsi
function HistorySection({ allUsers }: { allUsers: AppUser[] }) {
    const [userId, setUserId] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
  
    useEffect(() => {
      if (!userId && allUsers.length > 0) {
        setUserId(allUsers[0].id);
      }
    }, [allUsers, userId]);
  
    const selectedUser = allUsers.find(u => u.id === userId);
  
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Riwayat Perjalanan</CardTitle>
            <CardDescription>Pilih pengguna dan tanggal untuk melihat riwayat.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
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
            <div>
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
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <CardTitle>Peta Riwayat — {selectedUser?.name || "-"} • {format(date, "dd MMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[60vh] rounded-lg overflow-hidden">
              {userId && date ? (
                <HistoryMap user={userId} date={dateKey(date)} color={selectedUser?.color} />
              ) : (
                <p>Pilih pengguna dan tanggal.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }