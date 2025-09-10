import { useEffect, useState } from "react";
import { HistoryMap } from "@/components/map/HistoryMap";

// Impor fungsi-fungsi dari Firebase
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Header } from "@/components/layout/Header";

// Definisikan tipe untuk data pengguna dari Firestore
interface AppUser {
  id: string; // Document ID dari Firestore
  name: string;
}

export default function Index() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Efek untuk mengambil daftar pengguna dari Firestore saat komponen dimuat
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollectionRef = collection(db, "users");
        const querySnapshot = await getDocs(usersCollectionRef);
        
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'No Name', // Ambil 'name' dari setiap dokumen
        }));

        setUsers(usersList);

        // Otomatis pilih pengguna pertama sebagai default jika ada
        if (usersList.length > 0) {
          setSelectedUser(usersList[0].id);
        }
      } catch (error) {
        console.error("Error fetching users from Firestore:", error);
      }
    };

    fetchUsers();
  }, []);

  // Efek untuk mengatur tanggal hari ini sebagai default
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto flex-1 p-4">
        <div className="flex flex-col gap-4">
          <section id="monitoring" className="h-[75vh] rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-4 border-b p-4">
                <h2 className="text-lg font-semibold">History Perjalanan</h2>
                <div className="ml-auto flex items-center gap-2">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="rounded-md border bg-transparent px-2 py-1 text-sm"
                  >
                    <option value="" disabled>Pilih Pengguna</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-md border bg-transparent px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 p-1">
                {selectedUser && selectedDate ? (
                  <HistoryMap user={selectedUser} date={selectedDate} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Pilih pengguna dan tanggal untuk melihat history.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="mt-12 border-t">
        <div className="container py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} LocTrack - Dibuat dengan Firebase.
        </div>
      </footer>
    </div>
  );
}