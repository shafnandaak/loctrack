// client/components/sections/AdminSection.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateDemoDataFirebase } from "@/lib/demo"; // Impor fungsi baru

export function AdminSection() {
  const [isGenerating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateDemoDataFirebase();
      toast.success("Data demo berhasil dibuat!", {
        description: "Silakan muat ulang halaman untuk melihat perubahan.",
      });
      // Tidak perlu reload otomatis agar pengguna bisa membaca notifikasi
    } catch (error: any) {
      toast.error("Gagal membuat data demo", {
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Admin</CardTitle>
        <CardDescription>Fitur-fitur yang hanya bisa diakses oleh admin.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Buat Data Demo</h3>
            <p className="text-sm text-muted-foreground">
              Membuat 10 data pengguna acak di Firestore untuk keperluan demo.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}