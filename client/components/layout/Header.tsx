import { Link } from "react-router-dom";
import { MapPinned, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, onAuthChange, signInWithGoogle, signOut } from "@/lib/supabase";

export function Header() {
  const [user, setUser] = useState<any | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    (async () => setUser(await getCurrentUser().catch(() => null)))();
    const unsub = onAuthChange((_, session) => setUser(session?.user ?? null));
    return unsub;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sessionUser = user;

  const isAdmin = (() => {
    try {
      const list = (localStorage.getItem("loctrack:admins") || "").split(",").map((s) => s.trim()).filter(Boolean);
      const email = sessionUser?.email;
      return !!email && list.includes(email);
    } catch {
      return false;
    }
  })();

  const handleLoginGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      // Supabase not configured or popup blocked
      alert("Google Sign-In tidak tersedia. Pastikan Supabase OAuth diatur. Silakan hubungkan Supabase di Open MCP popover dan atur VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY.");
    }
  };

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    setUser(null);
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
          {sessionUser ? (
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
              <LogOut className="h-4 w-4" /> {sessionUser.email || sessionUser.user_metadata?.full_name}
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
