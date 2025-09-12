import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import IndexPage from "./pages/Index";
import NotFoundPage from "./pages/NotFound";
import LoginPage from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { LocationProvider } from './hooks/useLocationTracking';

// Layout utama untuk halaman setelah login (ada Header & Footer)
const MainLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main className="flex-grow">
      {/* Outlet akan merender komponen halaman seperti IndexPage */}
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Rute yang hanya bisa diakses JIKA SUDAH LOGIN
const ProtectedRoute = () => {
  const { localUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }
  return localUser ? <MainLayout /> : <Navigate to="/login" replace />;
};

// Rute yang hanya bisa diakses JIKA BELUM LOGIN
const PublicRoute = () => {
  const { localUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }
  return localUser ? <Navigate to="/" replace /> : <Outlet />;
};

function App() {
  return (
    <>
      <BrowserRouter>
        {/* ==== PERBAIKAN DI SINI ==== */}
        {/* Bungkus semua rute dengan LocationProvider agar state tracking aktif */}
        <LocationProvider>
          <Routes>
            {/* Rute untuk halaman utama dibungkus ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<IndexPage />} />
            </Route>

            {/* Rute untuk login dibungkus PublicRoute */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </LocationProvider>
        {/* ==== AKHIR PERBAIKAN ==== */}
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;