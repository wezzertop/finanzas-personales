// Archivo: src/pages/Inversiones.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  obtenerTiposActivo,
  agregarTipoActivo,
  editarTipoActivo,
  eliminarTipoActivo,
  obtenerActivosInversion,
  agregarActivoInversion,
  editarActivoInversion,
  eliminarActivoInversion,
  obtenerTransaccionesInversionPorActivo,
  agregarTransaccionInversion,
  editarTransaccionInversion,
  eliminarTransaccionInversion,
  obtenerPortafolio,
} from '../lib/inversionesApi';

// Función auxiliar para formatear fecha YYYY-MM-DD
const formatYMD = (date) => {
  if (!date) return '';
  try {
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formateando fecha:", date, e);
    return '';
  }
};

function Inversiones({ session }) {
  const { currency, loadingSettings, supportedCurrencies } = useSettings();

  // Estados generales
  const [vistaActiva, setVistaActiva] = useState('portafolio');
  const [cargandoGlobal, setCargandoGlobal] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);

  // Estados para Portafolio
  const [portafolio, setPortafolio] = useState([]);
  const [cargandoPortafolio, setCargandoPortafolio] = useState(false);

  // Estados para Tipos de Activo
  const [tiposActivo, setTiposActivo] = useState([]);
  const [cargandoTipos, setCargandoTipos] = useState(false);
  const [mostrarFormTipo, setMostrarFormTipo] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);
  const [formTipo, setFormTipo] = useState({ nombre: '', descripcion: '' });

  // Estados para Activos de Inversión
  const [activosInversion, setActivosInversion] = useState([]);
  const [cargandoActivos, setCargandoActivos] = useState(false);
  const [mostrarFormActivo, setMostrarFormActivo] = useState(false);
  const [activoEditando, setActivoEditando] = useState(null);
  const [formActivo, setFormActivo] = useState({
    nombre_activo: '',
    ticker: '',
    tipo_activo_id: '',
    moneda_principal_activo: currency,
    precio_mercado_actual_manual: '',
    fecha_precio_mercado_actual: formatYMD(new Date()),
    descripcion: ''
  });

  // Estados para Transacciones de Inversión
  const [activoSeleccionadoParaTrans, setActivoSeleccionadoParaTrans] = useState(null);
  const [transaccionesActivo, setTransaccionesActivo] = useState([]);
  const [cargandoTransacciones, setCargandoTransacciones] = useState(false);
  const [mostrarFormTransaccion, setMostrarFormTransaccion] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState(null);
  const [formTransaccion, setFormTransaccion] = useState({
    activo_id: '',
    tipo_transaccion: 'Compra',
    fecha_transaccion: formatYMD(new Date()),
    cantidad: '',
    precio_por_unidad: '',
    comisiones: '',
    notas: ''
  });

  useEffect(() => {
    if (!loadingSettings) {
      setFormActivo(prev => ({ ...prev, moneda_principal_activo: currency }));
    }
  }, [currency, loadingSettings]);

  const cargarPortafolio = useCallback(async () => {
    if (!session?.user?.id) return;
    setCargandoPortafolio(true); setErrorGlobal(null);
    try {
      const { data, error } = await obtenerPortafolio();
      if (error) throw error;
      setPortafolio(data || []);
    } catch (err) { setErrorGlobal(`Error portafolio: ${err.message}`); setPortafolio([]); }
    finally { setCargandoPortafolio(false); }
  }, [session]);

  const cargarTiposActivo = useCallback(async () => {
    if (!session?.user?.id) return;
    setCargandoTipos(true); setErrorGlobal(null);
    try {
      const { data, error } = await obtenerTiposActivo();
      if (error) throw error;
      setTiposActivo(data || []);
    } catch (err) { setErrorGlobal(`Error tipos: ${err.message}`); setTiposActivo([]); }
    finally { setCargandoTipos(false); }
  }, [session]);

  const cargarActivosInversion = useCallback(async () => {
    if (!session?.user?.id) return;
    setCargandoActivos(true); setErrorGlobal(null);
    try {
      const { data, error } = await obtenerActivosInversion();
      if (error) throw error;
      setActivosInversion(data || []);
    } catch (err) { setErrorGlobal(`Error activos: ${err.message}`); setActivosInversion([]); }
    finally { setCargandoActivos(false); }
  }, [session]);

  const cargarTransaccionesDeActivo = useCallback(async (activoId) => {
    if (!session?.user?.id || !activoId) return;
    setCargandoTransacciones(true); setErrorGlobal(null);
    try {
      const { data, error } = await obtenerTransaccionesInversionPorActivo(activoId);
      if (error) throw error;
      setTransaccionesActivo(data || []);
    } catch (err) { setErrorGlobal(`Error transacciones: ${err.message}`); setTransaccionesActivo([]); }
    finally { setCargandoTransacciones(false); }
  }, [session]);

  useEffect(() => {
    const cargarTodo = async () => {
      setCargandoGlobal(true);
      await Promise.all([
        cargarPortafolio(),
        cargarTiposActivo(),
        cargarActivosInversion()
      ]);
      setCargandoGlobal(false);
    };
    if (session?.user?.id) {
      cargarTodo();
    } else {
      setCargandoGlobal(false);
    }
  }, [session, cargarPortafolio, cargarTiposActivo, cargarActivosInversion]);

  const handleFormTipoChange = (e) => setFormTipo({ ...formTipo, [e.target.name]: e.target.value });
  const handleSubmitTipo = async (e) => {
    e.preventDefault();
    setCargandoTipos(true);
    try {
      if (tipoEditando) {
        await editarTipoActivo(tipoEditando.id, formTipo);
      } else {
        await agregarTipoActivo(formTipo);
      }
      setMostrarFormTipo(false); setTipoEditando(null); setFormTipo({ nombre: '', descripcion: '' });
      cargarTiposActivo();
    } catch (err) { setErrorGlobal(`Error guardando tipo: ${err.message}`); }
    finally { setCargandoTipos(false); }
  };
  const handleEditarTipo = (tipo) => { setTipoEditando(tipo); setFormTipo({ nombre: tipo.nombre, descripcion: tipo.descripcion || '' }); setMostrarFormTipo(true); };
  const handleEliminarTipo = async (id) => { if (window.confirm('¿Eliminar tipo? Afectará activos vinculados.')) { setCargandoTipos(true); try { await eliminarTipoActivo(id); cargarTiposActivo(); cargarActivosInversion(); } catch (err) { setErrorGlobal(`Error eliminando tipo: ${err.message}`); } finally { setCargandoTipos(false); } } };

  const handleFormActivoChange = (e) => setFormActivo({ ...formActivo, [e.target.name]: e.target.value });
  const handleSubmitActivo = async (e) => {
    e.preventDefault();
    setCargandoActivos(true);
    const datosParaGuardar = {
        ...formActivo,
        tipo_activo_id: formActivo.tipo_activo_id ? parseInt(formActivo.tipo_activo_id, 10) : null,
        precio_mercado_actual_manual: formActivo.precio_mercado_actual_manual ? parseFloat(formActivo.precio_mercado_actual_manual) : 0,
        fecha_precio_mercado_actual: formActivo.fecha_precio_mercado_actual || null
    };
    try {
      if (activoEditando) {
        await editarActivoInversion(activoEditando.id, datosParaGuardar);
      } else {
        await agregarActivoInversion(datosParaGuardar);
      }
      setMostrarFormActivo(false); setActivoEditando(null); setFormActivo({ nombre_activo: '', ticker: '', tipo_activo_id: '', moneda_principal_activo: currency, precio_mercado_actual_manual: '', fecha_precio_mercado_actual: formatYMD(new Date()), descripcion: '' });
      cargarActivosInversion(); cargarPortafolio();
    } catch (err) { setErrorGlobal(`Error guardando activo: ${err.message}`); }
    finally { setCargandoActivos(false); }
  };
  const handleEditarActivo = (activo) => { setActivoEditando(activo); setFormActivo({ nombre_activo: activo.nombre_activo, ticker: activo.ticker || '', tipo_activo_id: activo.tipo_activo_id || '', moneda_principal_activo: activo.moneda_principal_activo || currency, precio_mercado_actual_manual: activo.precio_mercado_actual_manual || '', fecha_precio_mercado_actual: formatYMD(activo.fecha_precio_mercado_actual || new Date()), descripcion: activo.descripcion || '' }); setMostrarFormActivo(true); };
  const handleEliminarActivo = async (id) => { if (window.confirm('¿Eliminar activo y todas sus transacciones?')) { setCargandoActivos(true); try { await eliminarActivoInversion(id); cargarActivosInversion(); cargarPortafolio(); if (activoSeleccionadoParaTrans?.id === id) setActivoSeleccionadoParaTrans(null); } catch (err) { setErrorGlobal(`Error eliminando activo: ${err.message}`); } finally { setCargandoActivos(false); } } };

  const handleFormTransaccionChange = (e) => setFormTransaccion({ ...formTransaccion, [e.target.name]: e.target.value });
  const handleSubmitTransaccion = async (e) => {
    e.preventDefault();
    if (!activoSeleccionadoParaTrans) return;
    setCargandoTransacciones(true);
    const datosParaGuardar = {
        ...formTransaccion,
        activo_id: activoSeleccionadoParaTrans.id,
        cantidad: parseFloat(formTransaccion.cantidad),
        precio_por_unidad: parseFloat(formTransaccion.precio_por_unidad),
        comisiones: parseFloat(formTransaccion.comisiones) || 0,
    };
    try {
      if (transaccionEditando) {
        await editarTransaccionInversion(transaccionEditando.id, datosParaGuardar);
      } else {
        await agregarTransaccionInversion(datosParaGuardar);
      }
      setMostrarFormTransaccion(false); setTransaccionEditando(null); setFormTransaccion({ activo_id: activoSeleccionadoParaTrans.id, tipo_transaccion: 'Compra', fecha_transaccion: formatYMD(new Date()), cantidad: '', precio_por_unidad: '', comisiones: '', notas: '' });
      cargarTransaccionesDeActivo(activoSeleccionadoParaTrans.id);
      cargarPortafolio();
    } catch (err) { setErrorGlobal(`Error guardando transacción: ${err.message}`); }
    finally { setCargandoTransacciones(false); }
  };
  const handleEditarTransaccion = (tx) => { setTransaccionEditando(tx); setFormTransaccion({ activo_id: tx.activo_id, tipo_transaccion: tx.tipo_transaccion, fecha_transaccion: formatYMD(tx.fecha_transaccion), cantidad: tx.cantidad.toString(), precio_por_unidad: tx.precio_por_unidad.toString(), comisiones: tx.comisiones?.toString() || '', notas: tx.notas || '' }); setMostrarFormTransaccion(true); };
  const handleEliminarTransaccion = async (id) => { if (window.confirm('¿Eliminar transacción?')) { setCargandoTransacciones(true); try { await eliminarTransaccionInversion(id); cargarTransaccionesDeActivo(activoSeleccionadoParaTrans.id); cargarPortafolio(); } catch (err) { setErrorGlobal(`Error eliminando transacción: ${err.message}`); } finally { setCargandoTransacciones(false); } } };

  const seleccionarActivoParaTransacciones = (activo) => {
    setActivoSeleccionadoParaTrans(activo);
    setFormTransaccion(prev => ({ ...prev, activo_id: activo.id }));
    cargarTransaccionesDeActivo(activo.id);
    setVistaActiva('transacciones');
  };

  const formatearMonedaLocal = useCallback((monto, codMoneda = currency, decimales = 2) => {
    if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---';
    try {
      return monto.toLocaleString('es-MX', { style: 'currency', currency: codMoneda, minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    } catch (e) {
      return `${monto.toFixed(decimales)} ${codMoneda}`;
    }
  }, [currency, loadingSettings]);

  const formatearPorcentaje = (valor) => {
      if (typeof valor !== 'number' || isNaN(valor)) return '-';
      return `${valor.toFixed(2)}%`;
  }

  const cardClasses = "bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700";
  const titleClasses = "text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6 flex items-center";
  const buttonClasses = (color = 'indigo', size = 'md') =>
    `px-${size === 'sm' ? 2 : 4} py-${size === 'sm' ? 1 : 2} border border-transparent rounded-md shadow-sm text-${size === 'sm' ? 'xs' : 'sm'} font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const selectClasses = `${inputClasses} bg-gray-700`;
  const tableHeaderClasses = "px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider";
  const tableCellClasses = "px-4 py-3 whitespace-nowrap text-sm text-gray-300";
  const tableRowClasses = "border-b border-gray-700 hover:bg-gray-800/50";

  const renderVista = () => {
    if (vistaActiva === 'portafolio') {
      return (
        <section className={cardClasses}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={titleClasses}><span className="mr-3 text-green-400 text-2xl">📈</span>Resumen del Portafolio</h2>
            <button onClick={cargarPortafolio} className={`${buttonClasses('gray', 'sm')} flex items-center`} disabled={cargandoPortafolio || cargandoGlobal}>
              <span className={`mr-2 ${cargandoPortafolio ? 'animate-spin' : ''}`}>🔄</span> Actualizar
            </button>
          </div>
          {cargandoPortafolio || cargandoGlobal ? <p className="text-blue-400">Cargando portafolio...</p> :
           portafolio.length === 0 ? <p className="text-gray-500">No hay activos en el portafolio para mostrar.</p> :
            (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
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
                  <tbody className="bg-gray-900 divide-y divide-gray-700">
                    {portafolio.map(p => (
                      <tr key={p.activo_id} className={tableRowClasses}>
                        <td className={tableCellClasses}>
                          <div className="font-medium text-white">{p.nombre_activo}</div>
                          <div className="text-xs text-gray-400">{p.ticker || '-'} ({p.moneda_principal_activo})</div>
                        </td>
                        <td className={`${tableCellClasses} hidden md:table-cell`}>{p.tipo_activo_nombre || '-'}</td>
                        <td className={`${tableCellClasses} text-right`}>{parseFloat(p.cantidad_actual).toFixed(4)}</td>
                        <td className={`${tableCellClasses} text-right hidden sm:table-cell`}>{formatearMonedaLocal(p.costo_promedio_compra, p.moneda_principal_activo, 4)}</td>
                        <td className={`${tableCellClasses} text-right`}>{formatearMonedaLocal(p.costo_total_actual_ponderado, p.moneda_principal_activo)}</td>
                        <td className={`${tableCellClasses} text-right`}>{formatearMonedaLocal(p.precio_mercado_actual_manual, p.moneda_principal_activo, 4)} <span className="text-xs text-gray-500">({formatYMD(p.fecha_precio_mercado_actual)})</span></td>
                        <td className={`${tableCellClasses} text-right font-semibold`}>{formatearMonedaLocal(p.valor_mercado_actual_total, p.moneda_principal_activo)}</td>
                        <td className={`${tableCellClasses} text-right ${p.ganancia_perdida_no_realizada >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(p.ganancia_perdida_no_realizada, p.moneda_principal_activo)}</td>
                        <td className={`${tableCellClasses} text-right hidden lg:table-cell ${p.ganancia_perdida_no_realizada_porcentaje >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearPorcentaje(p.ganancia_perdida_no_realizada_porcentaje)}</td>
                      </tr>
                    ))}
                  </tbody>
                   <tfoot className="bg-gray-800">
                        <tr>
                            <td colSpan={6} className={`${tableHeaderClasses} text-right font-bold text-white`}>TOTAL PORTAFOLIO ({currency}):</td>
                            <td className={`${tableHeaderClasses} text-right font-bold text-white`}>
                                {formatearMonedaLocal(portafolio.reduce((sum, p) => sum + (p.moneda_principal_activo === currency ? p.valor_mercado_actual_total : 0), 0))}
                            </td>
                            <td className={`${tableHeaderClasses} text-right font-bold text-white`}>
                                {formatearMonedaLocal(portafolio.reduce((sum, p) => sum + (p.moneda_principal_activo === currency ? p.ganancia_perdida_no_realizada : 0), 0))}
                            </td>
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
        <section className={cardClasses}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={titleClasses}><span className="mr-3 text-purple-400 text-2xl">🏷️</span>Gestionar Tipos de Activo</h2>
            <button onClick={() => { setMostrarFormTipo(!mostrarFormTipo); setTipoEditando(null); setFormTipo({ nombre: '', descripcion: '' }); }} className={buttonClasses('purple', 'sm')}>
              {mostrarFormTipo ? 'Cerrar Formulario' : 'Nuevo Tipo'}
            </button>
          </div>
          {mostrarFormTipo && (
            <form onSubmit={handleSubmitTipo} className="mb-6 p-4 bg-gray-800 rounded-md space-y-3">
              <h3 className="text-md font-semibold text-white">{tipoEditando ? 'Editar Tipo' : 'Crear Tipo'}</h3>
              <div><label htmlFor="tipoNombre" className={labelClasses}>Nombre</label><input type="text" name="nombre" id="tipoNombre" value={formTipo.nombre} onChange={handleFormTipoChange} required className={inputClasses} /></div>
              <div><label htmlFor="tipoDescripcion" className={labelClasses}>Descripción (Opcional)</label><input type="text" name="descripcion" id="tipoDescripcion" value={formTipo.descripcion} onChange={handleFormTipoChange} className={inputClasses} /></div>
              <div className="flex gap-2"><button type="submit" className={buttonClasses('green')} disabled={cargandoTipos}>{cargandoTipos ? 'Guardando...' : (tipoEditando ? 'Actualizar' : 'Crear')}</button>{tipoEditando && <button type="button" onClick={() => { setMostrarFormTipo(false); setTipoEditando(null); }} className={buttonClasses('gray')}>Cancelar</button>}</div>
            </form>
          )}
          {cargandoTipos ? <p className="text-blue-400">Cargando tipos...</p> :
           tiposActivo.length === 0 ? <p className="text-gray-500">No hay tipos de activo definidos.</p> :
            (<ul className="space-y-2">{tiposActivo.map(t => <li key={t.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md"><div><p className="font-medium text-white">{t.nombre}</p><p className="text-xs text-gray-400">{t.descripcion || 'Sin descripción'}</p></div><div className="flex gap-2">{t.user_id === session?.user?.id && (<><button onClick={() => handleEditarTipo(t)} className={buttonClasses('yellow', 'sm')} title="Editar">✏️</button><button onClick={() => handleEliminarTipo(t.id)} className={buttonClasses('red', 'sm')} title="Eliminar">🗑️</button></>)}</div></li>)}</ul>)
          }
        </section>
      );
    }

    if (vistaActiva === 'activos') {
      return (
        <section className={cardClasses}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={titleClasses}><span className="mr-3 text-cyan-400 text-2xl">💼</span>Gestionar Activos de Inversión</h2>
            <button onClick={() => { setMostrarFormActivo(!mostrarFormActivo); setActivoEditando(null); setFormActivo({ nombre_activo: '', ticker: '', tipo_activo_id: '', moneda_principal_activo: currency, precio_mercado_actual_manual: '', fecha_precio_mercado_actual: formatYMD(new Date()), descripcion: '' }); }} className={buttonClasses('cyan', 'sm')}>
              {mostrarFormActivo ? 'Cerrar Formulario' : 'Nuevo Activo'}
            </button>
          </div>
          {mostrarFormActivo && (
            <form onSubmit={handleSubmitActivo} className="mb-6 p-4 bg-gray-800 rounded-md space-y-3">
              <h3 className="text-md font-semibold text-white">{activoEditando ? 'Editar Activo' : 'Crear Activo'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label htmlFor="activoNombre" className={labelClasses}>Nombre Activo <span className="text-red-500">*</span></label><input type="text" name="nombre_activo" id="activoNombre" value={formActivo.nombre_activo} onChange={handleFormActivoChange} required className={inputClasses} /></div>
                <div><label htmlFor="activoTicker" className={labelClasses}>Ticker/Símbolo</label><input type="text" name="ticker" id="activoTicker" value={formActivo.ticker} onChange={handleFormActivoChange} className={inputClasses} /></div>
                <div><label htmlFor="activoTipo" className={labelClasses}>Tipo de Activo</label><select name="tipo_activo_id" id="activoTipo" value={formActivo.tipo_activo_id} onChange={handleFormActivoChange} className={selectClasses}><option value="">-- Seleccionar --</option>{tiposActivo.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></div>
                <div><label htmlFor="activoMoneda" className={labelClasses}>Moneda del Activo <span className="text-red-500">*</span></label><select name="moneda_principal_activo" id="activoMoneda" value={formActivo.moneda_principal_activo} onChange={handleFormActivoChange} required className={selectClasses}>{supportedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label htmlFor="activoPrecioManual" className={labelClasses}>Precio Mercado Manual</label><input type="number" step="any" name="precio_mercado_actual_manual" id="activoPrecioManual" value={formActivo.precio_mercado_actual_manual} onChange={handleFormActivoChange} className={inputClasses} /></div>
                <div><label htmlFor="activoFechaPrecio" className={labelClasses}>Fecha Precio</label><input type="date" name="fecha_precio_mercado_actual" id="activoFechaPrecio" value={formActivo.fecha_precio_mercado_actual} onChange={handleFormActivoChange} className={inputClasses} /></div>
              </div>
              <div><label htmlFor="activoDescripcion" className={labelClasses}>Descripción</label><textarea name="descripcion" id="activoDescripcion" value={formActivo.descripcion} onChange={handleFormActivoChange} rows="2" className={inputClasses}></textarea></div>
              <div className="flex gap-2"><button type="submit" className={buttonClasses('green')} disabled={cargandoActivos}>{cargandoActivos ? 'Guardando...' : (activoEditando ? 'Actualizar' : 'Crear')}</button>{activoEditando && <button type="button" onClick={() => { setMostrarFormActivo(false); setActivoEditando(null); }} className={buttonClasses('gray')}>Cancelar</button>}</div>
            </form>
          )}
          {cargandoActivos ? <p className="text-blue-400">Cargando activos...</p> :
           activosInversion.length === 0 ? <p className="text-gray-500">No hay activos de inversión.</p> :
            (<div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-700"><thead className="bg-gray-800"><tr><th className={tableHeaderClasses}>Nombre (Ticker)</th><th className={`${tableHeaderClasses} hidden md:table-cell`}>Tipo</th><th className={`${tableHeaderClasses} hidden sm:table-cell`}>Moneda</th><th className={`${tableHeaderClasses} text-right`}>Precio Manual</th><th className={tableHeaderClasses}>Acciones</th></tr></thead><tbody className="bg-gray-900 divide-y divide-gray-700">{activosInversion.map(a => (<tr key={a.id} className={tableRowClasses}><td className={tableCellClasses}><div className="font-medium text-white">{a.nombre_activo}</div><div className="text-xs text-gray-400">{a.ticker || '-'}</div></td><td className={`${tableCellClasses} hidden md:table-cell`}>{a.tipo_activo?.nombre || '-'}</td><td className={`${tableCellClasses} hidden sm:table-cell`}>{a.moneda_principal_activo}</td><td className={`${tableCellClasses} text-right`}>{formatearMonedaLocal(a.precio_mercado_actual_manual, a.moneda_principal_activo, 4)} <span className="text-xs text-gray-500">({formatYMD(a.fecha_precio_mercado_actual)})</span></td><td className={tableCellClasses}><div className="flex gap-2">
            <button onClick={() => seleccionarActivoParaTransacciones(a)} className={buttonClasses('blue', 'sm')} title="Ver/Agregar Transacciones">📋</button>
            <button onClick={() => handleEditarActivo(a)} className={buttonClasses('yellow', 'sm')} title="Editar Activo">✏️</button>
            <button onClick={() => handleEliminarActivo(a.id)} className={buttonClasses('red', 'sm')} title="Eliminar Activo">🗑️</button></div></td></tr>))}</tbody></table></div>)
          }
        </section>
      );
    }

    if (vistaActiva === 'transacciones' && activoSeleccionadoParaTrans) {
      return (
        <section className={cardClasses}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={titleClasses}><span className="mr-3 text-amber-400 text-2xl">🪙</span>Transacciones de: <span className="ml-2 font-bold text-amber-300">{activoSeleccionadoParaTrans.nombre_activo} ({activoSeleccionadoParaTrans.moneda_principal_activo})</span></h2>
            <button onClick={() => { setMostrarFormTransaccion(!mostrarFormTransaccion); setTransaccionEditando(null); setFormTransaccion({ activo_id: activoSeleccionadoParaTrans.id, tipo_transaccion: 'Compra', fecha_transaccion: formatYMD(new Date()), cantidad: '', precio_por_unidad: '', comisiones: '', notas: '' }); }} className={buttonClasses('amber', 'sm')}>
              {mostrarFormTransaccion ? 'Cerrar Formulario' : 'Nueva Transacción'}
            </button>
          </div>
          {mostrarFormTransaccion && (
            <form onSubmit={handleSubmitTransaccion} className="mb-6 p-4 bg-gray-800 rounded-md space-y-3">
              <h3 className="text-md font-semibold text-white">{transaccionEditando ? 'Editar Transacción' : 'Nueva Transacción'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label htmlFor="txTipo" className={labelClasses}>Tipo <span className="text-red-500">*</span></label><select name="tipo_transaccion" id="txTipo" value={formTransaccion.tipo_transaccion} onChange={handleFormTransaccionChange} required className={selectClasses}><option value="Compra">Compra</option><option value="Venta">Venta</option></select></div>
                <div><label htmlFor="txFecha" className={labelClasses}>Fecha <span className="text-red-500">*</span></label><input type="date" name="fecha_transaccion" id="txFecha" value={formTransaccion.fecha_transaccion} onChange={handleFormTransaccionChange} required className={inputClasses} /></div>
                <div><label htmlFor="txCantidad" className={labelClasses}>Cantidad <span className="text-red-500">*</span></label><input type="number" step="any" name="cantidad" id="txCantidad" value={formTransaccion.cantidad} onChange={handleFormTransaccionChange} required className={inputClasses} /></div>
                <div><label htmlFor="txPrecio" className={labelClasses}>Precio/Unidad ({activoSeleccionadoParaTrans.moneda_principal_activo}) <span className="text-red-500">*</span></label><input type="number" step="any" name="precio_por_unidad" id="txPrecio" value={formTransaccion.precio_por_unidad} onChange={handleFormTransaccionChange} required className={inputClasses} /></div>
                <div><label htmlFor="txComisiones" className={labelClasses}>Comisiones ({activoSeleccionadoParaTrans.moneda_principal_activo})</label><input type="number" step="any" name="comisiones" id="txComisiones" value={formTransaccion.comisiones} onChange={handleFormTransaccionChange} className={inputClasses} /></div>
              </div>
              <div><label htmlFor="txNotas" className={labelClasses}>Notas</label><textarea name="notas" id="txNotas" value={formTransaccion.notas} onChange={handleFormTransaccionChange} rows="2" className={inputClasses}></textarea></div>
              <div className="flex gap-2"><button type="submit" className={buttonClasses('green')} disabled={cargandoTransacciones}>{cargandoTransacciones ? 'Guardando...' : (transaccionEditando ? 'Actualizar' : 'Agregar')}</button>{transaccionEditando && <button type="button" onClick={() => { setMostrarFormTransaccion(false); setTransaccionEditando(null); }} className={buttonClasses('gray')}>Cancelar</button>}</div>
            </form>
          )}
          {cargandoTransacciones ? <p className="text-blue-400">Cargando transacciones...</p> :
           transaccionesActivo.length === 0 ? <p className="text-gray-500">No hay transacciones para este activo.</p> :
            (<div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-700"><thead className="bg-gray-800"><tr><th className={tableHeaderClasses}>Fecha</th><th className={tableHeaderClasses}>Tipo</th><th className={`${tableHeaderClasses} text-right`}>Cantidad</th><th className={`${tableHeaderClasses} text-right`}>Precio/U</th><th className={`${tableHeaderClasses} text-right hidden sm:table-cell`}>Comisiones</th><th className={`${tableHeaderClasses} text-right`}>Total</th><th className={`${tableHeaderClasses} hidden md:table-cell`}>Notas</th><th className={tableHeaderClasses}>Acciones</th></tr></thead><tbody className="bg-gray-900 divide-y divide-gray-700">{transaccionesActivo.map(tx => { const totalTx = (tx.tipo_transaccion === 'Compra' ? 1 : -1) * (tx.cantidad * tx.precio_por_unidad) + (tx.tipo_transaccion === 'Compra' ? tx.comisiones : -tx.comisiones); return (<tr key={tx.id} className={tableRowClasses}><td className={tableCellClasses}>{formatYMD(tx.fecha_transaccion)}</td><td className={`${tableCellClasses} ${tx.tipo_transaccion === 'Compra' ? 'text-green-400' : 'text-red-400'}`}>{tx.tipo_transaccion}</td><td className={`${tableCellClasses} text-right`}>{parseFloat(tx.cantidad).toFixed(4)}</td><td className={`${tableCellClasses} text-right`}>{formatearMonedaLocal(tx.precio_por_unidad, activoSeleccionadoParaTrans.moneda_principal_activo, 4)}</td><td className={`${tableCellClasses} text-right hidden sm:table-cell`}>{formatearMonedaLocal(tx.comisiones, activoSeleccionadoParaTrans.moneda_principal_activo)}</td><td className={`${tableCellClasses} text-right font-medium ${tx.tipo_transaccion === 'Compra' ? 'text-red-400' : 'text-green-400'}`}>{formatearMonedaLocal(Math.abs(totalTx), activoSeleccionadoParaTrans.moneda_principal_activo)}</td><td className={`${tableCellClasses} hidden md:table-cell truncate max-w-xs`} title={tx.notas}>{tx.notas || '-'}</td><td className={tableCellClasses}><div className="flex gap-2"><button onClick={() => handleEditarTransaccion(tx)} className={buttonClasses('yellow', 'sm')} title="Editar">✏️</button><button onClick={() => handleEliminarTransaccion(tx.id)} className={buttonClasses('red', 'sm')} title="Eliminar">🗑️</button></div></td></tr>);})}</tbody></table></div>)
          }
        </section>
      );
    }
    return <p className="text-gray-500">Selecciona una vista.</p>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center text-white mb-6 pb-4 border-b border-gray-700">
        <div className="flex items-center">
          <span className="mr-3 text-3xl text-blue-400">🛡️</span>
          <h1 className="text-3xl font-bold">Gestión de Inversiones</h1>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <button onClick={() => setVistaActiva('portafolio')} className={`${buttonClasses(vistaActiva === 'portafolio' ? 'blue' : 'gray')} flex items-center`}><span className="mr-2">📈</span> Portafolio</button>
          <button onClick={() => setVistaActiva('activos')} className={`${buttonClasses(vistaActiva === 'activos' ? 'cyan' : 'gray')} flex items-center`}><span className="mr-2">💼</span> Mis Activos</button>
          <button onClick={() => setVistaActiva('tipos')} className={`${buttonClasses(vistaActiva === 'tipos' ? 'purple' : 'gray')} flex items-center`}><span className="mr-2">🏷️</span> Tipos de Activo</button>
          {activoSeleccionadoParaTrans && (
            <button onClick={() => setVistaActiva('transacciones')} className={`${buttonClasses(vistaActiva === 'transacciones' ? 'amber' : 'gray')} flex items-center`}><span className="mr-2">🪙</span> Transacciones: {activoSeleccionadoParaTrans.nombre_activo.substring(0,10)}...</button>
          )}
        </div>
      </div>

      {errorGlobal && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4" role="alert"><strong>Error General:</strong> {errorGlobal}</div>}
      {cargandoGlobal && !errorGlobal && <div className="text-center py-10"><p className="text-xl text-blue-400">Cargando datos de inversiones...</p></div>}
      {!cargandoGlobal && renderVista()}
    </div>
  );
}

export default Inversiones;
