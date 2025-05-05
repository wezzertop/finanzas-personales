import React, { useState } from 'react'; // Importa useState
import Sidebar from './components/Sidebar';
import Transacciones from './pages/Transacciones';

function App() {
  // Estado para controlar la visibilidad del menú móvil
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-800 relative overflow-x-hidden"> {/* overflow-x-hidden para evitar scroll horizontal por la transición */}

      {/* Sidebar para Desktop (visible desde 'md') */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar para Móvil (posición fija, controlado por estado) */}
      {/* Clases para transición: transform, duration, ease */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         {/* Pasamos la función para cerrar desde dentro del sidebar */}
         <Sidebar closeMobileMenu={toggleMobileSidebar} />
      </div>

      {/* Overlay para cerrar menú móvil al hacer clic fuera */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}


      {/* Área de Contenido Principal */}
      <div className="flex-grow overflow-auto w-full">
         {/* Botón Hamburguesa (visible solo en móvil) */}
         <div className="sticky top-0 z-10 bg-gray-900 md:hidden px-4 py-3 flex items-center"> {/* Header móvil */}
            <button
                onClick={toggleMobileSidebar}
                className="text-gray-300 hover:text-white focus:outline-none"
                aria-label="Abrir menú"
            >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <h1 className="ml-4 text-lg font-semibold text-white">Finanzas</h1> {/* Título en móvil */}
         </div>

        <main className="p-4 md:p-6">
          <Transacciones />
        </main>
      </div>
    </div>
  );
}

export default App;
