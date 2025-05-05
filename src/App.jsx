import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import Transacciones from './pages/Transacciones';
import Carteras from './pages/Carteras';
import AuthPage from './pages/AuthPage';
import Categorias from './pages/Categorias';

const Dashboard = () => <div className="text-white p-6 bg-gray-900 rounded-lg shadow-lg">Página de Dashboard (Pendiente)</div>;
const Graficos = () => <div className="text-white p-6 bg-gray-900 rounded-lg shadow-lg">Página de Gráficos (Pendiente)</div>;

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('Transacciones');
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth event:", _event, session);
        setSession(session);
         if (_event === 'SIGNED_IN') {
             setCurrentPage('Dashboard');
         }
         if (_event === 'SIGNED_OUT') {
             setCurrentPage('Transacciones');
         }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const navigateTo = (page) => {
     if (page === 'Salir') {
         handleLogout();
         return;
     }
    setCurrentPage(page);
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
      setIsMobileSidebarOpen(false);
      const { error } = await supabase.auth.signOut();
      if (error) {
          console.error('Error al cerrar sesión:', error);
      } else {
          console.log("Sesión cerrada");
      }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'Transacciones': return <Transacciones session={session} />;
      case 'Carteras': return <Carteras session={session} />;
      case 'Categorías': return <Categorias session={session} />;
      case 'Dashboard': return <Dashboard session={session} />;
      case 'Graficos': return <Graficos session={session} />;
      default: return <Transacciones session={session} />;
    }
  };

  if (loadingSession) {
      return <div className="min-h-screen bg-gray-800 flex items-center justify-center text-white">Cargando sesión...</div>;
  }

  if (!session) {
    return <AuthPage />;
  }

  // Si hay sesión, muestra la aplicación principal
  return (
    <div className="flex min-h-screen bg-gray-800 relative overflow-x-hidden">
      {/* Sidebar Escritorio: Pasamos userEmail */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <Sidebar
          currentPage={currentPage}
          navigateTo={navigateTo}
          userEmail={session?.user?.email} // <--- NUEVO
        />
      </div>
      {/* Sidebar Móvil: Pasamos userEmail */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar
           currentPage={currentPage}
           navigateTo={navigateTo}
           closeMobileMenu={toggleMobileSidebar}
           userEmail={session?.user?.email} // <--- NUEVO
         />
      </div>
      {/* Overlay Móvil */}
      {isMobileSidebarOpen && ( <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={toggleMobileSidebar} aria-hidden="true"></div> )}
      {/* Contenido Principal */}
      <div className="flex-grow overflow-auto w-full">
         {/* Header Móvil */}
         <div className="sticky top-0 z-10 bg-gray-900 md:hidden px-4 py-3 flex items-center">
            <button onClick={toggleMobileSidebar} className="text-gray-300 hover:text-white focus:outline-none" aria-label="Abrir menú">
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="ml-4 text-lg font-semibold text-white">{currentPage}</h1>
         </div>
        {/* Renderiza la página actual */}
        <main className="p-4 md:p-6">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
