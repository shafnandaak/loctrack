import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Pastikan tidak ada '.tsx' di sini

// --- PERBAIKAN DI SINI ---
// Kita hanya perlu mengimpor CSS secara langsung agar gayanya diterapkan
import './global.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);