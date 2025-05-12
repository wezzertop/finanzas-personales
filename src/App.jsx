// Archivo: src/App.jsx
import React, { useState, useEffect, useCallback } from 'react'; // <--- useCallback AÑADIDO AQUÍ
import { supabase } from './lib/supabaseClient'; // Cliente Supabase
import Sidebar from './components/Sidebar'; // Componente de la barra lateral
import AuthPage from './pages/AuthPage'; // Página de autenticación

// Importación de todas las páginas principales de la aplicación
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import Carteras from './pages/Carteras';
import Categorias from './pages/Categorias';
import Calendario from './pages/Calendario';
import Graficos from './pages/Graficos';
import Configuracion from './pages/Configuracion';
import Presupuestos from './pages/Presupuestos';
import Recurring from './pages/Recurring';
import Objetivos from './pages/Objetivos';
import Importar from './pages/Importar';
import Informes from './pages/Informes';
import Perfil from './pages/Perfil';
import Debts from './pages/Debts';
import Inversiones from './pages/Inversiones';
import ProgresoLogrosPage from './pages/ProgresoLogrosPage'; // Página de Gamificación

function App() {
  // Estado para controlar la visibilidad del menú lateral en móviles
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Estado para saber qué página mostrar, inicia en Dashboard si está logueado
  const [currentPage, setCurrentPage] = useState('Dashboard');
  // Estado para almacenar la información de la sesión del usuario
  const [session, setSession] = useState(null);
  // Estado para indicar si se está cargando la información inicial de la sesión
  const [loadingSession, setLoadingSession] = useState(true);
  // Estado para pasar parámetros entre navegaciones (ej. ID de transacción a editar)
  const [navigationState, setNavigationState] = useState(null);

  // Efecto para manejar el estado de autenticación al cargar la app y cuando cambia
  useEffect(() => {
    // Obtiene la sesión actual al iniciar la aplicación
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession); // Guarda la sesión (puede ser null)
      if (initialSession) {
        setCurrentPage('Dashboard'); // Si hay sesión, empieza en Dashboard
      } else {
        // Si no hay sesión, AuthPage se mostrará por el renderizado condicional.
        setCurrentPage('Dashboard'); 
      }
      setLoadingSession(false); // Marca que la carga inicial de sesión terminó
    });

    // Escucha los eventos de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("Auth event:", _event, newSession); 
        setSession(newSession); 

        if (_event === 'SIGNED_IN') {
          if (currentPage === 'AuthPage' || !currentPage) { 
             setCurrentPage('Dashboard');
          }
          setNavigationState(null); 
        }
        
        if (_event === 'SIGNED_OUT') {
          setCurrentPage('Dashboard'); 
          setNavigationState(null); 
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // currentPage fue removido de las dependencias para evitar re-ejecuciones no deseadas por cambio de página

  // Función para abrir/cerrar el menú lateral en móviles
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Función para navegar entre páginas, ahora acepta un estado opcional
  const navigateTo = (page, state = null) => {
    if (page === 'Salir') {
      handleLogout();
      return;
    }
    console.log(`[App.jsx] Navegando a ${page} con estado:`, state);
    setNavigationState(state); 
    setCurrentPage(page);     
    setIsMobileSidebarOpen(false); 
  };

  // Función para cerrar la sesión del usuario
  const handleLogout = async () => {
    setIsMobileSidebarOpen(false); 
    console.log("[App.jsx] Intentando cerrar sesión...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) { throw error; }
      console.log("[App.jsx] Comando signOut llamado exitosamente.");
    } catch (error) {
      console.error('[App.jsx] Error durante el proceso de logout:', error);
      alert(`Error al cerrar sesión: ${error.message}`);
    }
  };

  // Función para limpiar el estado de navegación después de que la página destino lo haya consumido
  const clearNavigationState = useCallback(() => { // <--- USO DE useCallback
    console.log("[App.jsx] Limpiando navigationState.");
    setNavigationState(null);
  }, []); // No tiene dependencias, se crea una vez

  // Función que decide qué componente de página renderizar
  const renderCurrentPage = () => {
    if (!session) {
      return null; 
    }

    const pageProps = { session, navigateTo };

    switch (currentPage) {
      case 'Transacciones':
        return <Transacciones 
                  {...pageProps} 
                  initialNavigationState={navigationState} 
                  clearNavigationState={clearNavigationState} 
                />;
      case 'Carteras': return <Carteras {...pageProps} />;
      case 'Categorías': return <Categorias {...pageProps} />;
      case 'Calendario': return <Calendario {...pageProps} />;
      case 'Dashboard': return <Dashboard {...pageProps} />;
      case 'Graficos': return <Graficos {...pageProps} />;
      case 'Configuracion': return <Configuracion {...pageProps} />;
      case 'Presupuestos': return <Presupuestos {...pageProps} />;
      case 'Recurring': return <Recurring {...pageProps} />;
      case 'Objetivos': return <Objetivos {...pageProps} />;
      case 'Importar': return <Importar {...pageProps} />;
      case 'Informes': return <Informes {...pageProps} />;
      case 'Perfil': return <Perfil {...pageProps} />;
      case 'Debts': return <Debts {...pageProps} />;
      case 'Inversiones': return <Inversiones {...pageProps} />;
      case 'ProgresoLogros': return <ProgresoLogrosPage {...pageProps} />;
      default:
        console.warn(`[App.jsx] Página desconocida: ${currentPage}. Redirigiendo a Dashboard.`);
        return <Dashboard {...pageProps} />;
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center text-white text-lg">
        <span role="img" aria-label="Cargando" className="animate-spin text-2xl mr-3">⏳</span>
        Cargando sesión...
      </div>
    );
  }

  return (
    <>
      {!session ? (
        <AuthPage />
      ) : (
        <div className="flex min-h-screen bg-gray-800 relative overflow-x-hidden">
          <>
            <div className="hidden md:flex md:w-64 md:flex-shrink-0">
              <Sidebar
                currentPage={currentPage}
                navigateTo={navigateTo}
                userEmail={session?.user?.email}
                session={session} 
              />
            </div>
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
               <Sidebar
                 currentPage={currentPage}
                 navigateTo={navigateTo}
                 closeMobileMenu={toggleMobileSidebar} 
                 userEmail={session?.user?.email}
                 session={session}
               />
            </div>
            {isMobileSidebarOpen && ( <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={toggleMobileSidebar} aria-hidden="true"></div> )}
          </>
          
          <div className="flex-grow overflow-y-auto w-full">
             <div className="sticky top-0 z-10 bg-gray-900 md:hidden px-4 py-3 flex items-center shadow">
                <button onClick={toggleMobileSidebar} className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500" aria-label="Abrir menú">
                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <h1 className="ml-4 text-lg font-semibold text-white">
                  {currentPage === 'ProgresoLogros' ? 'Progreso y Logros' : currentPage}
                </h1>
             </div>
            <main className="p-4 md:p-6">
              {renderCurrentPage()}
            </main>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
