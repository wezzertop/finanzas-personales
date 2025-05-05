import React from 'react';
import TransactionItem from './TransactionItem';

function TransactionList({ transacciones, onEdit, onDelete }) {

  if (!transacciones || transacciones.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
          <tr>
            <th scope="col" className="px-5 py-3">
              Monto
            </th>
            <th scope="col" className="px-5 py-3">
              Descripción
            </th>
            <th scope="col" className="px-5 py-3 hidden sm:table-cell">
              Tipo
            </th>
             <th scope="col" className="px-5 py-3 hidden md:table-cell">
              Categoría
            </th>
             <th scope="col" className="px-5 py-3 hidden lg:table-cell">
              Cartera
            </th>
             <th scope="col" className="px-5 py-3 hidden md:table-cell">
              Fecha
            </th>
            <th scope="col" className="px-5 py-3 text-center">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
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
