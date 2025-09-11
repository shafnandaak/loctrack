import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { HistoryMap } from "../map/HistoryMap";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/hooks/useUsers";
import { getHistoryForDate } from "@/lib/firebase";
// Impor fungsi formatDuration
import { totalDistance, PositionPoint, formatDuration } from "@/lib/location"; 
import { Loader2 } from "lucide-react";
// Impor komponen Tabel
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HistorySection() {
  const { users, loading: usersLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [history, setHistory] = useState<PositionPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [kecFilter, setKecFilter] = useState<string | null>(null);

  const kecamatanOptions = [ "Bungursari", "Cibeureum", "Purbaratu", "Indihiang", "Kawalu", "Mangkubumi", "Tamansari", "Cihideung", "Tawang", "Cipedes" ];

  const filteredUsers = useMemo(() => {
    return users.filter(u => kecFilter ? u.kecamatan === kecFilter : true);
  }, [users, kecFilter]);

  useEffect(() => {
    if (!selectedUser && users.length > 0) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser]);

  useEffect(() => {
    async function fetchHistory() {
      if (!selectedUser) return;

      setHistoryLoading(true);
      setHistory([]);
      try {
        const data = await getHistoryForDate(selectedUser.id, selectedDate);
        setHistory(data);
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);
      } finally {
        setHistoryLoading(false);
        setSelectedIndex(null);
      }
    }
    fetchHistory();
  }, [selectedUser, selectedDate]);

  const total = useMemo(() => totalDistance(history), [history]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        {/* ... CardHeader dan Peta tidak berubah ... */}
        <CardHeader>
           <CardTitle>Peta Riwayat Perjalanan</CardTitle>
           <CardDescription>
             {selectedUser ? `Menampilkan riwayat untuk ${selectedUser.name} pada ${format(parseISO(selectedDate), "d MMMM yyyy", { locale: id })}.` : "Pilih pengguna untuk melihat riwayat."}
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="h-[640px] rounded-lg overflow-hidden relative">
             {historyLoading && (
               <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                 <Loader2 className="h-8 w-8 animate-spin" />
               </div>
             )}
             <HistoryMap points={history} selectedIndex={selectedIndex} />
           </div>
         </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filter Riwayat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* ... Filter Kecamatan dan Pengguna tidak berubah ... */}
           <div>
             <label className="text-sm font-medium">Kecamatan</label>
             <select
               className="mt-1 w-full rounded-md border bg-background px-3 py-2"
               value={kecFilter ?? ""}
               onChange={(e) => setKecFilter(e.target.value || null)}
             >
               <option value="">Tampilkan semua</option>
               {kecamatanOptions.map((k) => (<option key={k} value={k}>{k}</option>))}
             </select>
           </div>
           <div>
             <label>Pengguna</label>
             <select
               className="mt-1 w-full rounded-md border bg-background px-3 py-2"
               value={selectedUser?.id || ""}
               onChange={e => setSelectedUser(users.find(u => u.id === e.target.value) || null)}
               disabled={usersLoading}
             >
               <option value="" disabled>{usersLoading ? "Memuat..." : "Pilih Pengguna"}</option>
               {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
           </div>
          <div>
            <label>Tanggal</label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>

          {history.length > 0 && !historyLoading && (
            <div className="mt-4">
              <h3 className="font-semibold">Detail Perjalanan</h3>
              <p className="text-sm text-muted-foreground">Total Jarak: {(total / 1000).toFixed(2)} km</p>
              
              {/* ==== AWAL PERUBAHAN ==== */}
              <div className="max-h-[320px] overflow-y-auto mt-2 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Koordinat</TableHead>
                      <TableHead>Durasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((p, i) => (
                      <TableRow 
                        key={i} 
                        className={`cursor-pointer ${selectedIndex === i ? 'bg-muted' : ''}`} 
                        onClick={() => setSelectedIndex(i)}
                      >
                        <TableCell className="text-sm font-medium">
                          {format(new Date(p.timestamp), "HH:mm:ss")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {/* Logika untuk menampilkan durasi */}
                          {i > 0 ? formatDuration(history[i-1], p) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* ==== AKHIR PERUBAHAN ==== */}

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}