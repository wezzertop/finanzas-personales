// Archivo: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { GamificacionProvider } from './context/GamificacionContext.jsx'; // <--- IMPORTAR

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <GamificacionProvider> {/* <--- ENVOLVER AQUÍ */}
        <App />
      </GamificacionProvider>
    </SettingsProvider>
  </React.StrictMode>,
);
