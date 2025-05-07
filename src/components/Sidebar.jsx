import React from 'react';
// Ya no importamos AdPlaceholder

function Sidebar({ currentPage, navigateTo, closeMobileMenu, userEmail, session }) {

  // Estructura de menú con grupos lógicos
  const menuGroups = [
    { title: 'Principal', items: [ { name: 'Dashboard', emoji: '📊' }, { name: 'Transacciones', emoji: '🔄' }, { name: 'Calendario', emoji: '🗓️' }, ] },
    { title: 'Planificación', items: [ { name: 'Presupuestos', emoji: '🎯' }, { name: 'Objetivos', emoji: '🏆' }, { name: 'Recurring', emoji: '🔁' }, { name: 'Deudas', emoji: '💳' }, ] },
    { title: 'Gestión', items: [ { name: 'Categorías', emoji: '🏷️' }, { name: 'Carteras', emoji: '💰' }, ] },
    { title: 'Herramientas', items: [ { name: 'Informes', emoji: '📄' }, { name: 'Graficos', emoji: '📈' }, { name: 'Importar', emoji: '📥' }, ] },
  ];
  const accountItems = [ { name: 'Perfil', emoji: '👤' }, { name: 'Configuracion', emoji: '⚙️' }, { name: 'Salir', emoji: '🚪' }, ];

  const handleLinkClick = (pageName) => { navigateTo(pageName); };

  return (
    // Contenedor principal
    <aside className="w-full h-full bg-gray-900 text-gray-300 flex flex-col shadow-lg overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center p-4 flex-shrink-0 border-b border-gray-700/50">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        {closeMobileMenu && (
          <button onClick={closeMobileMenu} className="text-gray-400 hover:text-white md:hidden" aria-label="Cerrar menú">
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> </svg>
          </button>
        )}
      </div>

      {/* Contenido scrollable (Menú) */}
      <div className="flex-1 overflow-y-auto p-2">
          <nav className="mb-4">
            {menuGroups.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-gray-700' : 'pt-2'}>
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

          {/* Footer: Email y Botones de Cuenta (SIN ANUNCIO) */}
          <div className="pt-4 border-t border-gray-700 pb-4">
            {/* SE ELIMINÓ EL DIV QUE CONTENÍA AdPlaceholder */}
            {userEmail && ( <div className="px-3 py-2 mb-2 text-xs text-gray-400 truncate" title={userEmail}> Conectado como: <br/> <span className="font-medium text-gray-300">{userEmail}</span> </div> )}
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
      </div> {/* Fin del div scrollable */}

    </aside>
  );
}

export default Sidebar;
