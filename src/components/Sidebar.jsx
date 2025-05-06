import React from 'react';

function Sidebar({ currentPage, navigateTo, closeMobileMenu, userEmail, session }) {

  const menuItems = [
    { name: 'Dashboard', emoji: '📊' },
    { name: 'Transacciones', emoji: '🔄' },
    { name: 'Recurring', emoji: '🔁' },
    { name: 'Calendario', emoji: '🗓️' },
    { name: 'Presupuestos', emoji: '🎯' },
    { name: 'Categorías', emoji: '🏷️' },
    { name: 'Graficos', emoji: '📈' },
    { name: 'Carteras', emoji: '💰' },
    { name: 'Configuracion', emoji: '⚙️' },
  ];

  const handleLinkClick = (pageName) => { navigateTo(pageName); };

  return (
    // Contenedor principal flex-col con altura completa
    <aside className="w-full h-full bg-gray-900 text-gray-300 flex flex-col p-4 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 flex-shrink-0"> {/* Evita que el header se encoja */}
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        {closeMobileMenu && (
          <button onClick={closeMobileMenu} className="text-gray-400 hover:text-white md:hidden" aria-label="Cerrar menú">
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> </svg>
          </button>
        )}
      </div>

      {/* Navegación Principal - AHORA CON SCROLL */}
      {/* flex-grow hace que ocupe el espacio, overflow-y-auto permite scroll si es necesario */}
      <nav className="flex-grow overflow-y-auto mb-4"> {/* Añadido overflow y margen inferior */}
        <ul>
          {menuItems.map((item) => (
            <li key={item.name} className="mb-3">
              <button onClick={() => handleLinkClick(item.name)} className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-200 text-left ${ currentPage === item.name ? 'bg-green-600 text-white shadow-md' : 'hover:bg-gray-700 hover:text-white' }`} >
                <span className="mr-3 w-5 text-center text-xl" aria-hidden="true">{item.emoji}</span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer: Email y Salir */}
      {/* mt-auto ya no es necesario si el nav tiene overflow */}
      <div className="pt-4 border-t border-gray-700 flex-shrink-0"> {/* Evita que el footer se encoja */}
        {userEmail && (
            <div className="px-4 py-2 mb-2 text-xs text-gray-400 truncate" title={userEmail}>
                Conectado como: <br/>
                <span className="font-medium text-gray-300">{userEmail}</span>
            </div>
        )}
        <button onClick={() => handleLinkClick('Salir')} className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-200 text-left hover:bg-gray-700 hover:text-white`} >
            <span className="mr-3 w-5 text-center text-xl" aria-hidden="true">🚪</span>
            <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
