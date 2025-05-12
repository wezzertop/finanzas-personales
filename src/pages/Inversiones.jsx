// Archivo: src/pages/Inversiones.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  obtenerTiposActivo, agregarTipoActivo, editarTipoActivo, eliminarTipoActivo,
  obtenerActivosInversion, agregarActivoInversion, editarActivoInversion, eliminarActivoInversion,
  obtenerTransaccionesInversionPorActivo, agregarTransaccionInversion, editarTransaccionInversion, eliminarTransaccionInversion,
  obtenerPortafolio,
} from '../lib/inversionesApi';
import { useGamificacion } from '../context/GamificacionContext';

// --- Iconos SVG Inline ---
const TrendingUpIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
const BriefcaseIcon = ({ className = "w-5 h-5" }) => ( // Para Activos
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const TagIcon = ({ className = "w-5 h-5" }) => ( // Para Tipos de Activo
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
);
const CoinsIcon = ({ className = "w-5 h-5" }) => ( // Para Transacciones de Inversión
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82-.71-.71A6 6 0 0 1 10.34 18H4"/></svg>
);
const PieChartIcon = ({ className = "w-5 h-5" }) => ( // Para Portafolio
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);
const PlusCircleIcon = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> );
const SaveIcon = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> );
const XCircleIcon = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> );
const Edit3Icon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> );
const Trash2Icon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> );
const RefreshCwIcon = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>);
// --- Fin Iconos SVG Inline ---

const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } const d = new Date(date); if (isNaN(d.getTime())) return ''; return d.toISOString().split('T')[0]; } catch (e) { console.error("Error formateando fecha:", date, e); return ''; } };

