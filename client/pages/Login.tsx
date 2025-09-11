import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { onLogin, User } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPinned } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { LatLngExpression } from 'leaflet'; // <-- Tipe data untuk koordinat peta

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser: FirebaseAuthUser = result.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData: User;

      if (userDoc.exists()) {
        // Jika user sudah ada di Firestore, gunakan datanya
        userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
      } else {
        // Jika belum ada, buat objek user baru sesuai tipe kustom kita
        userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "Pengguna Baru",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
        };
      }

      // Kirim objek `userData` yang sudah sesuai dengan tipe `User` kustom kita
      await onLogin(userData);
      navigate('/', { replace: true });

    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert("Gagal login dengan Google. Silakan coba lagi.");
    }
  };

  if (loading || user) {
    return null; 
  }

  // Definisikan posisi dengan tipe LatLngExpression
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
        <Card className="w-full max-w-sm animate-fade-in">
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

