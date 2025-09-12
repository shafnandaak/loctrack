import { User as FirebaseAuthUser } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";
import { PositionPoint } from "./location";

export type User = {
  id: string;
  name: string;
  email?: string | null;
  photoURL?: string | null;
  kecamatan?: string | null;
  color?: string;
  lat?: number | null;
  lng?: number | null;
  lastSeen?: Timestamp | null;
  // TAMBAHAN: untuk melacak waktu mulai sesi
  sessionStartedAt?: Timestamp | null; 
};

const LS_ME = "loctrack:me";

export function getMe(): User | null {
  try {
    const raw = localStorage.getItem(LS_ME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setMe(user: User | null) {
  if (user) {
    localStorage.setItem(LS_ME, JSON.stringify(user));
  } else {
    localStorage.removeItem(LS_ME);
  }
}

export async function onLogin(user: User) {
  const userRef = doc(db, "users", user.id);
  await setDoc(userRef, {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      color: user.color,
  }, { merge: true });
  setMe(user);
}

export function onLogout() {
  setMe(null);
}

// ======================================================================
//                            PERBAIKAN UTAMA
// ======================================================================
// Fungsi ini sekarang melakukan 2 hal:
// 1. Memperbarui lokasi terakhir (lat, lng, lastSeen) di dokumen utama user.
// 2. Menambahkan titik ke sub-koleksi riwayat (points).
export async function sendPointToFirebase(userId: string, point: Omit<PositionPoint, 'timestamp'>) {
    if (!userId) return;
    console.log(`Mengirim update untuk user ${userId} ke lokasi:`, point);
    try {
        const userDocRef = doc(db, "users", userId);
        const userPointsCollection = collection(db, `users/${userId}/points`);
        
        // 1. Update dokumen utama untuk peta live
        await updateDoc(userDocRef, {
            lat: point.lat,
            lng: point.lng,
            lastSeen: serverTimestamp() // Update waktu terakhir terlihat
        });

        // 2. Tambah ke sub-koleksi untuk riwayat
        const pointWithTimestamp = {
            ...point,
            timestamp: serverTimestamp()
        };
        await addDoc(userPointsCollection, pointWithTimestamp);
    } catch (error) {
        console.error("Error sending point to Firebase:", error);
    }
}

// FUNGSI BARU: untuk mengelola status sesi (mulai/berhenti)
export async function updateUserSessionStatus(userId: string, status: { sessionStartedAt: any }) {
    if (!userId) return;
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, status);
}
// ======================================================================

export async function updateUserKecamatan(userId: string, kecamatan: string) {
  if (!userId) return;
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, { kecamatan });
}