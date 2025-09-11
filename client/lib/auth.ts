import { User as FirebaseAuthUser } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { PositionPoint } from "./location";
import { Timestamp } from "firebase/firestore";

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

// Fungsi ini sekarang lebih fokus menangani data user setelah login
export async function onLogin(user: User) {
  const userRef = doc(db, "users", user.id);
  
  // Simpan atau perbarui data user ke Firestore
  // `merge: true` memastikan kita tidak menimpa data yang sudah ada
  await setDoc(userRef, {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      color: user.color,
  }, { merge: true });

  // Simpan data user ke local storage untuk akses cepat
  setMe(user);
}

export function onLogout() {
  setMe(null);
}

// Fungsi untuk mengirim titik lokasi ke sub-koleksi 'points'
export async function sendPointToFirebase(userId: string, point: Omit<PositionPoint, 'timestamp'>) {
    if (!userId) return;
    try {
        const pointWithTimestamp = {
            ...point,
            timestamp: serverTimestamp() // Gunakan timestamp server
        };
        const userPointsCollection = collection(db, `users/${userId}/points`);
        await addDoc(userPointsCollection, pointWithTimestamp);
    } catch (error) {
        console.error("Error sending point to Firebase:", error);
    }
}

// Fungsi untuk memperbarui lokasi awal di dokumen user utama
export async function updateUserStartLocation(userId: string, lat: number, lng: number) {
    if (!userId) return;
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { lat, lng });
    } catch (error) {
        console.error("Error updating user start location:", error);
    }
}
