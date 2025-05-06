import React, { useCallback } from 'react';
import { LuPencil, LuTrash2, LuArrowRightLeft } from "react-icons/lu"; // Iconos
import { useSettings } from '../context/SettingsContext'; // Hook de configuración

function TransactionItem({ transaccion, onEdit, onDelete }) {
  // Obtener moneda y estado de carga del contexto
  const { currency, loadingSettings } = useSettings();

  // Formateador de fecha (YYYY-MM-DD)
  const formatearFecha = (fechaIso) => {
      if (!fechaIso) return 'N/A';
      try {
          // Si ya está en formato YYYY-MM-DD, devolverlo
          if (typeof fechaIso === 'string' && fechaIso.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return fechaIso;
          }
          // Si no, intentar convertir desde otros formatos (JS Date lo maneja)
          // Usar toLocaleDateString('sv-SE') para asegurar YYYY-MM-DD
          const d = new Date(fechaIso);
          // Verificar si la fecha es válida antes de formatear
          if (isNaN(d.getTime())) return 'Inválida';
          return d.toLocaleDateString('sv-SE');
      } catch (e) {
          console.error("Error formateando fecha:", fechaIso, e);
          return 'Inválida';
      }
  };


  // Formateador de moneda usando el contexto
  const formatearMoneda = useCallback((monto) => {
    // Mostrar placeholder si carga la configuración o el monto no es válido
    if (loadingSettings || typeof monto !== 'number') return '---';
    return monto.toLocaleString('es-MX', { // Puedes ajustar locale si es necesario
        style: 'currency',
        currency: currency, // Moneda del contexto
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
  }, [currency, loadingSettings]); // Depende de la moneda y su estado de carga

  // Determinar colores y textos según el tipo de transacción
  let colorMonto = 'text-gray-300'; // Default
  let signo = '';
  let displayTipo = transaccion.tipo; // Nombre completo por defecto

  if (transaccion.tipo === 'Ingreso') {
    colorMonto = 'text-green-400';
    signo = '+';
  } else if (transaccion.tipo === 'Egreso') {
    colorMonto = 'text-red-400';
    signo = '-';
  } else if (transaccion.tipo === 'Transferencia') {
    colorMonto = 'text-blue-400'; // Color azul para transferencias
    signo = ''; // Sin signo explícito
    displayTipo = 'Transf.'; // Abreviatura para la columna Tipo
  }

  // Obtener nombres relacionados usando encadenamiento opcional (?.)
  const nombreCategoria = transaccion.categoria?.nombre || 'N/A';
  const nombreCartera = transaccion.cartera?.nombre; // Cartera principal (Ingreso/Egreso)
  const nombreCarteraOrigen = transaccion.cartera_origen?.nombre; // Origen (Transferencia)
  const nombreCarteraDestino = transaccion.cartera_destino?.nombre; // Destino (Transferencia)

  // Construir textos descriptivos
  const textoPrincipal = transaccion.descripcion || (transaccion.tipo === 'Transferencia' ? `Transferencia` : 'Sin descripción');
  // El texto secundario muestra la categoría o el detalle de la transferencia
  const textoSecundario = transaccion.tipo === 'Transferencia'
    ? `${nombreCarteraOrigen || '?'} → ${nombreCarteraDestino || '?'}` // Detalle Origen -> Destino
    : nombreCategoria; // Nombre de categoría para Ingreso/Egreso
  // Determinar qué cartera mostrar en la columna Cartera
  const carteraMostrada = transaccion.tipo === 'Transferencia' ? '-' : (nombreCartera || 'N/A');

  // Obtener tags (asegurarse de que sea un array)
  const tags = Array.isArray(transaccion.tags) ? transaccion.tags : [];

  return (
    <tr className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
      {/* Monto */}
      <td className={`px-5 py-3 font-medium whitespace-nowrap ${colorMonto}`}>
         {signo} {formatearMoneda(Math.abs(transaccion.monto))}
      </td>
      {/* Descripción, Categoría/Transferencia y Tags */}
      <td className="px-5 py-3 text-gray-300">
        <div className="font-medium truncate" title={textoPrincipal}>{textoPrincipal}</div>
        <div className="text-xs text-gray-500 truncate" title={textoSecundario}>{textoSecundario}</div>
        {/* Mostrar Tags si existen */}
        {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                    <span key={index} className="px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-[10px] whitespace-nowrap">
                        #{tag} {/* Añade '#' antes del tag */}
                    </span>
                ))}
            </div>
        )}
      </td>
      {/* Tipo (Abreviado o Icono) */}
      <td className="px-5 py-3 text-gray-400 hidden sm:table-cell text-center">
        {transaccion.tipo === 'Transferencia'
            ? <LuArrowRightLeft className="inline-block text-blue-400 mx-auto" title="Transferencia"/>
            : displayTipo
        }
      </td>
       {/* Categoría (Oculta para Transferencia) */}
      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
        {transaccion.tipo !== 'Transferencia' ? nombreCategoria : '-'}
      </td>
       {/* Cartera (Muestra la principal o '-' para transferencia) */}
      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
        {carteraMostrada}
      </td>
      {/* Fecha */}
      <td className="px-4 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap">
        {formatearFecha(transaccion.fecha || transaccion.fecha_creacion)}
      </td>
      {/* Acciones */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className="flex justify-center items-center space-x-2">
            {/* Botón Editar */}
            <button
              onClick={() => onEdit(transaccion)}
              className="p-1.5 text-yellow-400 hover:text-yellow-300 bg-gray-700 hover:bg-gray-500 rounded transition duration-150 ease-in-out"
              aria-label={`Editar ${textoPrincipal}`}
            >
              <LuPencil className="w-4 h-4"/>
            </button>
            {/* Botón Eliminar */}
            <button
              onClick={() => onDelete(transaccion.id)}
              className="p-1.5 text-red-500 hover:text-red-400 bg-gray-700 hover:bg-gray-500 rounded transition duration-150 ease-in-out"
              aria-label={`Eliminar ${textoPrincipal}`}
            >
              <LuTrash2 className="w-4 h-4"/>
            </button>
        </div>
      </td>
    </tr>
  );
}

export default TransactionItem;
