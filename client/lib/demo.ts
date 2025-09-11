// client/lib/demo.ts

import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase"; // Pastikan path ini benar
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

// Daftar kecamatan di Tasikmalaya
const kecamatanTasikmalaya = [
  "Bungursari", "Cibeureum", "Purbaratu", "Indihiang", "Kawalu", 
  "Mangkubumi", "Tamansari", "Cihideung", "Tawang", "Cipedes"
];

// Fungsi utama untuk membuat data demo
export async function generateDemoDataFirebase() {
  console.log("Membuat data demo untuk Firebase...");
  const batch = writeBatch(db);
  const usersRef = collection(db, "users");

  const demoUsers: Omit<User, 'id'>[] = [
    { name: "Andi Saputra", kecamatan: "Cihideung", color: "#10b981" },
    { name: "Budi Santoso", kecamatan: "Tawang", color: "#06b6d4" },
    { name: "Citra Lestari", kecamatan: "Indihiang", color: "#f59e0b" },
    { name: "Dewi Anggraini", kecamatan: "Kawalu", color: "#ef4444" },
    { name: "Eko Prasetyo", kecamatan: "Mangkubumi", color: "#8b5cf6" },
  ];
  
  // Tambahkan 5 user acak lainnya
  for (let i = 0; i < 5; i++) {
    const randomKecamatan = kecamatanTasikmalaya[Math.floor(Math.random() * kecamatanTasikmalaya.length)];
    demoUsers.push({
        name: `Pengguna Acak ${i + 1}`,
        kecamatan: randomKecamatan,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    });
  }


  demoUsers.forEach(user => {
    const userId = randomString(10); // ID pengguna acak
    const userDocRef = doc(usersRef, userId);
    batch.set(userDocRef, { ...user, id: userId });
  });

  try {
    await batch.commit();
    console.log("Data demo berhasil dibuat di Firestore.");
  } catch (error) {
    console.error("Gagal membuat data demo:", error);
    throw new Error("Tidak dapat membuat data demo di Firebase.");
  }
}