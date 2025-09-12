import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { PositionPoint, distanceMeters } from '@/lib/location';
import { sendPointToFirebase, updateUserSessionStatus } from '@/lib/auth';
import { toast } from 'sonner';
import { serverTimestamp } from 'firebase/firestore'; // <-- Impor serverTimestamp

interface LocationContextType {
  isSharing: boolean;
  startShare: () => void;
  stopShare: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { localUser } = useAuth();
  const [isSharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<PositionPoint | null>(null);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    if (!localUser) return;
    const newPoint: PositionPoint = {
      lat: position.coords.latitude, lng: position.coords.longitude,
      accuracy: position.coords.accuracy, timestamp: position.timestamp,
    };
    if (!lastPointRef.current || distanceMeters(lastPointRef.current, newPoint) >= 10) {
      lastPointRef.current = newPoint;
      // Fungsi ini sekarang sudah diperbaiki untuk update lat/lng di dokumen utama
      sendPointToFirebase(localUser.id, { lat: newPoint.lat, lng: newPoint.lng, accuracy: newPoint.accuracy });
    }
  }, [localUser]);

  const startShare = () => {
    if (!localUser || !navigator.geolocation) {
        toast.error("Geolocation tidak didukung atau pengguna tidak ditemukan.");
        return;
    };
    setSharing(true);
    updateUserSessionStatus(localUser.id, { sessionStartedAt: serverTimestamp() });

    navigator.geolocation.getCurrentPosition(position => {
      const initialPoint: PositionPoint = {
          lat: position.coords.latitude, lng: position.coords.longitude,
          accuracy: position.coords.accuracy, timestamp: position.timestamp
      };
      lastPointRef.current = initialPoint;
      sendPointToFirebase(localUser.id, { lat: initialPoint.lat, lng: initialPoint.lng, accuracy: initialPoint.accuracy });
      
      watchIdRef.current = navigator.geolocation.watchPosition(handlePositionUpdate, 
          (error) => console.error("Geolocation watch error:", error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      toast.success("Berbagi lokasi dimulai!");
    }, (error) => {
        toast.error("Gagal mendapatkan lokasi awal", { description: error.message });
        setSharing(false);
    });
  };

  const stopShare = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
    lastPointRef.current = null;
    
    if(localUser) {
      updateUserSessionStatus(localUser.id, { sessionStartedAt: null });
    }

    toast.info("Berbagi lokasi dihentikan.");
  };

  return (
    <LocationContext.Provider value={{ isSharing, startShare, stopShare }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocationTracking = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationTracking harus digunakan di dalam LocationProvider');
  }
  return context;
};

