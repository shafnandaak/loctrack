import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPinned } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const navigate = useNavigate();

  // Jika pengguna sudah login, langsung arahkan ke halaman utama
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/'); // Arahkan ke halaman utama setelah berhasil login
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert("Gagal login dengan Google. Silakan coba lagi.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <MapPinned className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold">LocTrack</h1>
            </div>
          <CardTitle>Selamat Datang</CardTitle>
          <CardDescription>Silakan masuk dengan akun Google Anda untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleLogin} className="w-full">
            Masuk dengan Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}