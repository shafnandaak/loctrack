import { AdminSection } from "@/components/sections/AdminSection";
import { HistorySection } from "@/components/sections/HistorySection";
import { MonitorSection } from "@/components/sections/MonitorSection";
import { ShareSection } from "@/components/sections/ShareSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton"; // Impor Skeleton

export default function IndexPage() {
  const { isAdmin, localUser, loading } = useAuth(); // Ambil status loading

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <ShareSection />

      <Tabs defaultValue="monitor" className="mt-4">
        <TabsList>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>
        <TabsContent value="monitor" className="mt-4">
          <MonitorSection isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistorySection />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="admin" className="mt-4">
            <AdminSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

