import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";
import { PositionPoint } from "./location";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();


// ======================================================================
//                            PERBAIKAN UTAMA
// ======================================================================
// Fungsi ini diperbaiki untuk mengambil data dari sub-koleksi 'points'
// berdasarkan rentang waktu dari awal hingga akhir hari yang dipilih,
// dengan penanganan zona waktu yang lebih baik.
export async function getHistoryForDate(userId: string, date: string): Promise<PositionPoint[]> {
  if (!userId) return [];

  try {
    // Membuat tanggal di zona waktu lokal, bukan UTC.
    // Ini memastikan rentang waktu sesuai dengan hari yang dipilih pengguna.
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    // Ubah menjadi Firestore Timestamp untuk query
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const pointsCollection = collection(db, `users/${userId}/points`);
    
    // Buat query untuk memfilter dokumen berdasarkan rentang timestamp
    const q = query(
      pointsCollection,
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp),
      orderBy("timestamp", "asc") // Urutkan dari yang paling awal
    );

    const querySnapshot = await getDocs(q);
    const points: PositionPoint[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Pastikan timestamp ada dan valid
      if (data.timestamp) {
        points.push({
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          timestamp: (data.timestamp as Timestamp).toMillis(),
        });
      }
    });

    return points;
  } catch (error) {
    console.error("Error getting history for date:", error);
    return [];
  }
}