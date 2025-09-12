import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateDemoDataFirebase } from "@/lib/demo";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export function AdminSection() {
  const { localUser } = useAuth();
  const [isGenerating, setGenerating] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  async function handleGenerate() {
    if (!confirm("Anda akan membuat 5 pengguna demo acak. Lanjutkan?")) return;
    setGenerating(true);
    try {
      await generateDemoDataFirebase();
      toast.success("Data demo berhasil dibuat!", {
        description: "Refresh halaman untuk melihat perubahan.",
      });
    } catch (error: any) {
      toast.error("Gagal membuat data demo", { description: error.message });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteAll() {
    if (!confirm("PERINGATAN: Anda akan menghapus SEMUA data pengguna kecuali akun Anda sendiri. Tindakan ini tidak dapat dibatalkan. Lanjutkan?")) return;
    setDeleting(true);
    try {
      const batch = writeBatch(db);
      const usersQuery = await getDocs(collection(db, "users"));
      
      usersQuery.forEach(doc => {
        // Jangan hapus akun admin yang sedang login
        if (doc.id !== localUser?.id) {
          batch.delete(doc.ref);
        }
      });
      
      await batch.commit();
      toast.success("Semua data pengguna (kecuali admin) telah dihapus.", {
        description: "Sub-koleksi riwayat tidak ikut terhapus otomatis dan perlu dihapus manual dari Firebase Console jika perlu.",
      });
    } catch (error: any) {
      toast.error("Gagal menghapus data", { description: error.message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Admin</CardTitle>
        <CardDescription>Fitur-fitur yang hanya bisa diakses oleh admin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">Buat Data Demo</h3>
            <p className="text-sm text-muted-foreground">
              Membuat 5 pengguna acak. 3 di antaranya akan disimulasikan online.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Data
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
          <div>
            <h3 className="font-medium text-destructive">Hapus Semua Data Pengguna</h3>
            <p className="text-sm text-muted-foreground">
              Menghapus semua pengguna kecuali akun Anda yang sedang login.
            </p>
          </div>
          <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}