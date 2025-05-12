// Archivo: src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';

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
import ProgresoLogrosPage from './pages/ProgresoLogrosPage';

// Icono para el botón de menú móvil (Hamburguesa)
const MenuIcon = () => (
  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Icono para el spinner de carga
const LoadingSpinnerIcon = () => (
  <svg className="animate-spin h-8 w-8 text-brand-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Iniciar currentPage como null para una lógica de carga inicial más clara.
  const [currentPage, setCurrentPage] = useState(null);
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [navigationState, setNavigationState] = useState(null);

  useEffect(() => {
    setLoadingSession(true); // Asegurar que loadingSession sea true al inicio del efecto

    // 1. Cargar la sesión inicial
    supabase.auth.getSession().then(({ data: { session: fetchedSession } }) => {
      setSession(fetchedSession);
      // Si hay sesión y currentPage aún no se ha establecido (es null), ir a Dashboard.
      // Si no hay sesión, el renderizado condicional mostrará AuthPage.
      // currentPage podría ya tener un valor si se implementara persistencia o deep linking.
      if (fetchedSession && !currentPage) {
        setCurrentPage('Dashboard');
      } else if (!fetchedSession && !currentPage) {
        // Si no hay sesión y no hay página, se mostrará AuthPage.
        // Establecer 'Dashboard' aquí puede ayudar a que el título de la app no quede vacío momentáneamente.
        setCurrentPage('Dashboard');
      }
      setLoadingSession(false);
    });

    // 2. Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("[App.jsx] AuthStateChangeEvent:", _event, "New Session:", !!newSession);
        const oldSession = session; // Capturar la sesión actual (del estado de React) antes de actualizarla
        setSession(newSession); // Actualizar el estado de la sesión

        if (_event === 'SIGNED_IN') {
          // Solo redirigir a Dashboard si antes no había sesión (oldSession era null y newSession existe)
          // O si el usuario estaba explícitamente en la página de autenticación.
          if ((!oldSession && newSession) || currentPage === 'AuthPage') {
            console.log("[App.jsx] SIGNED_IN: Redirigiendo a Dashboard.");
            setCurrentPage('Dashboard');
            setNavigationState(null); // Limpiar cualquier estado de navegación previo
          }
        } else if (_event === 'SIGNED_OUT') {
          console.log("[App.jsx] SIGNED_OUT: Limpiando estado y preparando para AuthPage.");
          // Al cerrar sesión, el renderizado condicional principal se encargará de mostrar AuthPage.
          // Establecer currentPage a 'Dashboard' (o 'AuthPage') asegura que el título de la app sea consistente.
          setCurrentPage('Dashboard');
          setNavigationState(null);
        }
        // Para otros eventos como TOKEN_REFRESHED o USER_UPDATED, no cambiamos currentPage aquí.
        // La sesión se actualiza, y si eso requiere un cambio de UI (raro para estos eventos),
        // se manejará por el cambio en el estado 'session' y el renderizado condicional.
      }
    );

    return () => {
      subscription?.unsubscribe(); // Limpiar la suscripción al desmontar el componente
    };
  }, []); // Array de dependencias VACÍO: este efecto se ejecuta solo una vez al montar.

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const navigateTo = (page, state = null) => {
    if (page === 'Salir') {
      handleLogout();
      return;
    }
    // Opcional: Evitar re-render si ya estamos en la página destino con el mismo estado
    if (page === currentPage && JSON.stringify(state) === JSON.stringify(navigationState)) {
        if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
        return;
    }

    console.log(`[App.jsx] Navegando a ${page} con estado:`, state);
    setNavigationState(state);
    setCurrentPage(page); // Actualiza la página actual
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false); // Cierra el menú móvil si estaba abierto
    }
  };

  const handleLogout = async () => {
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
    console.log("[App.jsx] Intentando cerrar sesión...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) { throw error; }
      console.log("[App.jsx] Comando signOut llamado exitosamente.");
      // No es necesario setCurrentPage aquí, el listener onAuthStateChange lo manejará.
    } catch (error) {
      console.error('[App.jsx] Error durante el proceso de logout:', error);
      alert(`Error al cerrar sesión: ${error.message}`);
    }
  };

  const clearNavigationState = useCallback(() => {
    console.log("[App.jsx] Limpiando navigationState.");
    setNavigationState(null);
  }, []);

  const renderCurrentPage = () => {
    // Esta función solo se llama si hay sesión (ver renderizado principal)
    if (!session) return null;

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
      // Caso por defecto: si currentPage es null o desconocido después de la carga y con sesión,
      // podría ser Dashboard. La lógica en useEffect debería haber seteado Dashboard.
      default:
        if (currentPage) { // Solo advertir si currentPage tiene un valor inesperado
          console.warn(`[App.jsx] Página desconocida: ${currentPage}. Redirigiendo a Dashboard.`);
        }
        return <Dashboard {...pageProps} />;
    }
  };

  // Pantalla de carga mientras se verifica la sesión
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 text-lg">
        <LoadingSpinnerIcon />
        <p className="mt-3">Cargando sesión...</p>
      </div>
    );
  }

  // Renderizado principal de la aplicación
  return (
    <>
      {!session ? (
        // Si no hay sesión, mostrar la página de autenticación
        <AuthPage />
      ) : (
        // Si hay sesión, mostrar el layout principal de la aplicación
        <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden">
          {/* Sidebar para Desktop */}
          <div className="hidden md:flex md:w-64 md:flex-shrink-0 bg-slate-800 shadow-lg">
            <Sidebar
              currentPage={currentPage}
              navigateTo={navigateTo}
              userEmail={session?.user?.email}
              session={session}
            />
          </div>

          {/* Contenedor para Sidebar Móvil y Overlay */}
          <div className="md:hidden">
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
                onClick={toggleMobileSidebar}
                aria-hidden="true"
              ></div>
            )}
            <div
              className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out ${
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-sidebar-title" // Asegúrate que Sidebar tenga un h1 con este id
            >
              <Sidebar
                currentPage={currentPage}
                navigateTo={navigateTo}
                closeMobileMenu={toggleMobileSidebar}
                userEmail={session?.user?.email}
                session={session}
              />
            </div>
          </div>

          {/* Área de Contenido Principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra Superior para Móvil */}
            <header className="sticky top-0 z-20 bg-slate-800/80 backdrop-blur-md md:hidden px-4 py-3 flex items-center shadow-md">
              <button
                onClick={toggleMobileSidebar}
                className="p-2 -ml-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-label="Abrir menú de navegación"
                aria-expanded={isMobileSidebarOpen}
              >
                <MenuIcon />
              </button>
              <h1 className="ml-3 text-lg font-semibold text-slate-100 truncate">
                {/* Mostrar el nombre de la página actual, o 'Dashboard' si currentPage es null */}
                {currentPage === 'ProgresoLogros' ? 'Progreso y Logros' : (currentPage || 'Dashboard')}
              </h1>
            </header>

            {/* Contenido de la página actual */}
            <main className="main-content-area flex-1">
              {/* Renderizar la página actual. Si currentPage es null (lo cual no debería pasar aquí si hay sesión),
                  renderCurrentPage() podría ir a 'default' que es Dashboard. */}
              {renderCurrentPage()}
            </main>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
