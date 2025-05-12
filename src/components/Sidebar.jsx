// Archivo: src/components/Sidebar.jsx
import React from 'react';
import NotificationBell from './NotificationBell';
import { useGamificacion } from '../context/GamificacionContext';
// Importamos iconos específicos de Lucide para consistencia, si se decide usarlos en lugar de emojis.
// Por ahora, mantenemos los emojis para simplicidad y el look actual.
// Si quisiéramos usar Lucide para todo:
// import { LayoutDashboard, ArrowRightLeft, CalendarDays, Target, Trophy, Repeat, CreditCard, TrendingUp, Tag, Wallet, FileText, BarChartBig, Download, Medal, User, Settings, LogOut, X } from 'lucide-react';
import { LuStar, LuShield, LuX } from 'react-icons/lu'; // Usamos LuX para el botón de cerrar

function Sidebar({ currentPage, navigateTo, closeMobileMenu, userEmail, session }) {
  const { nivel, xp, nombreNivel, loadingGamificacion } = useGamificacion();

  // Definición de los items del menú
  // Podríamos mapear los emojis a iconos de Lucide si quisiéramos un look más uniforme.
  const menuGroups = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', emoji: '📊' /* icon: LayoutDashboard */ },
        { name: 'Transacciones', emoji: '🔄' /* icon: ArrowRightLeft */ },
        { name: 'Calendario', emoji: '🗓️' /* icon: CalendarDays */ },
      ]
    },
    {
      title: 'Planificación',
      items: [
        { name: 'Presupuestos', emoji: '🎯' /* icon: Target */ },
        { name: 'Objetivos', emoji: '🏆' /* icon: Trophy */ },
        { name: 'Recurring', emoji: '🔁' /* icon: Repeat */ },
        { name: 'Debts', emoji: '💳' /* icon: CreditCard */ },
        { name: 'Inversiones', emoji: '📈' /* icon: TrendingUp */ },
      ]
    },
    {
      title: 'Gestión',
      items: [
        { name: 'Categorías', emoji: '🏷️' /* icon: Tag */ },
        { name: 'Carteras', emoji: '💰' /* icon: Wallet */ },
      ]
    },
    {
      title: 'Herramientas',
      items: [
        { name: 'Informes', emoji: '📄' /* icon: FileText */ },
        { name: 'Graficos', emoji: '📊' /* icon: BarChartBig */ }, // Podría ser PieChart o similar
        { name: 'Importar', emoji: '📥' /* icon: Download */ },
        { name: 'ProgresoLogros', emoji: '🏅' /* icon: Medal */ },
      ]
    },
  ];

  const accountItems = [
    { name: 'Perfil', emoji: '👤' /* icon: User */ },
    { name: 'Configuracion', emoji: '⚙️' /* icon: Settings */ },
    { name: 'Salir', emoji: '🚪' /* icon: LogOut */ },
  ];

  const handleLinkClick = (pageName) => {
    navigateTo(pageName);
    if (closeMobileMenu) { // Si la función existe (estamos en móvil), ciérralo
      closeMobileMenu();
    }
  };

  // Clases base para los items del menú
  const baseLinkClasses = "flex items-center w-full px-3 py-2.5 rounded-lg transition-colors duration-150 text-left text-sm relative group";
  const activeLinkClasses = "bg-brand-accent-primary/20 text-brand-accent-primary font-semibold shadow-inner"; // Usando color de acento con opacidad
  const inactiveLinkClasses = "text-slate-300 hover:bg-slate-700 hover:text-slate-100";
  const iconWrapperClasses = "mr-3 w-5 h-5 flex items-center justify-center text-lg text-slate-400 group-hover:text-slate-200 transition-colors";
  const activeIconWrapperClasses = "text-brand-accent-primary";


  return (
    // El fondo bg-slate-800 ya se aplica desde App.jsx
    <aside className="w-full h-full flex flex-col">
      {/* Encabezado del Sidebar */}
      <div className="flex justify-between items-center p-4 flex-shrink-0 border-b border-slate-700">
        <h1 id="mobile-sidebar-title" className="text-2xl font-bold text-white">Finanzas</h1>
        <div className="flex items-center gap-x-3">
          {session && <NotificationBell session={session} navigateTo={navigateTo} />}
          {/* Botón de cerrar solo para el menú móvil, si closeMobileMenu está definido */}
          {closeMobileMenu && (
            <button
              onClick={closeMobileMenu}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Cerrar menú"
            >
              <LuX className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenedor principal del menú con scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title || `group-${groupIndex}`} className={groupIndex > 0 ? 'mt-3 pt-3 border-t border-slate-700' : 'pt-1'}>
            {group.title && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <ul>
              {group.items.map((item) => {
                const displayName = item.name === 'ProgresoLogros' ? 'Progreso y Logros' : item.name;
                const isActive = currentPage === item.name;
                // const IconComponent = item.icon; // Para usar iconos de Lucide

                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleLinkClick(item.name)}
                      className={`${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Indicador de item activo */}
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-brand-accent-primary rounded-r-md"></span>}
                      
                      {/* Contenedor del icono/emoji */}
                      <span className={`${iconWrapperClasses} ${isActive ? activeIconWrapperClasses : ''}`}>
                        {/* {IconComponent ? <IconComponent size={18} /> : item.emoji} */}
                        {item.emoji}
                      </span>
                      <span>{displayName}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Pie del Sidebar: Información de Usuario y Gamificación */}
      <div className="p-3 border-t border-slate-700 flex-shrink-0 space-y-3">
        {!loadingGamificacion && session && (
          <div className="px-2 py-2.5 bg-slate-700/50 rounded-lg space-y-1.5">
            <div className="flex items-center text-xs text-indigo-300" title={`Nivel ${nivel}: ${nombreNivel}`}>
              <LuShield className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0" />
              <span className="truncate">Nivel {nivel}: {nombreNivel}</span>
            </div>
            <div className="flex items-center text-xs text-yellow-400" title={`${xp.toLocaleString()} Puntos de Experiencia`}>
              <LuStar className="w-4 h-4 mr-2 text-yellow-400 flex-shrink-0" />
              <span className="truncate">XP: {xp.toLocaleString()}</span>
            </div>
          </div>
        )}

        {userEmail && (
          <div className="px-2 py-1.5 text-xs text-slate-400 truncate min-w-0" title={userEmail}>
            Conectado: <span className="font-medium text-slate-300">{userEmail}</span>
          </div>
        )}
        
        {/* Menú de Cuenta */}
        <ul className="space-y-1">
          {accountItems.map((item) => {
            const isActive = currentPage === item.name;
            // const IconComponent = item.icon;
            return (
              <li key={item.name}>
                <button
                  onClick={() => handleLinkClick(item.name)}
                  className={`${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-brand-accent-primary rounded-r-md"></span>}
                  <span className={`${iconWrapperClasses} ${isActive ? activeIconWrapperClasses : ''}`}>
                    {/* {IconComponent ? <IconComponent size={18} /> : item.emoji} */}
                    {item.emoji}
                  </span>
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
