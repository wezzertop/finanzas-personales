import React from 'react';

// Recibe userEmail como nueva prop
function Sidebar({ currentPage, navigateTo, closeMobileMenu, userEmail }) {

  const menuItems = [
    { name: 'Dashboard', emoji: '📊' },
    { name: 'Transacciones', emoji: '🔄' },
    { name: 'Categorías', emoji: '🏷️' },
    { name: 'Gráficos', emoji: '📈' },
    { name: 'Carteras', emoji: '💰' },
    // Separamos Salir para poner el email antes
    // { name: 'Salir', emoji: '🚪', isBottom: true },
  ];

  const handleLinkClick = (pageName) => {
    navigateTo(pageName);
  };

  return (
    <aside className="w-full h-full bg-gray-900 text-gray-300 flex flex-col p-4 shadow-lg">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        {closeMobileMenu && (
          <button
            onClick={closeMobileMenu}
            className="text-gray-400 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Menú Principal */}
      <nav className="flex-grow">
        <ul>
          {menuItems.map((item) => ( // Ya no filtramos por isBottom aquí
            <li key={item.name} className="mb-3">
              <button
                onClick={() => handleLinkClick(item.name)}
                className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-200 text-left ${
                  currentPage === item.name
                    ? 'bg-green-600 text-white shadow-md'
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3 w-5 text-center text-xl" aria-hidden="true">{item.emoji}</span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sección Inferior: Email y Botón Salir */}
      <div className="mt-auto pt-4 border-t border-gray-700"> {/* mt-auto empuja al fondo, pt-4 y borde para separar */}
        {/* Muestra el email del usuario si existe */}
        {userEmail && (
            <div className="px-4 py-2 mb-2 text-xs text-gray-400 truncate" title={userEmail}> {/* truncate para emails largos */}
                Conectado como: <br/>
                <span className="font-medium text-gray-300">{userEmail}</span>
            </div>
        )}
        {/* Botón Salir */}
        <button
            onClick={() => handleLinkClick('Salir')}
            className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-200 text-left hover:bg-gray-700 hover:text-white`}
        >
            <span className="mr-3 w-5 text-center text-xl" aria-hidden="true">🚪</span>
            <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
