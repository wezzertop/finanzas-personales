import React from 'react';
import { LuPencil, LuTrash2 } from "react-icons/lu"; // Mantenemos iconos aquí por ahora

function TransactionItem({ transaccion, onEdit, onDelete }) {

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return 'N/A';
    try {
      if (typeof fechaIso === 'string' && fechaIso.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return fechaIso;
      }
      const fecha = new Date(fechaIso);
      const year = fecha.getFullYear();
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const day = fecha.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return 'Inválida';
    }
  };

   const formatearMoneda = (monto) => {
    if (typeof monto !== 'number') return 'N/A';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
   };

  const colorMonto = transaccion.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400';

  // Accedemos a los nombres a través de los objetos anidados
  // Usamos optional chaining (?.) por si la relación es NULL
  const nombreCategoria = transaccion.categoria?.nombre || 'N/A';
  const nombreCartera = transaccion.cartera?.nombre || 'N/A';

  return (
    <tr className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
      <td className={`px-5 py-3 font-medium whitespace-nowrap ${colorMonto}`}>
         {transaccion.tipo === 'Ingreso' ? '+' : '-'} {formatearMoneda(Math.abs(transaccion.monto))}
      </td>
      <td className="px-5 py-3 text-gray-300">
        {transaccion.descripcion}
        <div className="text-xs text-gray-500 sm:hidden">
             {transaccion.tipo}
        </div>
      </td>
      <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
        {transaccion.tipo}
      </td>
      <td className="px-5 py-3 text-gray-400 hidden md:table-cell">
        {nombreCategoria} {/* Mostrar nombre obtenido del join */}
      </td>
      <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">
        {nombreCartera} {/* Mostrar nombre obtenido del join */}
      </td>
      <td className="px-5 py-3 text-gray-400 hidden md:table-cell">
        {formatearFecha(transaccion.fecha || transaccion.fecha_creacion)}
      </td>
      <td className="px-5 py-3 text-center whitespace-nowrap">
        <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => onEdit(transaccion)}
              className="p-1.5 text-yellow-400 hover:text-yellow-300 bg-gray-700 hover:bg-gray-500 rounded transition duration-150 ease-in-out"
              aria-label={`Editar ${transaccion.descripcion}`}
            >
              <LuPencil className="w-4 h-4"/>
            </button>
            <button
              onClick={() => onDelete(transaccion.id)}
              className="p-1.5 text-red-500 hover:text-red-400 bg-gray-700 hover:bg-gray-500 rounded transition duration-150 ease-in-out"
              aria-label={`Eliminar ${transaccion.descripcion}`}
            >
              <LuTrash2 className="w-4 h-4"/>
            </button>
        </div>
      </td>
    </tr>
  );
}

export default TransactionItem;
