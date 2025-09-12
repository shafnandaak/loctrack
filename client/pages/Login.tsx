import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { onLogin, User } from '@/lib/auth'; // onLogin akan menyimpan ke local storage
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPinned } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LatLngExpression } from 'leaflet';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let appUser: User;

      if (userDoc.exists()) {
        appUser = { id: firebaseUser.uid, ...userDoc.data() } as User;
      } else {
        // Buat data user baru jika belum ada di Firestore
        appUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "Pengguna Baru",
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            kecamatan: null, // Default
            color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
            lat: null,
            lng: null,
        };
        // Simpan user baru ini ke Firestore
        await setDoc(userDocRef, appUser);
      }

      onLogin(appUser); // Simpan sesi ke local storage
      navigate('/', { replace: true });

    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert("Gagal login dengan Google. Silakan coba lagi.");
    }
  };

  const tasikmalayaPosition: LatLngExpression = [-7.33, 108.22];

  return (
    <div className="relative w-screen h-screen">
      <MapContainer 
        center={tasikmalayaPosition}
        zoom={13} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-2 mb-2">
                  <MapPinned className="h-7 w-7 text-primary" />
                  <h1 className="text-2xl font-bold">LocTrack</h1>
              </div>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>Masuk dengan akun Google Anda untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoogleLogin} className="w-full">
              Masuk dengan Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}