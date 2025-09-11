import { Link, useNavigate } from "react-router-dom";
import { MapPinned, LogOut } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function Header() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Arahkan ke halaman login setelah logout
      navigate('/login'); 
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
        
        {/* Tombol logout hanya muncul jika ada user yang login */}
        {user && (
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.displayName || user.email}</span>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                  <LogOut className="h-4 w-4" /> 
                  <span>Logout</span>
                </button>
            </div>
        )}
      </div>
    </header>
  );
}