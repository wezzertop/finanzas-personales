import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; // Cliente Supabase
import Sidebar from './components/Sidebar'; // Barra lateral
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
import Recurring from './pages/Recurring'; // Transacciones Recurrentes
import Objetivos from './pages/Objetivos'; // Objetivos de Ahorro
import Importar from './pages/Importar';   // Importar CSV
import Informes from './pages/Informes';   // Informes
import Perfil from './pages/Perfil';     // Perfil de Usuario
import Debts from './pages/Debts';       // Deudas

function App() {
  // Estado para controlar la visibilidad del menú lateral en móviles
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Estado para saber qué página mostrar, inicia en Dashboard si está logueado
  const [currentPage, setCurrentPage] = useState('Dashboard');
  // Estado para almacenar la información de la sesión del usuario (null si no está logueado)
  const [session, setSession] = useState(null);
  // Estado para indicar si se está cargando la información inicial de la sesión
  const [loadingSession, setLoadingSession] = useState(true);

  // Efecto para manejar el estado de autenticación al cargar y al cambiar
  useEffect(() => {
    // Obtiene la sesión actual al iniciar la aplicación
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession); // Guarda la sesión obtenida (puede ser null)
      // Define la página inicial basada en si hay sesión o no
      if (initialSession) {
          setCurrentPage('Dashboard'); // Si hay sesión, empieza en Dashboard
      } else {
          // Si no hay sesión, no importa la página, mostrará AuthPage
          setCurrentPage('Transacciones'); // O cualquier default
      }
      setLoadingSession(false); // Marca que la carga inicial terminó
    });

    // Escucha los eventos de autenticación (inicio de sesión, cierre de sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("Auth event:", _event, newSession); // Log para depuración
        setSession(newSession); // Actualiza el estado de la sesión
         // Redirige automáticamente al iniciar sesión
         if (_event === 'SIGNED_IN') {
             setCurrentPage('Dashboard');
         }
         // Al cerrar sesión (SIGNED_OUT), session se vuelve null,
         // y el renderizado condicional mostrará AuthPage automáticamente.
         if (_event === 'SIGNED_OUT') {
             console.log("Sesión cerrada detectada por listener.");
         }
      }
    );

    // Función de limpieza: se ejecuta cuando el componente se desmonta
    // para dejar de escuchar los eventos de autenticación
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez

  // Función para abrir/cerrar el menú lateral en móviles
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Función para navegar entre páginas
  const navigateTo = (page) => {
     // Manejo especial para la opción 'Salir'
     if (page === 'Salir') {
         handleLogout(); // Llama a la función para cerrar sesión
         return; // No actualiza currentPage directamente
     }
    setCurrentPage(page); // Actualiza la página actual
    setIsMobileSidebarOpen(false); // Cierra el menú móvil si estaba abierto
  };

  // Función para cerrar la sesión del usuario
  const handleLogout = async () => {
      setIsMobileSidebarOpen(false); // Cierra el menú móvil
      console.log("[handleLogout] Intentando cerrar sesión...");
      try {
          // Intenta refrescar la sesión antes por si acaso (puede ayudar con errores)
          await supabase.auth.refreshSession();
          console.log("[handleLogout] Refresh intentado.");
          // Llama a la función de Supabase para cerrar sesión
          const { error } = await supabase.auth.signOut();
          if (error) { throw error; } // Lanza error si falla
          console.log("[handleLogout] Comando signOut llamado exitosamente.");
      } catch (error) {
          console.error('[handleLogout] Error durante el proceso de logout:', error);
          alert(`Error al cerrar sesión: ${error.message}`); // Muestra error al usuario
      }
  };


  // Función que decide qué componente de página renderizar
  const renderCurrentPage = () => {
    // Si no hay sesión (incluso después de cargar), devuelve null aquí
    // El renderizado principal se encargará de mostrar AuthPage.
    if (!session) {
         console.warn("[renderCurrentPage] No hay sesión, devolviendo null.");
        return null;
    }
    // Pasamos la 'session' como prop a cada página
    switch (currentPage) {
      case 'Transacciones': return <Transacciones session={session} />;
      case 'Carteras': return <Carteras session={session} />;
      case 'Categorías': return <Categorias session={session} />;
      case 'Calendario': return <Calendario session={session} />;
      case 'Dashboard': return <Dashboard session={session} />;
      case 'Graficos': return <Graficos session={session} />;
      case 'Configuracion': return <Configuracion session={session} />;
      case 'Presupuestos': return <Presupuestos session={session} />;
      case 'Recurring': return <Recurring session={session} />;
      case 'Objetivos': return <Objetivos session={session} />;
      case 'Importar': return <Importar session={session} />;
      case 'Informes': return <Informes session={session} />;
      case 'Perfil': return <Perfil session={session} />;
      case 'Deudas': return <Debts session={session} />; // Incluye Deudas
      default: return <Dashboard session={session} />; // Dashboard como página por defecto si está logueado
    }
  };

  // Muestra un indicador mientras se carga la sesión inicial
  if (loadingSession) {
      return <div className="min-h-screen bg-gray-800 flex items-center justify-center text-white">Cargando sesión...</div>;
  }

  // Renderizado principal: Muestra AuthPage o el layout de la app
  return (
    <>
      {!session ? (
        // Si no hay sesión, muestra solo la página de autenticación
        <AuthPage />
      ) : (
        // Si hay sesión, muestra el layout completo de la aplicación
        <div className="flex min-h-screen bg-gray-800 relative overflow-x-hidden">
          {/* Renderiza Sidebars y Overlay solo si hay sesión */}
          {session && (
            <>
              {/* Sidebar Escritorio (oculto en móvil) */}
              <div className="hidden md:flex md:w-64 md:flex-shrink-0">
                <Sidebar
                  currentPage={currentPage}
                  navigateTo={navigateTo}
                  userEmail={session?.user?.email}
                  session={session} // Pasar sesión por si Sidebar la necesita
                />
              </div>
              {/* Sidebar Móvil (controlado por estado) */}
              <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <Sidebar
                   currentPage={currentPage}
                   navigateTo={navigateTo}
                   closeMobileMenu={toggleMobileSidebar} // Función para cerrar desde dentro
                   userEmail={session?.user?.email}
                   session={session}
                 />
              </div>
              {/* Overlay para cerrar menú móvil */}
              {isMobileSidebarOpen && ( <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={toggleMobileSidebar} aria-hidden="true"></div> )}
            </>
          )}

          {/* Contenido Principal */}
          <div className="flex-grow overflow-auto w-full">
             {/* Header Móvil (Solo si hay sesión) */}
             {session && (
               <div className="sticky top-0 z-10 bg-gray-900 md:hidden px-4 py-3 flex items-center">
                  {/* Botón Hamburguesa */}
                  <button onClick={toggleMobileSidebar} className="text-gray-300 hover:text-white focus:outline-none" aria-label="Abrir menú">
                      <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  {/* Título de la página actual */}
                  <h1 className="ml-4 text-lg font-semibold text-white">{currentPage}</h1>
               </div>
             )}
            {/* Renderiza la página actual (o AuthPage si no hay sesión) */}
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
