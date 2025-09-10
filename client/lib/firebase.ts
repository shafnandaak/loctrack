// client/lib/firebase.ts

// Import fungsi yang kita butuhkan dari Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration (ini sudah benar)
const firebaseConfig = {
  apiKey: "AIzaSyCtWlMgajb_u3jcQujX7M0H-c4gpMk_M6Q",
  authDomain: "nans-project-7362d.firebaseapp.com",
  projectId: "nans-project-7362d",
  storageBucket: "nans-project-7362d.appspot.com",
  messagingSenderId: "526490169989",
  appId: "1:526490169989:web:b19d15473e7763a7262fec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi dan ekspor layanan Firebase agar bisa digunakan di file lain
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();