import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Pastikan tidak ada '.tsx' di sini

import './global.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);