import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { updateUserKecamatan, User } from '@/lib/auth';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { PositionPoint, totalDistance } from '@/lib/location';
import { format } from 'date-fns';
import { getHistoryForDate } from '@/lib/firebase';
import { useUsers } from '@/hooks/useUsers';
import { KECAMATAN_LIST } from '@/lib/constants';
import { useLocationTracking } from '@/hooks/useLocationTracking'; // <-- Hook utama untuk kontrol lokasi

// =========================================================================
// Komponen DailySummaryCard tidak perlu diubah, kodenya sudah benar.
// Pastikan komponen ini ada di dalam file yang sama atau diimpor dengan benar.
// =========================================================================
function DailySummaryCard() {
  const { localUser, isAdmin } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [summaries, setSummaries] = useState<{ u: User; dist: number; list: PositionPoint[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const usersToFetch = isAdmin ? users : (localUser ? [localUser] : []);
    if (usersLoading && isAdmin) return;

    const fetchSummaries = async () => {
      setIsLoading(true);
      const summaryData = await Promise.all(
        usersToFetch.map(async (u) => {
          const list = await getHistoryForDate(u.id, today);
          const dist = totalDistance(list);
          return { u, list, dist };
        })
      );
      setSummaries(summaryData);
      setIsLoading(false);
    };

    if (usersToFetch.length > 0) {
      fetchSummaries();
    } else if (!usersLoading) {
      setIsLoading(false);
    }
  }, [localUser, isAdmin, users, usersLoading, today]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAdmin ? "Ringkasan Hari Ini" : "Ringkasan Anda Hari Ini"}</CardTitle>
        <CardDescription>
          {isAdmin ? "Jarak tempuh per pengguna." : "Total jarak tempuh Anda hari ini."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="space-y-3">
            {summaries.length === 0 && <li className="text-sm text-muted-foreground">Belum ada data riwayat.</li>}
            {summaries.map(({ u, dist, list }) => (
              <li key={u.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: u.color }} />
                  <div>
                    <div className="font-medium text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{list.length} titik</div>
                  </div>
                </div>
                <div className="text-sm font-semibold">{(dist / 1000).toFixed(2)} km</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


// =========================================================================
//          PERBAIKAN UTAMA ADA DI KOMPONEN DI BAWAH INI
// =========================================================================
export function ShareSection() {
  const { localUser, refreshLocalUser } = useAuth();
  
  // HANYA MENGAMBIL STATE DAN FUNGSI KONTROL DARI CONTEXT
  // Semua logika watchPosition, handlePositionUpdate, dll. sudah dipindahkan
  const { isSharing, startShare, stopShare } = useLocationTracking();
  
  const [kecamatan, setKecamatan] = useState(localUser?.kecamatan || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sinkronkan state kecamatan jika localUser berubah
  useEffect(() => {
    if (localUser) {
      setKecamatan(localUser.kecamatan || '');
    }
  }, [localUser]);

  const handleSaveKecamatan = async () => {
    if (!localUser) return;
    setIsSaving(true);
    try {
      await updateUserKecamatan(localUser.id, kecamatan);
      refreshLocalUser();
      toast.success("Wilayah cacah berhasil disimpan!");
    } catch (error) {
      toast.error("Gagal menyimpan data.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Hapus semua logika pelacakan:
  // - const handlePositionUpdate = useCallback(...) -> DIHAPUS
  // - const startShare = () => { ... } -> DIHAPUS (diganti dari context)
  // - const stopShare = () => { ... } -> DIHAPUS (diganti dari context)
  // - useEffect(() => { return () => stopShare(); }, []); -> DIHAPUS

  if (!localUser) return null;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Profil dan Pengaturan Lokasi</CardTitle>
          <CardDescription>Kelola informasi Anda dan mulai bagikan lokasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Alamat Email</Label>
              <Input id="email" value={localUser.email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="name">Nama</Label>
              <Input id="name" value={localUser.name || ''} disabled />
            </div>
          </div>
          <div>
            <Label htmlFor="kecamatan">Kecamatan (Wilayah Cacah)</Label>
            <div className="flex gap-2 mt-1">
              <select
                id="kecamatan"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm h-10"
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
              >
                <option value="">Pilih Wilayah</option>
                {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <Button onClick={handleSaveKecamatan} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
              </Button>
            </div>
          </div>
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Bagikan Lokasi</h3>
                <p className="text-sm text-muted-foreground">{isSharing ? "Status: Aktif" : "Status: Tidak Aktif"}</p>
              </div>
              {/* Tombol ini sekarang memanggil fungsi dari Context yang sudah terpusat */}
              {!isSharing ? (
                <Button onClick={startShare}>Mulai Share</Button>
              ) : (
                <Button onClick={stopShare} variant="destructive">Stop Share</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="md:col-span-1">
        <DailySummaryCard />
      </div>
    </div>
  );
}