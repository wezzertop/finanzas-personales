// Archivo: src/components/TransactionItem.jsx

import React from 'react';

function TransactionItem({ transaccion, onEdit, onDelete }) {
  // Función para formatear la fecha (puedes mejorarla con librerías como date-fns)
  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return 'N/A';
    try {
      const fecha = new Date(fechaIso);
      // Formato simple: DD/MM/YYYY
      return fecha.toLocaleDateString('es-ES', { // 'es-ES' u otro local que prefieras
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      console.error("Error formateando fecha:", e);
      return 'Fecha inválida';
    }
  };

  // Función para formatear el monto como moneda
   const formatearMoneda = (monto) => {
    if (typeof monto !== 'number') return 'N/A';
    // Puedes personalizar el locale y opciones según necesites (ej. 'en-US', currency: 'USD')
    return monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
   };

  // Determina el color basado en el tipo de transacción
  const colorMonto = transaccion.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600';

  return (
    <tr className="hover:bg-gray-50">
       {/* Fecha (oculta en móvil) */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
        {formatearFecha(transaccion.fecha_creacion)}
      </td>
      {/* Descripción */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{transaccion.descripcion}</div>
        {/* Mostramos tipo y categoría en móvil debajo de la descripción */}
        <div className="text-xs text-gray-500 md:hidden">
            {transaccion.tipo} - {transaccion.categoria}
        </div>
      </td>
      {/* Monto */}
      <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${colorMonto}`}>
        {/* Muestra símbolo + o - */}
        {transaccion.tipo === 'Ingreso' ? '+' : '-'} {formatearMoneda(Math.abs(transaccion.monto))}
      </td>
      {/* Categoría (oculta en móvil pequeño) */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
        {transaccion.categoria}
      </td>
       {/* Cartera (oculta en móvil y tablet) */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
        {transaccion.cartera}
      </td>
      {/* Acciones */}
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <button
          onClick={() => onEdit(transaccion)}
          className="text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
          aria-label={`Editar ${transaccion.descripcion}`} // Accesibilidad
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(transaccion.id)}
          className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out"
          aria-label={`Eliminar ${transaccion.descripcion}`} // Accesibilidad
        >
          Borrar
        </button>
      </td>
    </tr>
  );
}

export default TransactionItem;