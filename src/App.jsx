import React from 'react';
import Sidebar from './components/Sidebar';
import Transacciones from './pages/Transacciones';

function App() {
  return (
    // Contenedor principal flexible
    <div className="flex min-h-screen bg-gray-800">
      {/* Barra lateral: Oculta por defecto (hidden), visible como flex container desde 'md' */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <Sidebar />
      </div>
      {/* Contenido principal: Crece para ocupar espacio, ocupa todo el ancho si sidebar está oculta */}
      <div className="flex-grow overflow-auto w-full">
        {/* Padding responsivo: p-4 en pequeño, p-6 desde 'md' */}
        <main className="p-4 md:p-6">
          <Transacciones />
        </main>
      </div>
    </div>
  );
}

export default App;
