import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Importa el proveedor de configuración
import { SettingsProvider } from './context/SettingsContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envuelve App con el proveedor */}
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>,
)
