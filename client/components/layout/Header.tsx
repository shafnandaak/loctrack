import { Link, useNavigate } from "react-router-dom";
import { MapPinned, LogOut, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { onLogout } from "@/lib/auth";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export function Header() {
  const { localUser } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await onLogout();
    navigate(0);
  };

  if (!localUser) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <MapPinned />
          <h1 className="font-bold">LocTrack</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(currentTime, 'HH:mm:ss')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={localUser.photoURL ?? ""} />
              <AvatarFallback>
                {/* ==== PERBAIKAN DI SINI ==== */}
                {localUser.name?.[0]?.toUpperCase() ?? "A"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm font-medium">
              {/* ==== DAN DI SINI ==== */}
              {localUser.name}
            </span>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}