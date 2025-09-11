import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, setMe, sendPointToFirebase, updateUserStartLocation } from "@/lib/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PositionPoint, distanceMeters } from "@/lib/location";
import { useAuth } from "@/hooks/useAuth"; // <-- Impor hook

export function ShareSection() {
  // Ambil data user langsung dari hook
  const { localUser: user, refreshLocalUser } = useAuth(); 
  
  const [isSharing, setSharing] = useState(false);
  const [isGettingLocation, setGettingLocation] = useState(false);
  const lastPointRef = useRef<PositionPoint | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const shouldSend = useCallback((p: PositionPoint) => {
    const last = lastPointRef.current;
    if (!last) return true;
    return distanceMeters(last, p) >= 5; // Jarak minimal 5 meter
  }, []);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    if (!user) return;
    const newPoint: PositionPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
    if (shouldSend(newPoint)) {
      lastPointRef.current = newPoint;
      sendPointToFirebase(user.id, { lat: newPoint.lat, lng: newPoint.lng, accuracy: newPoint.accuracy });
    }
  }, [user, shouldSend]);

  const startShare = () => {
    if (!user) {
      toast.error("Gagal memulai", { description: "Data pengguna tidak ditemukan." });
      return;
    }
    setSharing(true);
    lastPointRef.current = null;
    
    navigator.geolocation.getCurrentPosition(position => {
        const initialPoint: PositionPoint = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        };
        lastPointRef.current = initialPoint;
        sendPointToFirebase(user.id, { lat: initialPoint.lat, lng: initialPoint.lng, accuracy: initialPoint.accuracy });
    });

    watchIdRef.current = navigator.geolocation.watchPosition(handlePositionUpdate, 
        (error) => console.error("Geolocation watch error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopShare = () => {
    setSharing(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const getInitialLocation = async () => {
    if (!user) return;
    setGettingLocation(true);
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
        const { latitude: lat, longitude: lng } = position.coords;
        await updateUserStartLocation(user.id, lat, lng);
        
        const me = { ...user, lat, lng };
        setMe(me); // Simpan ke localStorage
        refreshLocalUser(); // Refresh data di hook
        
        toast.success("Lokasi awal berhasil diatur!");
    } catch (err: any) {
      toast.error("Gagal mendapatkan lokasi", { description: err.message });
    }
    setGettingLocation(false);
  };

  useEffect(() => {
    return () => stopShare();
  }, []);

  // Guard clause: jika tidak ada user, jangan render apa-apa
  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bagikan Lokasi</CardTitle>
        <CardDescription>Mulai bagikan lokasi Anda agar dapat dipantau.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="share-location" className="flex flex-col gap-1">
            <span>Mulai Lacak</span>
            <span className="font-normal text-muted-foreground">
              {isSharing ? "Sedang membagikan lokasi..." : "Lokasi Anda tidak dibagikan."}
            </span>
          </Label>
          {!isSharing ? (
            <Button onClick={startShare} size="sm">Mulai Share</Button>
          ) : (
            <Button onClick={stopShare} size="sm" variant="outline">Stop Share</Button>
          )}
        </div>
        {(!user.lat || !user.lng) && (
          <div className="flex items-center justify-between">
            <Label htmlFor="share-location" className="flex flex-col gap-1">
              <span>Lokasi Awal</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Ambil titik lokasi awal Anda (jika belum ada).
              </span>
            </Label>
            <Button onClick={getInitialLocation} size="sm" variant="outline" disabled={isGettingLocation}>
              {isGettingLocation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ambil Titik
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

