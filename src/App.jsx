import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
// Importar todas las páginas creadas
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import Carteras from './pages/Carteras';
import Categorias from './pages/Categorias';
import Calendario from './pages/Calendario';
import Graficos from './pages/Graficos';
import Configuracion from './pages/Configuracion';
import Presupuestos from './pages/Presupuestos';
import Recurring from './pages/Recurring'; // Importa Recurring

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Inicia en Dashboard si está logueado
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [session, setSession] = useState(null); // Almacena la sesión del usuario
  const [loadingSession, setLoadingSession] = useState(true); // Indica si se está cargando la sesión

  // Efecto para manejar el estado de autenticación
  useEffect(() => {
    // Obtiene la sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      // Establece la página inicial basada en si hay sesión
      if (initialSession) {
          setCurrentPage('Dashboard');
      } else {
          // Si no hay sesión, no importa la página, mostrará AuthPage
          setCurrentPage('Transacciones'); // O cualquier default
      }
      setLoadingSession(false); // Termina la carga inicial
    });

    // Escucha cambios (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("Auth event:", _event, newSession);
        setSession(newSession);
         // Redirige al iniciar o cerrar sesión
         if (_event === 'SIGNED_IN') {
             setCurrentPage('Dashboard');
         }
         if (_event === 'SIGNED_OUT') {
             // Cuando cierra sesión, session se vuelve null,
             // el render condicional mostrará AuthPage.
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
          console.log("[handleLogout] Refresh intentado.");
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
    // Esta verificación es redundante si la lógica principal funciona, pero segura.
    if (!session) {
         console.warn("[renderCurrentPage] No hay sesión, no se renderiza página de app.");
        return <AuthPage />;
    }
    // Pasamos la sesión a cada página
    switch (currentPage) {
      case 'Transacciones': return <Transacciones session={session} />;
      case 'Carteras': return <Carteras session={session} />;
      case 'Categorías': return <Categorias session={session} />;
      case 'Calendario': return <Calendario session={session} />;
      case 'Dashboard': return <Dashboard session={session} />;
      case 'Graficos': return <Graficos session={session} />;
      case 'Configuracion': return <Configuracion session={session} />;
      case 'Presupuestos': return <Presupuestos session={session} />;
      case 'Recurring': return <Recurring session={session} />; // Añadido caso Recurring
      default: return <Dashboard session={session} />; // Dashboard como página por defecto si está logueado
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
      {session && ( // Renderiza Sidebar solo si hay sesión
        <div className="hidden md:flex md:w-64 md:flex-shrink-0">
          {/* Pasamos session al Sidebar por si necesita datos del usuario en futuro */}
          <Sidebar currentPage={currentPage} navigateTo={navigateTo} userEmail={session?.user?.email} session={session} />
        </div>
      )}
      {/* Sidebar Móvil */}
      {session && ( // Renderiza Sidebar solo si hay sesión
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           <Sidebar currentPage={currentPage} navigateTo={navigateTo} closeMobileMenu={toggleMobileSidebar} userEmail={session?.user?.email} session={session} />
        </div>
      )}
      {/* Overlay Móvil */}
      {session && isMobileSidebarOpen && ( <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={toggleMobileSidebar} aria-hidden="true"></div> )}
      {/* Contenido Principal */}
      <div className="flex-grow overflow-auto w-full">
         {/* Header Móvil (Solo si hay sesión) */}
         {session && (
           <div className="sticky top-0 z-10 bg-gray-900 md:hidden px-4 py-3 flex items-center">
              <button onClick={toggleMobileSidebar} className="text-gray-300 hover:text-white focus:outline-none" aria-label="Abrir menú">
                  {/* Icono SVG Hamburguesa */}
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              {/* Título de la página actual en móvil */}
              <h1 className="ml-4 text-lg font-semibold text-white">{currentPage}</h1>
           </div>
         )}
        {/* Renderiza la página actual (o AuthPage si no hay sesión) */}
        <main className="p-4 md:p-6">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
