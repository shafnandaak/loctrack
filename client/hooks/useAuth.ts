import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getMe, setMe, onLogout as clearUserSession, User } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';

// =======================================================================
// PENTING: Ganti nilai di bawah ini dengan UID admin Anda dari Firebase.
// =======================================================================
const ADMIN_UID = "0KEk8d4731eWADpxdpsT7exWO1A3"; 

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ambil user dari Firestore, update localStorage dan state
  const fetchAndSetUser = useCallback(async (user: FirebaseAuthUser) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = { id: user.uid, ...userDoc.data() } as User;
      setMe(userData);
      setLocalUser(userData);
      setIsAdmin(user.uid === ADMIN_UID);
    } else {
      clearUserSession();
      setLocalUser(null);
      setIsAdmin(false);
    }
  }, []);

  // Untuk manual refresh dari komponen
  const refreshLocalUser = useCallback(async () => {
    const current = auth.currentUser;
    if (current) {
      await fetchAndSetUser(current);
    } else {
      clearUserSession();
      setLocalUser(null);
      setIsAdmin(false);
    }
  }, [fetchAndSetUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchAndSetUser(user);
      } else {
        clearUserSession();
        setLocalUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchAndSetUser]);

  return { 
    user: firebaseUser,
    localUser,
    isAdmin, 
    loading, 
    refreshLocalUser
  };
}