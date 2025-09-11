import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getMe, onLogin as saveUserSession, onLogout as clearUserSession, User } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';

// Ganti ini dengan UID admin Anda dari Firebase Authentication
// Anda bisa dapatkan dari https://console.firebase.google.com/project/_/authentication/users
const ADMIN_UID = "MASUKKAN_UID_ADMIN_ANDA_DI_SINI"; 

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [localUser, setLocalUser] = useState<User | null>(() => getMe());
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk me-refresh data dari local storage
  const refreshLocalUser = useCallback(() => {
    setLocalUser(getMe());
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsAdmin(user.uid === ADMIN_UID);
        
        // Ambil data lengkap dari Firestore setelah login
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = { id: user.uid, ...userDoc.data() } as User;
          saveUserSession(userData); // Simpan ke local storage
        }
      } else {
        setFirebaseUser(null);
        setIsAdmin(false);
        clearUserSession(); // Hapus dari local storage
      }
      refreshLocalUser(); // Selalu refresh data lokal setelah status auth berubah
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshLocalUser]);

  return { 
    user: firebaseUser, // Pengguna dari Firebase
    localUser,           // Profil pengguna dari local storage/Firestore
    isAdmin, 
    loading, 
    refreshLocalUser     // Fungsi untuk refresh manual
  };
}