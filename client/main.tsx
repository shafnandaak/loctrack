import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Impor komponen App yang sudah kita ekspor
import './global.css'; // Muat semua styling

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);