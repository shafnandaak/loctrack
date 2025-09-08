import { Link } from "react-router-dom";
import { MapPinned, User, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, onAuthChange, signInWithGoogle, signOut } from "@/lib/supabase";

export function Header() {
  const [user, setUser] = useState<any | null>(null);
  useEffect(() => {
    (async () => setUser(await getCurrentUser()))();
    const unsub = onAuthChange((_, session) => setUser(session?.user ?? null));
    return unsub;
  }, []);

  const isAdmin = typeof window !== "undefined" && ((): boolean => {
    try {
      const list = (localStorage.getItem("loctrack:admins") || "").split(",").map((s) => s.trim()).filter(Boolean);
      return !!user && list.includes(user.email);
    } catch {
      return false;
    }
  })();

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
        <div className="flex items-center gap-3">
          {isAdmin && <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Admin</span>}
          {user ? (
            <button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
              <LogOut className="h-4 w-4" /> {user.email}
            </button>
          ) : (
            <button onClick={() => signInWithGoogle()} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
              <LogIn className="h-4 w-4" /> Login dengan Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
