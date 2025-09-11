import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import IndexPage from "./pages/Index";
import NotFoundPage from "./pages/NotFound";
import LoginPage from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

// Komponen untuk melindungi rute yang butuh login
function ProtectedRoute() {
  // ==== PERBAIKAN: Gunakan 'localUser' bukan 'user' ====
  const { localUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!localUser) {
    // Jika belum login, arahkan ke halaman /login
    return <Navigate to="/login" replace />;
  }

  // Jika sudah login, tampilkan konten (halaman utama)
  return <MainLayout />;
}

// Komponen untuk tata letak halaman utama (dengan Header dan Footer)
function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-50 via-white to-indigo-50">
      <Header />
      <main className="flex-grow">
        {/* Outlet akan merender komponen anak dari rute, yaitu IndexPage */}
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rute terproteksi untuk halaman utama */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<IndexPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Sonner />
    </>
  );
}

export default App;