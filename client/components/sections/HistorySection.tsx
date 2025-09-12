import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { HistoryMap } from "../map/HistoryMap";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { getHistoryForDate } from "@/lib/firebase"; // <-- Menggunakan fungsi yang sudah diperbaiki
import { totalDistance, PositionPoint, formatDuration } from "@/lib/location";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KECAMATAN_LIST } from "@/lib/constants";
import { Label } from "@/components/ui/label";

export function HistorySection() {
  const { localUser, isAdmin } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [history, setHistory] = useState<PositionPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");

  const filteredUsers = useMemo(() => {
    if (!isAdmin) return [];
    return users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (kecamatanFilter ? user.kecamatan === kecamatanFilter : true)
    );
  }, [isAdmin, users, searchQuery, kecamatanFilter]);

  const targetUserId = isAdmin ? selectedUser?.id : localUser?.id;

  useEffect(() => {
    if (isAdmin && !selectedUser && filteredUsers.length > 0) {
      setSelectedUser(filteredUsers[0]);
    } else if (isAdmin && selectedUser && !filteredUsers.find(u => u.id === selectedUser.id)) {
      setSelectedUser(filteredUsers[0] || null);
    }
  }, [isAdmin, filteredUsers, selectedUser]);

  useEffect(() => {
    async function fetchHistory() {
      if (!targetUserId) {
        setHistory([]);
        return;
      };
      setHistoryLoading(true);
      setHistory([]);
      try {
        const data = await getHistoryForDate(targetUserId, selectedDate);
        setHistory(data);
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);
      } finally {
        setHistoryLoading(false);
        setSelectedIndex(null);
      }
    }
    fetchHistory();
  }, [targetUserId, selectedDate]);

  const total = useMemo(() => totalDistance(history), [history]);
  const displayName = isAdmin ? selectedUser?.name : localUser?.name;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Filter Riwayat</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {isAdmin && (
            <>
              <div>
                <Label>Cari Nama Pengguna</Label>
                <Input placeholder="Ketik nama..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Filter Kecamatan</Label>
                <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm h-10" value={kecamatanFilter} onChange={e => setKecamatanFilter(e.target.value)}>
                  <option value="">Semua Wilayah</option>
                  {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <Label>Pilih Pengguna</Label>
                <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm h-10" value={selectedUser?.id || ""} onChange={e => setSelectedUser(users.find(u => u.id === e.target.value) || null)} disabled={usersLoading}>
                  {usersLoading ? <option>Memuat...</option> : filteredUsers.length === 0 ? <option>Tidak ada pengguna</option> : filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <Label>Tanggal</Label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-1" />
          </div>
          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold">Detail Perjalanan</h3>
            <p className="text-sm text-muted-foreground">Total Jarak: {(total / 1000).toFixed(2)} km</p>
            <ScrollArea className="h-[320px] mt-2 w-full rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Koordinat</TableHead><TableHead>Durasi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="inline-block h-6 w-6 animate-spin" /></TableCell></TableRow>
                  ) : history.length > 0 ? (
                    history.map((p, i) => (
                      <TableRow key={p.timestamp} onClick={() => setSelectedIndex(i)} className={`cursor-pointer ${selectedIndex === i ? 'bg-muted' : ''}`}>
                        <TableCell>{format(new Date(p.timestamp), "HH:mm:ss")}</TableCell>
                        <TableCell>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</TableCell>
                        <TableCell>{i > 0 ? formatDuration(history[i-1], p) : '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Tidak ada data riwayat.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Peta Riwayat Perjalanan</CardTitle>
          <CardDescription>
            {displayName ? `Menampilkan riwayat untuk ${displayName} pada ${format(parseISO(selectedDate), "d MMMM yyyy", { locale: id })}` : "Pilih filter untuk melihat riwayat."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[640px] rounded-lg overflow-hidden relative">
            <HistoryMap points={history} selectedIndex={selectedIndex} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}