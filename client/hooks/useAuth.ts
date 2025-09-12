import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getMe, setMe, onLogout as clearUserSession, User } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';

// =======================================================================
// PENTING: Ganti nilai di bawah ini dengan UID admin Anda dari Firebase.
// Buka Firebase Console > Authentication > Users > Salin User UID admin.
// =======================================================================
const ADMIN_UID = "0KEk8d4731eWADpxdpsT7exWO1A3"; 

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [localUser, setLocalUser] = useState<User | null>(() => getMe());
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshLocalUser = useCallback(() => {
    const userFromStorage = getMe();
    setLocalUser(userFromStorage);
    if (userFromStorage) {
      // Cek apakah ID user yang login adalah ID admin
      setIsAdmin(userFromStorage.id === ADMIN_UID);
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Cek admin berdasarkan UID dari Firebase
        setIsAdmin(user.uid === ADMIN_UID);
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = { id: user.uid, ...userDoc.data() } as User;
          setMe(userData); // Simpan ke local storage
          setLocalUser(userData);
        } else {
          clearUserSession();
          setLocalUser(null);
        }
      } else {
        setIsAdmin(false);
        clearUserSession();
        setLocalUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user: firebaseUser,
    localUser,
    isAdmin, 
    loading, 
    refreshLocalUser
  };
}