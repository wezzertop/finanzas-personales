// Archivo: src/components/TransactionList.jsx
import React from 'react';
import TransactionItem from './TransactionItem'; // Asegúrate que la ruta sea correcta

function TransactionList({ transacciones, onEdit, onDelete }) {
  if (!transacciones || transacciones.length === 0) {
    // No renderizar nada si no hay transacciones,
    // el mensaje de "No hay transacciones" se maneja en la página padre (Transacciones.jsx)
    return null;
  }

  // Clases para las cabeceras de la tabla
  const tableHeaderClasses = "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";

  return (
    <div className="overflow-x-auto shadow-md rounded-lg border border-slate-700 bg-slate-800">
      <table className="w-full min-w-max text-sm text-left text-slate-300">
        <thead className="bg-slate-700/50">
          <tr>
            <th scope="col" className={`${tableHeaderClasses} w-1/6 sm:w-auto`}>
              Monto
            </th>
            <th scope="col" className={`${tableHeaderClasses} w-2/5 sm:w-auto`}>
              Descripción
            </th>
            <th scope="col" className={`${tableHeaderClasses} hidden sm:table-cell text-center w-1/12 sm:w-auto`}>
              Tipo
            </th>
            <th scope="col" className={`${tableHeaderClasses} hidden md:table-cell w-1/6 sm:w-auto`}>
              Categoría
            </th>
            <th scope="col" className={`${tableHeaderClasses} hidden lg:table-cell w-1/6 sm:w-auto`}>
              Cartera
            </th>
            <th scope="col" className={`${tableHeaderClasses} hidden md:table-cell text-center w-1/12 sm:w-auto`}>
              Fecha
            </th>
            <th scope="col" className={`${tableHeaderClasses} text-center w-1/12 sm:w-auto`}>
              Acciones
            </th>
          </tr>
        </thead>
        {/* El cuerpo de la tabla se renderiza con TransactionItem */}
        {/* La división de filas se maneja dentro de TransactionItem con border-b */}
        <tbody className="divide-y divide-slate-700">
          {transacciones.map((transaccion) => (
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
