// Archivo: src/components/Sidebar.jsx
import React from 'react';
import NotificationBell from './NotificationBell';
import { useGamificacion } from '../context/GamificacionContext'; // <--- NUEVA IMPORTACIÓN
import { LuStar, LuShield } from 'react-icons/lu'; // Iconos para XP y Nivel

function Sidebar({ currentPage, navigateTo, closeMobileMenu, userEmail, session }) {
  // Usar el hook de gamificación para obtener el estado del usuario
  const { nivel, xp, nombreNivel, loadingGamificacion } = useGamificacion();

  const menuGroups = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', emoji: '📊' },
        { name: 'Transacciones', emoji: '🔄' },
        { name: 'Calendario', emoji: '🗓️' },
      ]
    },
    {
      title: 'Planificación',
      items: [
        { name: 'Presupuestos', emoji: '🎯' },
        { name: 'Objetivos', emoji: '🏆' },
        { name: 'Recurring', emoji: '🔁' },
        { name: 'Debts', emoji: '💳' },
        { name: 'Inversiones', emoji: '📈' },
      ]
    },
    {
      title: 'Gestión',
      items: [
        { name: 'Categorías', emoji: '🏷️' },
        { name: 'Carteras', emoji: '💰' },
      ]
    },
    {
      title: 'Herramientas',
      items: [
        { name: 'Informes', emoji: '📄' },
        { name: 'Graficos', emoji: '📊' },
        { name: 'Importar', emoji: '📥' },
        { name: 'ProgresoLogros', emoji: '🏅' }, // <--- NUEVO ITEM DE MENÚ (usar 'ProgresoLogros' como 'name')
      ]
    },
  ];
  const accountItems = [
    { name: 'Perfil', emoji: '👤' },
    { name: 'Configuracion', emoji: '⚙️' },
    { name: 'Salir', emoji: '🚪' },
  ];

  const handleLinkClick = (pageName) => {
    navigateTo(pageName);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <aside className="w-full h-full bg-gray-900 text-gray-300 flex flex-col shadow-lg">
      <div className="flex justify-between items-center p-4 flex-shrink-0 border-b border-gray-700/50">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <div className="flex items-center gap-x-2">
          {session && <NotificationBell session={session} navigateTo={navigateTo} />}
          {closeMobileMenu && (
            <button
              onClick={closeMobileMenu}
              className="text-gray-400 hover:text-white md:hidden p-1 rounded-md hover:bg-gray-700"
              aria-label="Cerrar menú"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <nav className="mb-4">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.title || `group-${groupIndex}`} className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-gray-700' : 'pt-2'}>
              {group.title && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <ul>
                {group.items.map((item) => {
                  // Renombrar 'ProgresoLogros' a 'Progreso y Logros' para mostrar en UI
                  const displayName = item.name === 'ProgresoLogros' ? 'Progreso y Logros' : item.name;
                  const isActive = currentPage === item.name;
                  return (
                    <li key={item.name} className="mb-1">
                      <button
                        onClick={() => handleLinkClick(item.name)}
                        className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-150 text-left text-sm relative ${
                          isActive ? 'bg-green-600/80 text-white font-semibold shadow-inner' : 'hover:bg-gray-700/50 hover:text-white'
                        }`}
                      >
                        {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-r-md"></span>}
                        <span className={`mr-3 w-5 text-center text-lg ${isActive ? '' : 'opacity-75'}`} aria-hidden="true">{item.emoji}</span>
                        <span>{displayName}</span> {/* Usar displayName */}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-700 pb-4">
          {/* Información de Gamificación */}
          {!loadingGamificacion && session && (
            <div className="px-3 py-2 mb-3 space-y-1">
              <div className="flex items-center text-sm text-indigo-300" title={`Nivel ${nivel}: ${nombreNivel}`}>
                <LuShield className="w-4 h-4 mr-2 text-indigo-400" />
                <span>Nivel: {nivel} ({nombreNivel})</span>
              </div>
              <div className="flex items-center text-sm text-yellow-300" title={`${xp.toLocaleString()} Puntos de Experiencia`}>
                <LuStar className="w-4 h-4 mr-2 text-yellow-400" />
                <span>XP: {xp.toLocaleString()}</span>
              </div>
            </div>
          )}

          {userEmail && (
            <div className="px-3 py-2 mb-2 text-xs text-gray-400 truncate min-w-0" title={userEmail}>
              Conectado como: <br/>
              <span className="font-medium text-gray-300">{userEmail}</span>
            </div>
          )}
           <ul>
               {accountItems.map((item) => {
                   const isActive = currentPage === item.name;
                   return (
                       <li key={item.name} className="mb-1">
                           <button
                             onClick={() => handleLinkClick(item.name)}
                             className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-150 text-left text-sm relative ${
                               isActive ? 'bg-green-600/80 text-white font-semibold shadow-inner' : 'hover:bg-gray-700/50 hover:text-white'
                             }`}
                           >
                              {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-r-md"></span>}
                               <span className={`mr-3 w-5 text-center text-lg ${isActive ? '' : 'opacity-75'}`} aria-hidden="true">{item.emoji}</span>
                               <span>{item.name}</span>
                           </button>
                       </li>
                   );
               })}
           </ul>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
