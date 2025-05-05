// Archivo: src/components/TransactionList.jsx

import React from 'react';
import TransactionItem from './TransactionItem'; // Importaremos el componente para cada fila

function TransactionList({ transacciones, onEdit, onDelete }) {

  // Si no hay transacciones, podríamos mostrar un mensaje aquí también,
  // pero ya lo hacemos en la página principal.
  if (!transacciones || transacciones.length === 0) {
    return null; // No renderiza nada si la lista está vacía
  }

  return (
    <div className="overflow-x-auto"> {/* Permite scroll horizontal en pantallas pequeñas */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {/* Ocultamos columnas en móviles para simplificar */}
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Fecha
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Monto
            </th>
             <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Categoría
            </th>
             <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Cartera
            </th>
            <th scope="col" className="relative px-4 py-3">
              <span className="sr-only">Acciones</span> {/* Accesibilidad */}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transacciones.map((transaccion) => (
            // Usamos el ID como key, fundamental para listas en React
            <TransactionItem
              key={transaccion.id}
              transaccion={transaccion}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;