function Inversiones({ session }) {
  const { currency, loadingSettings, supportedCurrencies } = useSettings();
  const { otorgarXP, verificarYOtorgarLogro, fetchEstadoGamificacion } = useGamificacion();

  const [vistaActiva, setVistaActiva] = useState('portafolio');
  const [cargandoGlobal, setCargandoGlobal] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [portafolio, setPortafolio] = useState([]);
  const [cargandoPortafolio, setCargandoPortafolio] = useState(false);
  const [tiposActivo, setTiposActivo] = useState([]);
  const [cargandoTipos, setCargandoTipos] = useState(false);
  const [mostrarFormTipo, setMostrarFormTipo] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);
  const [formTipo, setFormTipo] = useState({ nombre: '', descripcion: '' });
  const [activosInversion, setActivosInversion] = useState([]);
  const [cargandoActivos, setCargandoActivos] = useState(false);
  const [mostrarFormActivo, setMostrarFormActivo] = useState(false);
  const [activoEditando, setActivoEditando] = useState(null);
  const [formActivo, setFormActivo] = useState({ nombre_activo: '', ticker: '', tipo_activo_id: '', moneda_principal_activo: currency, precio_mercado_actual_manual: '', fecha_precio_mercado_actual: formatYMD(new Date()), descripcion: '' });
  const [activoSeleccionadoParaTrans, setActivoSeleccionadoParaTrans] = useState(null);
  const [transaccionesActivo, setTransaccionesActivo] = useState([]);
  const [cargandoTransacciones, setCargandoTransacciones] = useState(false);
  const [mostrarFormTransaccion, setMostrarFormTransaccion] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState(null);
  const [formTransaccion, setFormTransaccion] = useState({ activo_id: '', tipo_transaccion: 'Compra', fecha_transaccion: formatYMD(new Date()), cantidad: '', precio_por_unidad: '', comisiones: '', notas: '' });
  
  // Clases de Tailwind reutilizables
  const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
  const baseButtonClasses = (color = 'indigo', size = 'md', isActive = false) =>
    `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 4} py-${size === 'sm' ? '1.5' : '2'} border border-transparent rounded-lg shadow-sm text-${size === 'sm' ? 'xs' : 'sm'} font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed
    ${isActive ? `bg-brand-accent-primary text-white focus:ring-brand-accent-primary` : 
      color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white' :
      color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' :
      color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400 text-white' :
      color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white' :
      color === 'cyan' ? 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500 text-white' :
      color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white' :
      color === 'amber' ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-slate-900' :
      `bg-slate-700 hover:bg-slate-600 focus:ring-brand-accent-primary text-slate-200 hover:text-white` // Default/inactive tab
    }`;
  const tableHeaderClasses = "px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
  const tableCellClasses = "px-3 py-3.5 whitespace-nowrap text-sm";
  const iconButtonClasses = "p-1.5 text-slate-400 hover:text-white rounded-md transition-colors duration-150 hover:bg-slate-700";

  useEffect(() => { if (!loadingSettings) { setFormActivo(prev => ({ ...prev, moneda_principal_activo: currency })); } }, [currency, loadingSettings]);

  const cargarPortafolio = useCallback(async () => { if (!session?.user?.id) return; setCargandoPortafolio(true); setErrorGlobal(null); try { const { data, error } = await obtenerPortafolio(); if (error) throw error; setPortafolio(data || []); } catch (err) { setErrorGlobal(`Error portafolio: ${err.message}`); setPortafolio([]); } finally { setCargandoPortafolio(false); } }, [session]);
  const cargarTiposActivo = useCallback(async () => { if (!session?.user?.id) return; setCargandoTipos(true); setErrorGlobal(null); try { const { data, error } = await obtenerTiposActivo(); if (error) throw error; setTiposActivo(data || []); } catch (err) { setErrorGlobal(`Error tipos: ${err.message}`); setTiposActivo([]); } finally { setCargandoTipos(false); } }, [session]);
  const cargarActivosInversion = useCallback(async () => { if (!session?.user?.id) return; setCargandoActivos(true); setErrorGlobal(null); try { const { data, error } = await obtenerActivosInversion(); if (error) throw error; setActivosInversion(data || []); } catch (err) { setErrorGlobal(`Error activos: ${err.message}`); setActivosInversion([]); } finally { setCargandoActivos(false); } }, [session]);
  const cargarTransaccionesDeActivo = useCallback(async (activoId) => { if (!session?.user?.id || !activoId) return; setCargandoTransacciones(true); setErrorGlobal(null); try { const { data, error } = await obtenerTransaccionesInversionPorActivo(activoId); if (error) throw error; setTransaccionesActivo(data || []); } catch (err) { setErrorGlobal(`Error transacciones: ${err.message}`); setTransaccionesActivo([]); } finally { setCargandoTransacciones(false); } }, [session]);

  useEffect(() => { const cargarTodo = async () => { setCargandoGlobal(true); await Promise.all([cargarPortafolio(), cargarTiposActivo(), cargarActivosInversion()]); setCargandoGlobal(false); }; if (session?.user?.id) { cargarTodo(); } else { setCargandoGlobal(false); } }, [session, cargarPortafolio, cargarTiposActivo, cargarActivosInversion]);

  const handleFormTipoChange = (e) => setFormTipo({ ...formTipo, [e.target.name]: e.target.value });
  const handleSubmitTipo = async (e) => { e.preventDefault(); setCargandoTipos(true); try { if (tipoEditando) { await editarTipoActivo(tipoEditando.id, formTipo); } else { await agregarTipoActivo(formTipo); } setMostrarFormTipo(false); setTipoEditando(null); setFormTipo({ nombre: '', descripcion: '' }); await cargarTiposActivo(); } catch (err) { setErrorGlobal(`Error tipo: ${err.message}`); } finally { setCargandoTipos(false); } };
  const handleEditarTipo = (tipo) => { setTipoEditando(tipo); setFormTipo({ nombre: tipo.nombre, descripcion: tipo.descripcion || '' }); setMostrarFormTipo(true); };
  const handleEliminarTipo = async (id) => { if (window.confirm('¿Eliminar tipo?')) { setCargandoTipos(true); try { await eliminarTipoActivo(id); await cargarTiposActivo(); await cargarActivosInversion(); } catch (err) { setErrorGlobal(`Error tipo del: ${err.message}`); } finally { setCargandoTipos(false); } } };

  const handleFormActivoChange = (e) => setFormActivo({ ...formActivo, [e.target.name]: e.target.value });
  const handleSubmitActivo = async (e) => { e.preventDefault(); setCargandoActivos(true); const datosParaGuardar = { ...formActivo, tipo_activo_id: formActivo.tipo_activo_id ? parseInt(formActivo.tipo_activo_id, 10) : null, precio_mercado_actual_manual: formActivo.precio_mercado_actual_manual ? parseFloat(formActivo.precio_mercado_actual_manual) : 0, fecha_precio_mercado_actual: formActivo.fecha_precio_mercado_actual || null }; try { if (activoEditando) { await editarActivoInversion(activoEditando.id, datosParaGuardar); } else { await agregarActivoInversion(datosParaGuardar); } setMostrarFormActivo(false); setActivoEditando(null); setFormActivo({ nombre_activo: '', ticker: '', tipo_activo_id: '', moneda_principal_activo: currency, precio_mercado_actual_manual: '', fecha_precio_mercado_actual: formatYMD(new Date()), descripcion: '' }); await cargarActivosInversion(); await cargarPortafolio(); } catch (err) { setErrorGlobal(`Error activo: ${err.message}`); } finally { setCargandoActivos(false); } };
  const handleEditarActivo = (activo) => { setActivoEditando(activo); setFormActivo({ nombre_activo: activo.nombre_activo, ticker: activo.ticker || '', tipo_activo_id: activo.tipo_activo_id || '', moneda_principal_activo: activo.moneda_principal_activo || currency, precio_mercado_actual_manual: activo.precio_mercado_actual_manual?.toString() || '', fecha_precio_mercado_actual: formatYMD(activo.fecha_precio_mercado_actual || new Date()), descripcion: activo.descripcion || '' }); setMostrarFormActivo(true); };
  const handleEliminarActivo = async (id) => { if (window.confirm('¿Eliminar activo y transacciones?')) { setCargandoActivos(true); try { await eliminarActivoInversion(id); await cargarActivosInversion(); await cargarPortafolio(); if (activoSeleccionadoParaTrans?.id === id) setActivoSeleccionadoParaTrans(null); } catch (err) { setErrorGlobal(`Error activo del: ${err.message}`); } finally { setCargandoActivos(false); } } };

  const handleFormTransaccionChange = (e) => setFormTransaccion({ ...formTransaccion, [e.target.name]: e.target.value });
  const handleSubmitTransaccion = async (e) => { e.preventDefault(); if (!activoSeleccionadoParaTrans) { setErrorGlobal("Activo no seleccionado."); return; } setCargandoTransacciones(true); const datosParaGuardar = { ...formTransaccion, activo_id: activoSeleccionadoParaTrans.id, cantidad: parseFloat(formTransaccion.cantidad), precio_por_unidad: parseFloat(formTransaccion.precio_por_unidad), comisiones: parseFloat(formTransaccion.comisiones) || 0, }; let fueNuevaCompra = false; try { if (transaccionEditando) { await editarTransaccionInversion(transaccionEditando.id, datosParaGuardar); } else { await agregarTransaccionInversion(datosParaGuardar); if (datosParaGuardar.tipo_transaccion === 'Compra') fueNuevaCompra = true; } setMostrarFormTransaccion(false); setTransaccionEditando(null); setFormTransaccion({ activo_id: activoSeleccionadoParaTrans.id, tipo_transaccion: 'Compra', fecha_transaccion: formatYMD(new Date()), cantidad: '', precio_por_unidad: '', comisiones: '', notas: '' }); await cargarTransaccionesDeActivo(activoSeleccionadoParaTrans.id); await cargarPortafolio(); if (fueNuevaCompra) { await otorgarXP(50, `NUEVA_INVERSION_COMPRA:${activoSeleccionadoParaTrans.id}`); await verificarYOtorgarLogro('INVERSOR_INICIAL', { activo_id: activoSeleccionadoParaTrans.id, nombre_activo: activoSeleccionadoParaTrans.nombre_activo }); await fetchEstadoGamificacion(); } } catch (err) { setErrorGlobal(`Error transacción: ${err.message}`); } finally { setCargandoTransacciones(false); } };
  const handleEditarTransaccion = (tx) => { setTransaccionEditando(tx); setFormTransaccion({ activo_id: tx.activo_id, tipo_transaccion: tx.tipo_transaccion, fecha_transaccion: formatYMD(tx.fecha_transaccion), cantidad: tx.cantidad.toString(), precio_por_unidad: tx.precio_por_unidad.toString(), comisiones: tx.comisiones?.toString() || '', notas: tx.notas || '' }); setMostrarFormTransaccion(true); };
  const handleEliminarTransaccion = async (id) => { if (window.confirm('¿Eliminar transacción?')) { setCargandoTransacciones(true); try { await eliminarTransaccionInversion(id); await cargarTransaccionesDeActivo(activoSeleccionadoParaTrans.id); await cargarPortafolio(); } catch (err) { setErrorGlobal(`Error tx del: ${err.message}`); } finally { setCargandoTransacciones(false); } } };

  const seleccionarActivoParaTransacciones = (activo) => { setActivoSeleccionadoParaTrans(activo); setFormTransaccion(prev => ({ ...prev, activo_id: activo.id, tipo_transaccion: 'Compra', fecha_transaccion: formatYMD(new Date()), cantidad: '', precio_por_unidad: '', comisiones: '', notas: '' })); cargarTransaccionesDeActivo(activo.id); setVistaActiva('transacciones'); };

  const formatearMonedaLocal = useCallback((monto, codMoneda = currency, decimales = 2) => { if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---'; try { return monto.toLocaleString('es-MX', { style: 'currency', currency: codMoneda, minimumFractionDigits: decimales, maximumFractionDigits: decimales }); } catch (e) { return `${monto.toFixed(decimales)} ${codMoneda}`; } }, [currency, loadingSettings]);
  const formatearPorcentaje = (valor) => { if (typeof valor !== 'number' || isNaN(valor)) return '-'; return `${valor.toFixed(2)}%`; }

  const renderVista = () => {
    // ... (Lógica de renderizado de cada vista, aplicando .card-base y clases de formulario/tabla)
    // A continuación, un ejemplo para la vista 'portafolio' y el inicio de 'tipos'
    // El resto de las vistas seguirían un patrón similar.

    if (vistaActiva === 'portafolio') {
      return (
        <section className="card-base">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center"><PieChartIcon className="mr-2 text-brand-accent-primary" />Resumen del Portafolio</h2>
            <button onClick={cargarPortafolio} className={`${baseButtonClasses('slate', 'sm')} flex items-center`} disabled={cargandoPortafolio || cargandoGlobal}>
              <RefreshCwIcon className={`mr-2 ${cargandoPortafolio ? 'animate-spin' : ''}`} /> Actualizar
            </button>
          </div>
          {cargandoPortafolio ? <p className="text-slate-400">Cargando portafolio...</p> :
           portafolio.length === 0 ? <p className="text-slate-500">No hay activos en el portafolio.</p> :
            (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className={tableHeaderClasses}>Activo</th>
                      <th className={`${tableHeaderClasses} hidden md:table-cell`}>Tipo</th>
                      <th className={`${tableHeaderClasses} text-right`}>Cantidad</th>
                      <th className={`${tableHeaderClasses} text-right hidden sm:table-cell`}>Costo Prom.</th>
                      <th className={`${tableHeaderClasses} text-right`}>Costo Total</th>
                      <th className={`${tableHeaderClasses} text-right`}>Precio Mercado</th>
                      <th className={`${tableHeaderClasses} text-right`}>Valor Mercado</th>
                      <th className={`${tableHeaderClasses} text-right`}>G/P No Realiz.</th>
                      <th className={`${tableHeaderClasses} text-right hidden lg:table-cell`}>G/P (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {portafolio.map(p => (
                      <tr key={p.activo_id} className="hover:bg-slate-700/40">
                        <td className={`${tableCellClasses} text-slate-100`}><div className="font-medium">{p.nombre_activo}</div><div className="text-xs text-slate-400">{p.ticker || '-'} ({p.moneda_principal_activo})</div></td>
                        <td className={`${tableCellClasses} hidden md:table-cell text-slate-400`}>{p.tipo_activo_nombre || '-'}</td>
                        <td className={`${tableCellClasses} text-slate-300 text-right`}>{parseFloat(p.cantidad_actual).toFixed(4)}</td>
                        <td className={`${tableCellClasses} text-slate-300 text-right hidden sm:table-cell`}>{formatearMonedaLocal(p.costo_promedio_compra, p.moneda_principal_activo, 4)}</td>
                        <td className={`${tableCellClasses} text-slate-300 text-right`}>{formatearMonedaLocal(p.costo_total_actual_ponderado, p.moneda_principal_activo)}</td>
                        <td className={`${tableCellClasses} text-slate-300 text-right`}>{formatearMonedaLocal(p.precio_mercado_actual_manual, p.moneda_principal_activo, 4)} <span className="text-xs text-slate-500">({formatYMD(p.fecha_precio_mercado_actual)})</span></td>
                        <td className={`${tableCellClasses} text-right font-semibold text-slate-100`}>{formatearMonedaLocal(p.valor_mercado_actual_total, p.moneda_principal_activo)}</td>
                        <td className={`${tableCellClasses} text-right ${p.ganancia_perdida_no_realizada >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(p.ganancia_perdida_no_realizada, p.moneda_principal_activo)}</td>
                        <td className={`${tableCellClasses} text-right hidden lg:table-cell ${p.ganancia_perdida_no_realizada_porcentaje >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearPorcentaje(p.ganancia_perdida_no_realizada_porcentaje)}</td>
                      </tr>
                    ))}
                  </tbody>
                   <tfoot className="bg-slate-700/50">
                        <tr>
                            <td colSpan={6} className={`${tableHeaderClasses} text-right font-bold text-slate-100`}>TOTAL PORTAFOLIO ({currency}):</td>
                            <td className={`${tableHeaderClasses} text-right font-bold text-slate-100`}>{formatearMonedaLocal(portafolio.reduce((sum, p) => sum + (p.moneda_principal_activo === currency ? p.valor_mercado_actual_total : 0), 0))}</td>
                            <td className={`${tableHeaderClasses} text-right font-bold text-slate-100`}>{formatearMonedaLocal(portafolio.reduce((sum, p) => sum + (p.moneda_principal_activo === currency ? p.ganancia_perdida_no_realizada : 0), 0))}</td>
                            <td className={`${tableHeaderClasses} hidden lg:table-cell`}></td>
                        </tr>
                    </tfoot>
                </table>
              </div>
            )
          }
        </section>
      );
    }

    if (vistaActiva === 'tipos') {
      return (
        <section className="card-base">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center"><TagIcon className="mr-2 text-purple-400" />Gestionar Tipos de Activo</h2>
            <button onClick={() => { setMostrarFormTipo(!mostrarFormTipo); setTipoEditando(null); setFormTipo({ nombre: '', descripcion: '' }); }} className={baseButtonClasses('purple', 'sm')}>
              {mostrarFormTipo ? 'Cerrar Formulario' : 'Nuevo Tipo'}
            </button>
          </div>
          {mostrarFormTipo && (
            <form onSubmit={handleSubmitTipo} className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-4 border border-slate-600">
              <h3 className="text-md font-semibold text-slate-200">{tipoEditando ? 'Editar Tipo' : 'Crear Nuevo Tipo'}</h3>
              <div><label htmlFor="tipoNombre" className={baseLabelClasses}>Nombre <span className="text-red-500">*</span></label><input type="text" name="nombre" id="tipoNombre" value={formTipo.nombre} onChange={handleFormTipoChange} required className={baseInputClasses} /></div>
              <div><label htmlFor="tipoDescripcion" className={baseLabelClasses}>Descripción (Opcional)</label><input type="text" name="descripcion" id="tipoDescripcion" value={formTipo.descripcion} onChange={handleFormTipoChange} className={baseInputClasses} /></div>
              <div className="flex gap-3"><button type="submit" className={baseButtonClasses(tipoEditando ? 'yellow' : 'green')} disabled={cargandoTipos}>{cargandoTipos ? 'Guardando...' : (tipoEditando ? <><SaveIcon className="mr-1.5"/> Actualizar</> : <><PlusCircleIcon className="mr-1.5"/> Crear</>)}</button>{tipoEditando && <button type="button" onClick={() => { setMostrarFormTipo(false); setTipoEditando(null); }} className={baseButtonClasses('slate')}><XCircleIcon className="mr-1.5"/>Cancelar</button>}</div>
            </form>
          )}
          {cargandoTipos ? <p className="text-slate-400">Cargando tipos...</p> :
           tiposActivo.length === 0 ? <p className="text-slate-500">No hay tipos de activo definidos.</p> :
            (<ul className="space-y-3">{tiposActivo.map(t => <li key={t.id} className="flex justify-between items-center p-3.5 bg-slate-700/50 rounded-lg border border-slate-600"><div><p className="font-medium text-slate-100">{t.nombre}</p><p className="text-xs text-slate-400">{t.descripcion || 'Sin descripción'}</p></div><div className="flex gap-2">{t.user_id === session?.user?.id && (<><button onClick={() => handleEditarTipo(t)} className={`${iconButtonClasses} hover:text-yellow-400`} title="Editar"><Edit3Icon className="w-4 h-4"/></button><button onClick={() => handleEliminarTipo(t.id)} className={`${iconButtonClasses} hover:text-red-400`} title="Eliminar"><Trash2Icon className="w-4 h-4"/></button></>)}</div></li>)}</ul>)
          }
        </section>
      );
    }
    // ... Implementar renderizado para 'activos' y 'transacciones' de forma similar
    if (vistaActiva === 'activos') { /* ... JSX para vista de activos ... */ }
    if (vistaActiva === 'transacciones' && activoSeleccionadoParaTrans) { /* ... JSX para vista de transacciones de un activo ... */ }


    return <p className="text-slate-500">Selecciona una vista para comenzar.</p>;
  };


  if (cargandoGlobal && !errorGlobal) {
    return <div className="text-center py-10"><p className="text-xl text-brand-accent-primary">Cargando datos de inversiones...</p></div>;
  }
  if (errorGlobal) {
    return <div className="card-base bg-red-900/20 border-red-700 text-red-300" role="alert"><strong>Error General en Inversiones:</strong> {errorGlobal}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="page-title"> <TrendingUpIcon /> Gestión de Inversiones </h1>
      
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-700">
        <button onClick={() => setVistaActiva('portafolio')} className={baseButtonClasses('slate', 'md', vistaActiva === 'portafolio')}><PieChartIcon className="mr-2"/> Portafolio</button>
        <button onClick={() => setVistaActiva('activos')} className={baseButtonClasses('slate', 'md', vistaActiva === 'activos')}><BriefcaseIcon className="mr-2"/> Mis Activos</button>
        <button onClick={() => setVistaActiva('tipos')} className={baseButtonClasses('slate', 'md', vistaActiva === 'tipos')}><TagIcon className="mr-2"/> Tipos de Activo</button>
        {activoSeleccionadoParaTrans && (
          <button onClick={() => setVistaActiva('transacciones')} className={baseButtonClasses('slate', 'md', vistaActiva === 'transacciones')}>
            <CoinsIcon className="mr-2"/> Transacciones: {activoSeleccionadoParaTrans.nombre_activo.substring(0,10)}...
          </button>
        )}
      </div>
      {renderVista()}
    </div>
  );
}

export default Inversiones;
