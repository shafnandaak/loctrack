import { Link } from "react-router-dom";
import { MapPinned } from "lucide-react";

export function Header() {
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
      </div>
    </header>
  );
}
