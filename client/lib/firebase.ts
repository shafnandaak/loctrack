// client/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { PositionPoint } from "./location";

const firebaseConfig = {
  apiKey: "AIzaSyCtWlMgajb_u3jcQujX7M0H-c4gpMk_M6Q",
  authDomain: "nans-project-7362d.firebaseapp.com",
  projectId: "nans-project-7362d",
  storageBucket: "nans-project-7362d.appspot.com",
  messagingSenderId: "526490169989",
  appId: "1:526490169989:web:b19d15473e7763a7262fec"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function getHistoryForDate(userId: string, date: string): Promise<PositionPoint[]> {
  try {
    // SESUAIKAN DENGAN STRUKTUR BARU ANDA:
    const pointsRef = collection(db, `location_history/${userId}/location_history`);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    // Ubah "timestamp" menjadi "recorded_at" sesuai screenshot database Anda
    const q = query(
      pointsRef, 
      where("recorded_at", ">=", startTimestamp),
      where("recorded_at", "<=", endTimestamp),
      orderBy("recorded_at", "asc")
    );

    const querySnapshot = await getDocs(q);
    const points: PositionPoint[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Pastikan data timestamp ada dan merupakan objek Timestamp dari Firebase
      if (data.recorded_at && typeof data.recorded_at.toMillis === 'function') {
        points.push({
          // Sesuaikan nama field
          lat: data.latitude,
          lng: data.longitude,
          timestamp: (data.recorded_at as Timestamp).toMillis(),
          accuracy: data.accuracy || null, // Tambahkan fallback
        });
      }
    });
    return points;
  } catch (error) {
    console.error("Error getting history for date:", error);
    return [];
  }
}