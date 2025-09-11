import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login"; // Impor halaman login baru
import { Toaster } from "./components/ui/toaster";
import { useAuthState } from 'react-firebase-hooks/auth'; // Library helper untuk status auth
import { auth } from "./lib/firebase";

// Komponen untuk melindungi rute
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    // Tampilkan loading screen sederhana selagi memeriksa status login
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // Jika tidak ada user, arahkan ke halaman login
    return <Navigate to="/login" replace />;
  }

  // Jika ada user, tampilkan halaman yang diminta
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;