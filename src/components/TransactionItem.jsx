import React, { useCallback } from 'react';
import { LuPencil, LuTrash2, LuArrowRightLeft, LuListTree } from "react-icons/lu"; // Iconos necesarios
import { useSettings } from '../context/SettingsContext'; // Hook para configuración (moneda)

function TransactionItem({ transaccion, onEdit, onDelete }) {
  // Obtener moneda y estado de carga del contexto
  const { currency, loadingSettings } = useSettings();

  // Formateador de fecha (formato YYYY-MM-DD)
  const formatearFecha = (fechaIso) => {
      if (!fechaIso) return 'N/A'; // Si no hay fecha
      try {
          // Si ya está en formato YYYY-MM-DD, devolverlo
          if (typeof fechaIso === 'string' && fechaIso.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return fechaIso;
          }
          // Si no, intentar convertir (usar toLocaleDateString para formato local seguro)
          const d = new Date(fechaIso);
          // Verificar si la fecha es válida
          if (isNaN(d.getTime())) return 'Inválida';
          return d.toLocaleDateString('sv-SE'); // sv-SE da formato YYYY-MM-DD
      } catch (e) {
          console.error("Error formateando fecha:", fechaIso, e);
          return 'Inválida'; // Devuelve 'Inválida' en caso de error
      }
  };

  // Formateador de moneda usando el contexto (envuelto en useCallback para optimización)
  const formatearMoneda = useCallback((monto) => {
    // Mostrar placeholder si carga la configuración o el monto no es válido
    if (loadingSettings || typeof monto !== 'number') return '---';
    return monto.toLocaleString('es-MX', { // Locale base, la moneda la define 'currency'
        style: 'currency',
        currency: currency, // Moneda del contexto
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
  }, [currency, loadingSettings]); // Dependencias: moneda y estado de carga

  // --- Determinar Estilos y Textos basados en el Tipo de Transacción ---
  let colorMonto = 'text-gray-300'; // Color por defecto
  let signo = ''; // Signo +/-
  let displayTipo = transaccion.tipo; // Texto para la columna Tipo

  if (transaccion.tipo === 'Ingreso') {
    colorMonto = 'text-green-400';
    signo = '+';
  } else if (transaccion.tipo === 'Egreso') {
    colorMonto = 'text-red-400';
    signo = '-';
  } else if (transaccion.tipo === 'Transferencia') {
    colorMonto = 'text-blue-400'; // Color distintivo para transferencias
    signo = ''; // Las transferencias no suelen llevar signo explícito en el monto total
    displayTipo = 'Transf.'; // Abreviatura
  }

  // Obtener nombres relacionados usando encadenamiento opcional (?.) por si son null
  const nombreCategoria = transaccion.categoria?.nombre || 'N/A';
  const nombreCartera = transaccion.cartera?.nombre; // Cartera principal (Ingreso/Egreso)
  const nombreCarteraOrigen = transaccion.cartera_origen?.nombre; // Origen (Transferencia)
  const nombreCarteraDestino = transaccion.cartera_destino?.nombre; // Destino (Transferencia)

  // Definir texto principal y secundario para la celda de descripción
  const textoPrincipal = transaccion.descripcion || (transaccion.tipo === 'Transferencia' ? `Transferencia` : 'Sin descripción');
  const textoSecundario = transaccion.is_split // Si está dividida...
                            ? `Dividido (${transaccion.splits?.length || 0} cat.)` // ...mostrar "Dividido"
                            : (transaccion.tipo === 'Transferencia'
                                ? `${nombreCarteraOrigen || '?'} → ${nombreCarteraDestino || '?'}` // ...o detalle de transferencia...
                                : nombreCategoria); // ...o la categoría normal.

  // Determinar qué cartera mostrar en su columna
  const carteraMostrada = transaccion.tipo === 'Transferencia' ? '-' : (nombreCartera || 'N/A');

  // Obtener tags (asegurarse de que sea un array)
  const tags = Array.isArray(transaccion.tags) ? transaccion.tags : [];

  // Crear tooltip con detalles de los splits si existen
  const splitDetailsTooltip = transaccion.is_split && transaccion.splits?.length > 0
    ? transaccion.splits.map(s => `${s.categoria?.nombre || '?'}: ${formatearMoneda(s.monto)}`).join('\n') // Une detalles con salto de línea
    : '';

  // --- Renderizado del Componente (Fila de la Tabla) ---
  return (
    <tr className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
      {/* Columna Monto */}
      <td className={`px-5 py-3 font-medium whitespace-nowrap ${colorMonto}`}>
         {signo} {formatearMoneda(Math.abs(transaccion.monto))}
      </td>
      {/* Columna Descripción (incluye detalles secundarios y tags) */}
      <td className="px-5 py-3 text-gray-300">
        <div className="font-medium truncate" title={textoPrincipal}>{textoPrincipal}</div>
        <div className="text-xs text-gray-500 truncate flex items-center" title={transaccion.is_split ? splitDetailsTooltip : textoSecundario}>
            {/* Icono si está dividido */}
            {transaccion.is_split && <LuListTree className="w-3 h-3 mr-1 text-yellow-400 flex-shrink-0" title="Transacción Dividida"/>}
            {textoSecundario}
        </div>
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
      {/* Columna Tipo (visible desde 'sm') */}
      <td className="px-5 py-3 text-gray-400 hidden sm:table-cell text-center">
        {transaccion.tipo === 'Transferencia'
            ? <LuArrowRightLeft className="inline-block text-blue-400 mx-auto" title="Transferencia"/> // Icono para Transferencia
            : displayTipo // Texto para Ingreso/Egreso
        }
      </td>
       {/* Columna Categoría (visible desde 'md', oculta para Transferencia/Split) */}
      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
        {transaccion.tipo !== 'Transferencia' && !transaccion.is_split ? nombreCategoria : '-'}
      </td>
       {/* Columna Cartera (visible desde 'lg', muestra '-' para Transferencia) */}
      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
        {carteraMostrada}
      </td>
      {/* Columna Fecha (visible desde 'md') */}
      <td className="px-4 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap">
        {formatearFecha(transaccion.fecha || transaccion.fecha_creacion)}
      </td>
      {/* Columna Acciones */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className="flex justify-center items-center space-x-2">
            {/* Botón Editar */}
            <button
              onClick={() => onEdit(transaccion)} // Llama a la función pasada por props
              className="p-1.5 text-yellow-400 hover:text-yellow-300 bg-gray-700 hover:bg-gray-500 rounded transition duration-150 ease-in-out"
              aria-label={`Editar ${textoPrincipal}`}
            >
              <LuPencil className="w-4 h-4"/>
            </button>
            {/* Botón Eliminar */}
            <button
              onClick={() => onDelete(transaccion.id)} // Llama a la función pasada por props
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
