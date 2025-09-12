import { collection, writeBatch, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "./auth";

// Fungsi untuk menghasilkan string acak
function randomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Koordinat di sekitar Tasikmalaya
const tasikmalayaCenter = { lat: -7.3273, lng: 108.2203 };

// Fungsi untuk membuat data demo
export async function generateDemoDataFirebase() {
  const batch = writeBatch(db);
  const usersRef = collection(db, "users");

  const demoUsers: Partial<User>[] = [
    { name: "Andi Saputra", kecamatan: "Cihideung", color: "#10b981" },
    { name: "Budi Santoso", kecamatan: "Tawang", color: "#06b6d4" },
    { name: "Citra Lestari", kecamatan: "Indihiang", color: "#f59e0b" },
    { name: "Dewi Anggraini", kecamatan: "Kawalu", color: "#ef4444" },
    { name: "Eko Prasetyo", kecamatan: "Mangkubumi", color: "#8b5cf6" },
  ];

  for (const userData of demoUsers) {
    const userId = randomString(20); // Buat ID acak
    const userDocRef = doc(usersRef, userId);

    // Simulasikan 3 dari 5 pengguna sedang online
    const isOnline = demoUsers.indexOf(userData) < 3;
    
    // Titik lokasi acak di sekitar Tasikmalaya
    const lat = tasikmalayaCenter.lat + (Math.random() - 0.5) * 0.1;
    const lng = tasikmalayaCenter.lng + (Math.random() - 0.5) * 0.1;

    const finalUserData = {
      id: userId,
      name: userData.name,
      email: `${userData.name?.toLowerCase().replace(' ', '.')}@demo.com`,
      kecamatan: userData.kecamatan,
      color: userData.color,
      // Jika disimulasikan online, tambahkan data live
      lat: isOnline ? lat : null,
      lng: isOnline ? lng : null,
      lastSeen: isOnline ? serverTimestamp() : null,
      sessionStartedAt: isOnline ? serverTimestamp() : null,
    };

    batch.set(userDocRef, finalUserData);

    // Tambahkan beberapa titik history untuk pengguna yang online
    if (isOnline) {
      const pointsRef = collection(userDocRef, "points");
      for (let i = 0; i < 5; i++) {
        const historyLat = lat + (Math.random() - 0.5) * 0.01;
        const historyLng = lng + (Math.random() - 0.5) * 0.01;
        const historyTimestamp = Timestamp.fromMillis(Date.now() - (5 - i) * 60000); // 5 menit terakhir
        const pointDocRef = doc(pointsRef);
        batch.set(pointDocRef, { 
          lat: historyLat, 
          lng: historyLng, 
          accuracy: 10 + Math.random() * 10,
          timestamp: historyTimestamp 
        });
      }
    }
  }

  await batch.commit();
}