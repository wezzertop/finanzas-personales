import React from 'react';

// Recibe la función para cerrar como prop
function Sidebar({ closeMobileMenu }) {
  const activeItem = 'Transacciones';

  const menuItems = [
    { name: 'Dashboard', emoji: '📊' },
    { name: 'Transacciones', emoji: '🔄' },
    { name: 'Categorías', emoji: '🏷️' },
    { name: 'Gráficos', emoji: '📈' },
    { name: 'Carteras', emoji: '💰' },
    { name: 'Salir', emoji: '🚪', isBottom: true },
  ];

  // Función para manejar clics en enlaces (cierra el menú en móvil)
  const handleLinkClick = () => {
    if (closeMobileMenu) { // Solo llama si la función existe (estamos en móvil)
      closeMobileMenu();
    }
    // Aquí iría la lógica de navegación real si usaras un router
  };


  return (
    <aside className="w-full h-full bg-gray-900 text-gray-300 flex flex-col p-4 shadow-lg"> {/* w-full/h-full para ocupar el contenedor fijo */}
      {/* Encabezado con Título y Botón de Cierre (visible en móvil) */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        {/* Botón de cierre solo visible en pantallas menores a 'md' */}
        {closeMobileMenu && ( // Mostrar solo si la prop existe
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

      <nav className="flex-grow">
        <ul>
          {menuItems.filter(item => !item.isBottom).map((item) => (
            <li key={item.name} className="mb-3">
              <a
                href="#"
                onClick={handleLinkClick} // Cierra menú al hacer clic
                className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeItem === item.name
                    ? 'bg-green-600 text-white shadow-md'
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3 w-5 text-center text-xl" aria-hidden="true">{item.emoji}</span>
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav>
        <ul>
         {menuItems.filter(item => item.isBottom).map((item) => (
            <li key={item.name} className="mb-3">
              <a
                href="#"
                onClick={handleLinkClick} // Cierra menú al hacer clic
                className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeItem === item.name
                    ? 'bg-green-600 text-white shadow-md'
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3 w-5 text-center text-xl" aria-hidden="true">{item.emoji}</span>
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
