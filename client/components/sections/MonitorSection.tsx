import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/lib/auth";
import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { LiveMap } from "../map/LiveMap";
import { Button } from "../ui/button";
import { Download, Users, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { pointsToCsv } from "@/lib/utils";
import { useUsers } from "@/hooks/useUsers";
import { getHistoryForDate } from "@/lib/firebase";
import { toast } from "sonner";

export function MonitorSection({ isAdmin }: { isAdmin?: boolean }) {
  const { users, loading } = useUsers();
  const [kecFilter, setKecFilter] = useState<string | null>(null);
  const kecamatanOptions = [ "Bungursari", "Cibeureum", "Purbaratu", "Indihiang", "Kawalu", "Mangkubumi", "Tamansari", "Cihideung", "Tawang", "Cipedes" ];
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "lastSeen">("name");

  const filteredUsers = useMemo(() => {
    let arr = [...users].filter((u) => (kecFilter ? u.kecamatan === kecFilter : true));
    if (searchTerm) arr = arr.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Note: Sorting by 'lastSeen' would require fetching the latest point for each user,
    // which can be complex. For now, we sort by name.
    if (sortBy === "name") {
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Peta Sebaran Pengguna
          </CardTitle>
          <CardDescription>Geser dan zoom untuk melihat sebaran pengguna secara realtime.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[640px] rounded-lg overflow-hidden">
            <LiveMap isAdmin={isAdmin} users={users} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Pengguna yang terdaftar di sistem.</CardDescription>
          <div className="mt-4">
            <label className="text-sm font-medium">Filter Kecamatan</label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              value={kecFilter ?? ""}
              onChange={(e) => setKecFilter(e.target.value || null)}
            >
              <option value="">Tampilkan semua</option>
              {kecamatanOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Cari nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama</SelectItem>
                {/* <SelectItem value="lastSeen">Terakhir Dilihat</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
             <div className="flex justify-center items-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto">
                {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.kecamatan}</p>
                    {/* Last seen info can be added later if needed */}
                    </div>
                    <Button variant="outline" size="icon" className="ml-auto" onClick={() => exportUserCsv(user.id)}>
                    <Download className="h-4 w-4" />
                    </Button>
                </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
