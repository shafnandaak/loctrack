import { AdminSection } from "@/components/sections/AdminSection";
import { HistorySection } from "@/components/sections/HistorySection";
import { MonitorSection } from "@/components/sections/MonitorSection";
import { ShareSection } from "@/components/sections/ShareSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function IndexPage() {
  const { isAdmin } = useAuth();

  // Tentukan tab default: 'share' untuk user biasa, 'monitor' untuk admin
  const defaultTab = isAdmin ? "monitor" : "share";

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {/* SEMUA PENGGUNA: Tab untuk Share Lokasi */}
          <TabsTrigger value="share">Share Lokasi</TabsTrigger>
          
          {/* HANYA ADMIN: bisa melihat tab Monitor */}
          {isAdmin && <TabsTrigger value="monitor">Monitor</TabsTrigger>}
          
          {/* SEMUA PENGGUNA: bisa melihat tab History */}
          <TabsTrigger value="history">History</TabsTrigger>
          
          {/* HANYA ADMIN: bisa melihat tab Admin */}
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        {/* KONTEN TAB: ShareSection */}
        <TabsContent value="share" className="mt-4">
          <ShareSection />
        </TabsContent>

        {/* KONTEN HANYA ADMIN: Monitor */}
        {isAdmin && (
          <TabsContent value="monitor" className="mt-4">
            <MonitorSection isAdmin={isAdmin} />
          </TabsContent>
        )}
        
        {/* KONTEN SEMUA: History */}
        <TabsContent value="history" className="mt-4">
          <HistorySection />
        </TabsContent>
        
        {/* KONTEN HANYA ADMIN: Admin */}
        {isAdmin && (
          <TabsContent value="admin" className="mt-4">
            <AdminSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}