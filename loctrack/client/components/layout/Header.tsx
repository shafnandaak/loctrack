import { Link } from "react-router-dom";
import { MapPinned, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
// --- HAPUS SEMUA IMPORT SUPABASE ---
// import { getCurrentUser, onAuthChange, signInWithGoogle, signOut } from "@/lib/supabase";

// +++ TAMBAHKAN IMPORT FIREBASE +++
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";


export function Header() {
  // State untuk menyimpan data user dari Firebase
  const [user, setUser] = useState<User | null>(null);
  const [time, setTime] = useState(new Date());

  // useEffect untuk memantau status login pengguna
  useEffect(() => {
    // onAuthStateChanged adalah listener dari Firebase
    // yang akan berjalan setiap kali ada perubahan status login/logout
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Jika ada user, simpan di state. Jika tidak, state akan jadi null.
    });

    // Membersihkan listener saat komponen tidak lagi digunakan
    return () => unsubscribe();
  }, []);

  // useEffect untuk jam digital
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Cek apakah user adalah admin (logika ini tetap sama)
  const isAdmin = (() => {
    try {
      const list = (localStorage.getItem("loctrack:admins") || "").split(",").map((s) => s.trim()).filter(Boolean);
      const email = user?.email;
      return !!email && list.includes(email);
    } catch {
      return false;
    }
  })();

  // Fungsi untuk handle login dengan Google via Firebase
  const handleLoginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Google Sign-In Error:", e);
      alert("Gagal login dengan Google. Silakan coba lagi.");
    }
  };

  // Fungsi untuk handle logout dari Firebase
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign-Out Error:", e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <MapPinned className="h-5 w-5 text-primary" />
          <span>LocTrack</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <a className="hover:text-foreground" href="#monitor">Monitoring</a>
          <a className="hover:text-foreground" href="#share">Share Lokasi</a>
          <a className="hover:text-foreground" href="#history">History</a>
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">{time.toLocaleTimeString()}</div>
          {isAdmin && <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Admin</span>}
          
          {/* Tampilkan tombol logout jika ada user, atau tombol login jika tidak ada */}
          {user ? (
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
              <LogOut className="h-4 w-4" /> 
              {/* Tampilkan nama atau email user dari Firebase */}
              {user.displayName || user.email}
            </button>
          ) : (
            <button onClick={handleLoginGoogle} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
              <LogIn className="h-4 w-4" /> Login dengan Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}