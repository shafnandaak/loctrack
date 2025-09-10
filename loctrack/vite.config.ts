import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080, // Anda bisa menggunakan port ini atau 5173
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      // Hapus alias untuk "@shared" jika folder "shared" sudah tidak ada
      // "@shared": path.resolve(__dirname, "./shared"), 
    },
  },
});