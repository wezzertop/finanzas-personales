import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import Transacciones from './pages/Transacciones';
import Carteras from './pages/Carteras';
import AuthPage from './pages/AuthPage';
import Categorias from './pages/Categorias';
import Calendario from './pages/Calendario'; // Importa la página de Calendario

// Placeholders para páginas restantes
const Dashboard = () => <div className="text-white p-6 bg-gray-900 rounded-lg shadow-lg">Página de Dashboard (Pendiente)</div>;
const Graficos = () => <div className="text-white p-6 bg-gray-900 rounded-lg shadow-lg">Página de Gráficos (Pendiente)</div>;

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('Transacciones'); // Página inicial
  const [session, setSession] = useState(null); // Almacena la sesión del usuario
  const [loadingSession, setLoadingSession] = useState(true); // Indica si se está cargando la sesión

  // Efecto para manejar el estado de autenticación
  useEffect(() => {
    // Obtiene la sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoadingSession(false); // Termina la carga inicial
    });

    // Escucha cambios (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("Auth event:", _event, newSession);
        setSession(newSession);
         // Redirige al iniciar o cerrar sesión (opcional)
         if (_event === 'SIGNED_IN') {
             setCurrentPage('Dashboard'); // O la página que prefieras después del login
         }
         if (_event === 'SIGNED_OUT') {
             // Al cerrar sesión, onAuthStateChange pone session a null
             // y el componente se re-renderizará mostrando AuthPage.
             console.log("Sesión cerrada detectada por listener.");
         }
      }
    );

    // Limpieza: desuscribirse del listener al desmontar
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Se ejecuta solo al montar el componente

  // Función para mostrar/ocultar menú móvil
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Función para navegar entre páginas
  const navigateTo = (page) => {
     // Manejo especial para el botón 'Salir'
     if (page === 'Salir') {
         handleLogout(); // Llama a la función de logout
         return; // Detiene la navegación normal
     }
    setCurrentPage(page);
    setIsMobileSidebarOpen(false); // Cierra menú móvil
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
      setIsMobileSidebarOpen(false); // Cierra menú si está abierto
      console.log("[handleLogout] Intentando cerrar sesión...");
      try {
          // Intenta refrescar antes por si acaso
          await supabase.auth.refreshSession();
          console.log("[handleLogout] Refresh intentado (puede o no haber sido necesario).");
          // Llama a signOut
          const { error } = await supabase.auth.signOut();
          if (error) { throw error; }
          console.log("[handleLogout] Comando signOut llamado exitosamente.");
      } catch (error) {
          console.error('[handleLogout] Error durante el proceso de logout:', error);
          alert(`Error al cerrar sesión: ${error.message}`);
      }
  };


  // Determina qué componente de página renderizar
  const renderCurrentPage = () => {
    // Si no hay sesión (incluso después de cargar), muestra AuthPage
    if (!session) {
        // Este caso no debería ocurrir si loadingSession es false, pero es una salvaguarda
         console.warn("[renderCurrentPage] Renderizando AuthPage porque no hay sesión.");
        return <AuthPage />;
    }
    // Pasamos la sesión a cada página para que puedan acceder al user_id
    switch (currentPage) {
      case 'Transacciones': return <Transacciones session={session} />;
      case 'Carteras': return <Carteras session={session} />;
      case 'Categorías': return <Categorias session={session} />;
      case 'Calendario': return <Calendario session={session} />; // Añadido caso Calendario
      case 'Dashboard': return <Dashboard session={session} />;
      case 'Graficos': return <Graficos session={session} />;
      default: return <Transacciones session={session} />; // Página por defecto
    }
  };

  // Muestra indicador mientras se verifica la sesión
  if (loadingSession) {
      return <div className="min-h-screen bg-gray-800 flex items-center justify-center text-white">Cargando sesión...</div>;
  }

  // Si no hay sesión (después de cargar), muestra la página de autenticación
  if (!session) {
    return <AuthPage />;
  }

  // Si hay sesión, muestra la aplicación principal
  return (
    <div className="flex min-h-screen bg-gray-800 relative overflow-x-hidden">
      {/* Sidebar Escritorio */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <Sidebar currentPage={currentPage} navigateTo={navigateTo} userEmail={session?.user?.email} />
      </div>
      {/* Sidebar Móvil */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar currentPage={currentPage} navigateTo={navigateTo} closeMobileMenu={toggleMobileSidebar} userEmail={session?.user?.email} />
      </div>
      {/* Overlay Móvil */}
      {isMobileSidebarOpen && ( <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={toggleMobileSidebar} aria-hidden="true"></div> )}
      {/* Contenido Principal */}
      <div className="flex-grow overflow-auto w-full">
         {/* Header Móvil */}
         <div className="sticky top-0 z-10 bg-gray-900 md:hidden px-4 py-3 flex items-center">
            <button onClick={toggleMobileSidebar} className="text-gray-300 hover:text-white focus:outline-none" aria-label="Abrir menú">
                {/* Icono SVG Hamburguesa */}
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {/* Título de la página actual en móvil */}
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
