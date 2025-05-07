import React from 'react';
import AdPlaceholder from './AdPlaceholder'; // Importar Placeholder para anuncio

function Sidebar({ currentPage, navigateTo, closeMobileMenu, userEmail, session }) {

  // Estructura de menú con grupos lógicos
  const menuGroups = [
    {
      title: 'Principal', // Título de la sección
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
        { name: 'Recurring', emoji: '🔁' }, // Transacciones Recurrentes
        { name: 'Deudas', emoji: '💳' },
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
        { name: 'Graficos', emoji: '📈' },
        { name: 'Importar', emoji: '📥' },
      ]
    },
  ];

  // Elementos de cuenta separados para poner al final
   const accountItems = [
       { name: 'Perfil', emoji: '👤' },
       { name: 'Configuracion', emoji: '⚙️' },
       { name: 'Salir', emoji: '🚪' }, // El botón de Salir
   ];


  // Función para manejar clics en los elementos del menú
  const handleLinkClick = (pageName) => {
    // Llama a la función navigateTo pasada desde App.jsx
    // navigateTo se encarga de cambiar la página y cerrar el menú móvil
    navigateTo(pageName);
  };

  return (
    // Contenedor principal de la barra lateral, ocupa toda la altura
    <aside className="w-full h-full bg-gray-900 text-gray-300 flex flex-col shadow-lg">
      {/* Header con título y botón de cierre móvil */}
      <div className="flex justify-between items-center p-4 mb-4 flex-shrink-0"> {/* flex-shrink-0 evita que se encoja */}
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        {/* Botón de cierre solo visible en móvil (si se pasa la prop) */}
        {closeMobileMenu && (
          <button
            onClick={closeMobileMenu}
            className="text-gray-400 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            {/* Icono SVG 'X' */}
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navegación Principal - Scrollable */}
      {/* flex-grow para ocupar espacio, overflow-y-auto para scroll vertical si es necesario */}
      <nav className="flex-grow overflow-y-auto px-2 mb-4">
        {menuGroups.map((group, groupIndex) => (
          // Div para cada grupo, con separador visual
          <div key={group.title} className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-gray-700' : ''}>
            {/* Título del Grupo */}
            {group.title && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.title}
                </h3>
            )}
            {/* Lista de Items del Grupo */}
            <ul>
              {group.items.map((item) => {
                const isActive = currentPage === item.name; // Determina si es el item activo
                return (
                  <li key={item.name} className="mb-1"> {/* Espacio entre items */}
                    <button
                      onClick={() => handleLinkClick(item.name)}
                      // Clases condicionales para estilo activo/inactivo/hover
                      className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-150 text-left text-sm relative ${
                        isActive
                          ? 'bg-green-600/80 text-white font-semibold shadow-inner' // Estilo activo
                          : 'hover:bg-gray-700/50 hover:text-white' // Estilo hover
                      }`}
                    >
                      {/* Barra indicadora izquierda para item activo */}
                      {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-r-md"></span>}
                      {/* Emoji (con opacidad si inactivo) */}
                      <span className={`mr-3 w-5 text-center text-lg ${isActive ? '' : 'opacity-75'}`} aria-hidden="true">{item.emoji}</span>
                      {/* Nombre del Item */}
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: Placeholder Anuncio, Email y Botones de Cuenta */}
      <div className="px-2 pt-4 border-t border-gray-700 flex-shrink-0 pb-4"> {/* flex-shrink-0 evita que se encoja */}
        {/* Placeholder para Anuncio */}
        <div className="px-2 mb-4">
             <AdPlaceholder
                 // IMPORTANTE: Reemplaza con tu ID de slot real de AdSense
                 // Si aún no tienes uno, puedes dejar un número placeholder como "1234567890"
                 // para evitar el error del componente, pero NO mostrará anuncios reales.
                 slot="1763243425" // Usando el ID que parece tenías en el error
                 format="auto"
                 responsive="true"
                 className="min-h-[100px]" // Asegura altura mínima
             />
        </div>

        {/* Información del Usuario */}
        {userEmail && (
            <div className="px-3 py-2 mb-2 text-xs text-gray-400 truncate" title={userEmail}>
                Conectado como: <br/>
                <span className="font-medium text-gray-300">{userEmail}</span>
            </div>
        )}
        {/* Botones de Cuenta (Perfil, Config, Salir) */}
         <ul>
             {accountItems.map((item) => {
                 const isActive = currentPage === item.name;
                 return (
                     <li key={item.name} className="mb-1">
                         <button onClick={() => handleLinkClick(item.name)} className={`flex items-center w-full px-3 py-2 rounded-md transition-colors duration-150 text-left text-sm relative ${ isActive ? 'bg-green-600/80 text-white font-semibold shadow-inner' : 'hover:bg-gray-700/50 hover:text-white' }`} >
                            {/* Barra indicadora */}
                            {isActive && <span className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-r-md"></span>}
                             {/* Emoji */}
                             <span className={`mr-3 w-5 text-center text-lg ${isActive ? '' : 'opacity-75'}`} aria-hidden="true">{item.emoji}</span>
                             {/* Nombre */}
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
