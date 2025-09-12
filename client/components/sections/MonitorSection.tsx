import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/hooks/useUsers";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LiveMap } from "../map/LiveMap";
import { Button } from "../ui/button";
import { Download, Users, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { pointsToCsv } from "@/lib/utils";
import { getHistoryForDate } from "@/lib/firebase";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KECAMATAN_LIST } from "@/lib/constants";
import { Label } from "../ui/label";

export function MonitorSection({ isAdmin }: { isAdmin?: boolean }) {
  const { users, loading } = useUsers();
  const [kecFilter, setKecFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "lastSeen">("name");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    let arr = [...users].filter((u) => (kecFilter ? u.kecamatan === kecFilter : true));
    if (searchTerm) {
      arr = arr.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (sortBy === 'lastSeen') {
      arr.sort((a, b) => (b.lastSeen?.toMillis() || 0) - (a.lastSeen?.toMillis() || 0));
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return arr;
  }, [users, kecFilter, searchTerm, sortBy]);
  
  async function exportUserCsv(userId: string) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const points = await getHistoryForDate(userId, todayKey);
    
    if (points.length === 0) {
      toast.info("Tidak ada riwayat untuk diekspor hari ini.");
      return;
    }

    const csv = pointsToCsv(points);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `riwayat-${user.name}-${todayKey}.csv`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Peta Sebaran Pengguna</CardTitle>
          <CardDescription>Geser dan zoom untuk melihat sebaran pengguna secara realtime.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[640px] rounded-lg overflow-hidden">
            <LiveMap 
            isAdmin={isAdmin} 
            users={filteredUsers}
            selectedUserId={selectedUserId}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Pengguna yang terdaftar di sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-4">
            <div>
              <Label className="text-xs">Filter Kecamatan</Label>
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 h-10 text-sm" value={kecFilter} onChange={(e) => setKecFilter(e.target.value)}>
                <option value="">Tampilkan semua</option>
                {KECAMATAN_LIST.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Cari nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select className="rounded-md border bg-background px-3 py-2 text-sm h-10" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="name">Urut: Nama</option>
                <option value="lastSeen">Urut: Terakhir Aktif</option>
              </select>
            </div>
          </div>
          {loading ? (
             <div className="flex justify-center items-center h-[200px]"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="space-y-4">
                {filteredUsers.length === 0 && <p className="text-sm text-center text-muted-foreground pt-4">Tidak ada pengguna yang cocok.</p>}
                {filteredUsers.map((user) => {
                  const isOnline = user.lastSeen && (new Date().getTime() - user.lastSeen.toDate().getTime()) < 5 * 60 * 1000;
                  return (
                    <div 
                    key={user.id} 
                    className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedUserId === user.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    onClick={() => setSelectedUserId(user.id === selectedUserId ? null : user.id)} // <-- Agar bisa di-unselect
                    >
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={isOnline ? 'Online' : 'Offline'} />
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.kecamatan || "Belum diatur"}</p>
                        {user.sessionStartedAt && (
                          <p className="text-xs text-blue-600">
                            Mulai: {format(user.sessionStartedAt.toDate(), "HH:mm", { locale: id })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-mono">{user.lat?.toFixed(4)}, {user.lng?.toFixed(4)}</p>
                          <Button variant="ghost" size="sm" className="h-auto p-1 mt-1" onClick={() => exportUserCsv(user.id)}>
                            <Download className="h-3 w-3 mr-1"/> Export CSV
                          </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}