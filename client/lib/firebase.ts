import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy, enableIndexedDbPersistence } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";
import { PositionPoint } from "./location";
import { addDoc, serverTimestamp } from "firebase/firestore";


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

// Mengaktifkan offline persistence untuk Firestore
enableIndexedDbPersistence(db).catch((err) => {
  // IndexedDB mungkin tidak tersedia di mode private/incognito atau tab ganda
  if (err.code === 'failed-precondition') {
    console.warn('Persistence gagal karena ada beberapa tab terbuka.');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence tidak didukung di browser ini.');
  } else {
    console.error('Gagal mengaktifkan offline persistence:', err);
  }
});

// Fungsi untuk mencatat aktivitas user

export async function logUserActivity(userId: string, type: string, detail?: string) {
  try {
    await addDoc(collection(db, `users/${userId}/activityLogs`), {
      type,
      timestamp: serverTimestamp(),
      detail: detail || ""
    });
  } catch (err) {
    console.error("Gagal menyimpan log aktivitas:", err);
  }
}

export async function getUserLoginCount(userId: string): Promise<number> {
  const q = query(
    collection(db, `users/${userId}/activityLogs`),
    where("type", "==", "login")
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Fungsi ambil statistik login semua user
export async function getAllUserLoginStats(userIds: string[]): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};
  for (const id of userIds) {
    stats[id] = await getUserLoginCount(id);
  }
  return stats;
}

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