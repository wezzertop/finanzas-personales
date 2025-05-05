// Archivo: src/components/Sidebar.jsx
import React from 'react';

// Ya no necesitamos importar react-icons

function Sidebar() {
  // Define el elemento activo (esto podría ser dinámico más adelante)
  const activeItem = 'Transacciones';

  // Define los elementos del menú usando emojis
  const menuItems = [
    { name: 'Dashboard', emoji: '📊' },
    { name: 'Transacciones', emoji: '🔄' },
    { name: 'Categorías', emoji: '🏷️' },
    { name: 'Gráficos', emoji: '📈' },
    { name: 'Carteras', emoji: '💰' },
    { name: 'Salir', emoji: '🚪', isBottom: true }, // Elemento al final
  ];

  return (
    // Contenedor principal de la barra lateral
    <aside className="w-64 min-h-screen bg-gray-900 text-gray-300 flex flex-col p-4 shadow-lg">
      {/* Sección del título o logo */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
      </div>

      {/* Navegación principal */}
      <nav className="flex-grow">
        <ul>
          {/* Mapea los elementos del menú que no van al final */}
          {menuItems.filter(item => !item.isBottom).map((item) => (
            <li key={item.name} className="mb-3">
              <a
                href="#" // Enlace temporal
                className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeItem === item.name
                    ? 'bg-green-600 text-white shadow-md' // Estilo si está activo
                    : 'hover:bg-gray-700 hover:text-white' // Estilo al pasar el ratón
                }`}
              >
                {/* Renderiza el emoji dentro de un span para controlar el espaciado */}
                <span className="mr-3 w-5 text-center text-xl" aria-hidden="true">{item.emoji}</span>
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Navegación inferior (elementos como Salir) */}
      <nav>
        <ul>
          {/* Mapea los elementos del menú que van al final */}
          {menuItems.filter(item => item.isBottom).map((item) => (
            <li key={item.name} className="mb-3">
              <a
                href="#" // Enlace temporal
                className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeItem === item.name
                    ? 'bg-green-600 text-white shadow-md' // Estilo si está activo
                    : 'hover:bg-gray-700 hover:text-white' // Estilo al pasar el ratón
                }`}
              >
                {/* Renderiza el emoji dentro de un span */}
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
