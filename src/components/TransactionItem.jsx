// Archivo: src/components/TransactionItem.jsx
import React, { useCallback } from 'react';
// No necesitamos importar LuPencil, LuTrash2, etc. si usamos SVGs inline
import { useSettings } from '../context/SettingsContext';

// --- Iconos SVG Inline ---
const PencilIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const Trash2Icon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const ArrowRightLeftIcon = ({ className = "inline-block mx-auto" }) => ( // Clase para centrar si es necesario
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);
const ListTreeIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6v4c0 1.1.9 2 2 2h3"/><path d="M3 10v4c0 1.1.9 2 2 2h3"/>
  </svg>
);
const TagIcon = ({ className = "w-2.5 h-2.5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
// --- Fin Iconos SVG Inline ---

function TransactionItem({ transaccion, onEdit, onDelete }) {
  const { currency, loadingSettings } = useSettings();

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return 'N/A';
    try {
      if (typeof fechaIso === 'string' && fechaIso.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fechaIso.split('-');
        return `${day}/${month}/${year.substring(2)}`;
      }
      const d = new Date(fechaIso);
      if (isNaN(d.getTime())) return 'Inválida';
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch (e) { console.error("Error formateando fecha:", fechaIso, e); return 'Inválida'; }
  };

  const formatearMoneda = useCallback((monto) => {
    if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  let colorMonto = 'text-slate-100'; let signo = ''; let displayTipo = transaccion.tipo; let tipoIconColor = "text-slate-400";
  if (transaccion.tipo === 'Ingreso') { colorMonto = 'text-green-400 hover:text-green-300'; signo = '+ '; tipoIconColor = "text-green-500"; }
  else if (transaccion.tipo === 'Egreso') { colorMonto = 'text-red-400 hover:text-red-300'; signo = '- '; tipoIconColor = "text-red-500"; }
  else if (transaccion.tipo === 'Transferencia') { colorMonto = 'text-blue-400 hover:text-blue-300'; signo = ''; displayTipo = 'Transf.'; tipoIconColor = "text-blue-500"; }

  const nombreCategoria = transaccion.categoria?.nombre || (transaccion.is_split ? '' : 'N/A');
  const nombreCartera = transaccion.cartera?.nombre;
  const nombreCarteraOrigen = transaccion.cartera_origen?.nombre;
  const nombreCarteraDestino = transaccion.cartera_destino?.nombre;
  const textoPrincipalDescripcion = transaccion.descripcion || (transaccion.tipo === 'Transferencia' ? `Transferencia` : 'Sin descripción');
  const splitDetailsTooltip = transaccion.is_split && transaccion.splits?.length > 0 ? transaccion.splits.map(s => `${s.categoria?.nombre || '?'}: ${formatearMoneda(s.monto)}`).join(' | ') : '';
  const textoSecundarioDescripcion = transaccion.is_split ? `Dividido en ${transaccion.splits?.length || 0} cat.` : (transaccion.tipo === 'Transferencia' ? `${nombreCarteraOrigen || '?'} → ${nombreCarteraDestino || '?'}` : nombreCategoria);
  const carteraMostrada = transaccion.tipo === 'Transferencia' ? '-' : (nombreCartera || 'N/A');
  const tags = Array.isArray(transaccion.tags) ? transaccion.tags : [];
  const cellClasses = "px-4 py-3.5 whitespace-nowrap";
  const actionButtonClasses = "p-2 text-slate-400 hover:text-white rounded-md transition-colors duration-150";

  return (
    <tr className="hover:bg-slate-700/40 transition-colors duration-100">
      <td className={`${cellClasses} font-semibold ${colorMonto}`}>{signo}{formatearMoneda(Math.abs(transaccion.monto))}</td>
      <td className={`${cellClasses} max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl`}>
        <div className="font-medium text-slate-100 truncate" title={textoPrincipalDescripcion}>{textoPrincipalDescripcion}</div>
        <div className="text-xs text-slate-400 truncate flex items-center" title={transaccion.is_split ? splitDetailsTooltip : textoSecundarioDescripcion}>
          {transaccion.is_split && <ListTreeIcon className={`mr-1.5 ${tipoIconColor} flex-shrink-0`} title="Transacción Dividida"/>}
          {textoSecundarioDescripcion}
        </div>
        {tags.length > 0 && (<div className="mt-1.5 flex flex-wrap gap-1.5">{tags.map((tag, index) => (<span key={index} className="flex items-center px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-[10px] font-medium"><TagIcon className="mr-1 opacity-70"/>{tag}</span>))}</div>)}
      </td>
      <td className={`${cellClasses} hidden sm:table-cell text-center`}>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${transaccion.tipo === 'Ingreso' ? 'bg-green-500/20 text-green-300' : transaccion.tipo === 'Egreso' ? 'bg-red-500/20 text-red-300' : transaccion.tipo === 'Transferencia' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-600 text-slate-300'}`}>{displayTipo}</span>
      </td>
      <td className={`${cellClasses} hidden md:table-cell text-slate-400`}>{transaccion.tipo !== 'Transferencia' && !transaccion.is_split ? nombreCategoria : '-'}</td>
      <td className={`${cellClasses} hidden lg:table-cell text-slate-400`}>{carteraMostrada}</td>
      <td className={`${cellClasses} hidden md:table-cell text-center text-slate-400`}>{formatearFecha(transaccion.fecha || transaccion.fecha_creacion)}</td>
      <td className={`${cellClasses} text-center`}>
        <div className="flex justify-center items-center space-x-1">
          <button onClick={() => onEdit(transaccion)} className={`${actionButtonClasses} hover:bg-yellow-500/20 hover:text-yellow-400`} aria-label={`Editar ${textoPrincipalDescripcion}`} title="Editar"><PencilIcon /></button>
          <button onClick={() => onDelete(transaccion.id)} className={`${actionButtonClasses} hover:bg-red-500/20 hover:text-red-400`} aria-label={`Eliminar ${textoPrincipalDescripcion}`} title="Eliminar"><Trash2Icon /></button>
        </div>
      </td>
    </tr>
  );
}
export default TransactionItem;
