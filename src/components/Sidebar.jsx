import React from 'react';
import AdPlaceholder from './AdPlaceholder'; // Importar Placeholder para anuncio

function Sidebar({ currentPage, navigateTo, closeMobileMenu, userEmail, session }) {

  // Estructura de menú con grupos lógicos
  const menuGroups = [
    { title: 'Principal', items: [ { name: 'Dashboard', emoji: '📊' }, { name: 'Transacciones', emoji: '🔄' }, { name: 'Calendario', emoji: '🗓️' }, ] },
    { title: 'Planificación', items: [ { name: 'Presupuestos', emoji: '🎯' }, { name: 'Objetivos', emoji: '🏆' }, { name: 'Recurring', emoji: '🔁' }, { name: 'Deudas', emoji: '💳' }, ] },
    { title: 'Gestión', items: [ { name: 'Categorías', emoji: '🏷️' }, { name: 'Carteras', emoji: '💰' }, ] },
    { title: 'Herramientas', items: [ { name: 'Informes', emoji: '📄' }, { name: 'Graficos', emoji: '📈' }, { name: 'Importar', emoji: '📥' }, ] },
  ];

  // Elementos de cuenta separados para poner al final
   const accountItems = [
       { name: 'Perfil', emoji: '👤' },
       { name: 'Configuracion', emoji: '⚙️' },
       { name: 'Salir', emoji: '🚪' }, // El botón de Salir
   ];


  // Función para manejar clics en los elementos del menú
  const handleLinkClick = (pageName) => {
    navigateTo(pageName);
  };

  return (
    // Contenedor principal: flex-col y h-full para ocupar toda la altura disponible
    <aside className="w-full h-full bg-gray-900 text-gray-300 flex flex-col shadow-lg">
      {/* Header: No se encoge */}
      <div className="flex justify-between items-center p-4 mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        {closeMobileMenu && (
          <button onClick={closeMobileMenu} className="text-gray-400 hover:text-white md:hidden" aria-label="Cerrar menú">
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> </svg>
          </button>
        )}
      </div>

      {/* Navegación Principal: Crece y permite scroll interno */}
      <nav className="flex-grow overflow-y-auto px-2 mb-4"> {/* Scroll SÓLO en esta sección */}
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-gray-700' : ''}>
            {group.title && ( <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"> {group.title} </h3> )}
            <ul>
              {group.items.map((item) => {
                const isActive = currentPage === item.name;
                return (
                  <li key={item.name} className="mb-1">
                    <button onClick={() => handleLinkClick(item.name)} className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-150 text-left text-sm relative ${ isActive ? 'bg-green-600/80 text-white font-semibold shadow-inner' : 'hover:bg-gray-700/50 hover:text-white' }`} >
                      {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-r-md"></span>}
                      <span className={`mr-3 w-5 text-center text-lg ${isActive ? '' : 'opacity-75'}`} aria-hidden="true">{item.emoji}</span>
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: No se encoge, siempre visible al final */}
      <div className="px-2 pt-4 border-t border-gray-700 flex-shrink-0 pb-4">
        {/* Placeholder de Anuncio */}
        <div className="px-2 mb-4">
             <AdPlaceholder
                 slot="1763243425" // Reemplaza con tu ID de slot real
                 format="auto"
                 responsive="true"
                 className="min-h-[100px]"
             />
        </div>
        {/* Información del Usuario */}
         {userEmail && ( <div className="px-3 py-2 mb-2 text-xs text-gray-400 truncate" title={userEmail}> Conectado como: <br/> <span className="font-medium text-gray-300">{userEmail}</span> </div> )}
         {/* Botones de Cuenta */}
         <ul>
             {accountItems.map((item) => {
                 const isActive = currentPage === item.name;
                 return (
                     <li key={item.name} className="mb-1">
                         <button onClick={() => handleLinkClick(item.name)} className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-150 text-left text-sm relative ${ isActive ? 'bg-green-600/80 text-white font-semibold shadow-inner' : 'hover:bg-gray-700/50 hover:text-white' }`} >
                            {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-r-md"></span>}
                             <span className={`mr-3 w-5 text-center text-lg ${isActive ? '' : 'opacity-75'}`} aria-hidden="true">{item.emoji}</span>
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
