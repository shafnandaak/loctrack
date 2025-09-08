import { Link } from "react-router-dom";
import { MapPinned, User, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, onAuthChange, signInWithGoogle, signOut } from "@/lib/supabase";
import { getSessionLocal, signOutLocal } from "@/lib/auth";
import { LoginModal } from "@/components/layout/LoginModal";

export function Header() {
  const [user, setUser] = useState<any | null>(null);
  const [localSession, setLocalSession] = useState<any | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    (async () => setUser(await getCurrentUser().catch(() => null)))();
    const unsub = onAuthChange((_, session) => setUser(session?.user ?? null));
    return unsub;
  }, []);

  useEffect(() => {
    setLocalSession(getSessionLocal());
  }, []);

  const sessionUser = user || localSession;

  const isAdmin = (() => {
    try {
      const list = (localStorage.getItem("loctrack:admins") || "").split(",").map((s) => s.trim()).filter(Boolean);
      const email = sessionUser?.email;
      if (localSession?.isAdmin) return true;
      return !!email && list.includes(email);
    } catch {
      return false;
    }
  })();

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    signOutLocal();
    setLocalSession(null);
    setUser(null);
  };

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => { setLoginOpen(false); setLocalSession(getSessionLocal()); }} />
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
            {sessionUser ? (
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                <LogOut className="h-4 w-4" /> {sessionUser.email || sessionUser.name}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setLoginOpen(true)} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                  <LogIn className="h-4 w-4" /> Login (lokal)
                </button>
                <button onClick={() => signInWithGoogle().catch(() => setLoginOpen(true))} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                  <LogIn className="h-4 w-4" /> Login dengan Google
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
