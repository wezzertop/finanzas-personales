// Archivo: src/pages/Presupuestos.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi';
import { obtenerPresupuestosPorMes, agregarPresupuesto, editarPresupuesto, eliminarPresupuesto } from '../lib/presupuestosApi';
import { useGamificacion } from '../context/GamificacionContext';

// --- Iconos SVG Inline ---
const TargetIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const PlusCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const XCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const Edit3Icon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const Trash2Icon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
// --- Fin Iconos SVG Inline ---

const getPrimerDiaMes = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('sv-SE');
};

function Presupuestos({ session }) {
  const { currency, loadingSettings } = useSettings();
  const { verificarYOtorgarLogro, fetchEstadoGamificacion } = useGamificacion();

  const [mesSeleccionado, setMesSeleccionado] = useState(getPrimerDiaMes(new Date()));
  const [presupuestosMes, setPresupuestosMes] = useState([]);
  const [categoriasEgreso, setCategoriasEgreso] = useState([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');
  const [montoPresupuesto, setMontoPresupuesto] = useState('');
  const [editandoPresupuesto, setEditandoPresupuesto] = useState(null);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [cargandoPresupuestos, setCargandoPresupuestos] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clases de Tailwind reutilizables
  const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
  const baseButtonClasses = (color = 'indigo', size = 'md') =>
    `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed
    ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}
    ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' : ''}
    ${color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' : ''}
    ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''}
    ${color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
    `;
  const tableHeaderClasses = "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
  const tableCellClasses = "px-4 py-3.5 whitespace-nowrap text-sm";
  const iconButtonClasses = "p-2 text-slate-400 hover:text-white rounded-md transition-colors duration-150 hover:bg-slate-700";

  const cargarCategorias = useCallback(async () => {
    if (!session?.user?.id) return;
    setCargandoCategorias(true); setError(null);
    try {
      const { data, error: errorFetch } = await obtenerCategorias('Egreso');
      if (errorFetch) throw errorFetch;
      setCategoriasEgreso(data || []);
    } catch (err) { setError(`Error cargando categorías: ${err.message}`); setCategoriasEgreso([]); }
    finally { setCargandoCategorias(false); }
  }, [session]);

  const cargarPresupuestos = useCallback(async () => {
    if (!session?.user?.id || !mesSeleccionado) return;
    setCargandoPresupuestos(true); setError(null);
    try {
      const { data, error: errorFetch } = await obtenerPresupuestosPorMes(mesSeleccionado);
      if (errorFetch) throw errorFetch;
      const presupuestosOrdenados = (data || []).sort((a, b) =>
        a.categoria_nombre?.localeCompare(b.categoria_nombre || '') || 0
      );
      setPresupuestosMes(presupuestosOrdenados);
      const logroOtorgado = await verificarYOtorgarLogro('PRESUPUESTO_CUMPLIDO_1X');
      if (logroOtorgado) { await fetchEstadoGamificacion(); }
    } catch (err) { setError(`Error cargando presupuestos: ${err.message}`); setPresupuestosMes([]); }
    finally { setCargandoPresupuestos(false); }
  }, [session, mesSeleccionado, verificarYOtorgarLogro, fetchEstadoGamificacion]);

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);
  useEffect(() => { cargarPresupuestos(); }, [cargarPresupuestos]);

  const handleMonthChange = (event) => {
    const [year, month] = event.target.value.split('-');
    setMesSeleccionado(getPrimerDiaMes(new Date(year, parseInt(month, 10) - 1, 1)));
    setEditandoPresupuesto(null); setSelectedCategoriaId(''); setMontoPresupuesto('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCategoriaId || !montoPresupuesto || isNaN(parseFloat(montoPresupuesto)) || parseFloat(montoPresupuesto) < 0) { alert("Datos inválidos para el presupuesto."); return; }
    if (!session?.user?.id) { setError("Sin ID de usuario."); return; }
    setError(null); setIsSubmitting(true);
    const montoNum = parseFloat(montoPresupuesto); const userId = session.user.id;
    try {
      if (editandoPresupuesto) {
        const datosActualizados = { monto: montoNum };
        const { error: errorEdit } = await editarPresupuesto(editandoPresupuesto.id, datosActualizados);
        if (errorEdit) throw errorEdit;
        handleCancelarEdicion();
      } else {
        const existe = presupuestosMes.some(p => p.categoria_id === parseInt(selectedCategoriaId, 10));
        if (existe) { alert(`Ya existe un presupuesto para esta categoría en el mes seleccionado.`); setIsSubmitting(false); return; }
        const presupuestoData = { categoria_id: parseInt(selectedCategoriaId, 10), monto: montoNum, mes: mesSeleccionado };
        const { error: errorAdd } = await agregarPresupuesto(presupuestoData, userId);
        if (errorAdd) throw errorAdd;
        setSelectedCategoriaId(''); setMontoPresupuesto('');
      }
      await cargarPresupuestos();
    } catch (err) {
      setError(`Error al guardar presupuesto: ${err.message || 'Desconocido'}`);
      if (!editandoPresupuesto && err.message?.includes('presupuesto_unico_mes_categoria_usuario')) { alert(`Error: Ya existe un presupuesto para esta categoría en el mes seleccionado.`); }
    } finally { setIsSubmitting(false); }
  };

  const handleEliminarClick = async (id) => {
    if (!window.confirm(`¿Estás seguro de eliminar este presupuesto?`)) return; setError(null);
    setIsSubmitting(true);
    try {
      const { error: errorDelete } = await eliminarPresupuesto(id);
      if (errorDelete) throw errorDelete;
      if (editandoPresupuesto?.id === id) { handleCancelarEdicion(); }
      await cargarPresupuestos();
    } catch (err) { setError(`Error al eliminar presupuesto: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const handleEditarClick = (presupuesto) => {
    setEditandoPresupuesto(presupuesto); setSelectedCategoriaId(String(presupuesto.categoria_id));
    setMontoPresupuesto(String(presupuesto.monto));
    document.getElementById('form-presupuesto-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleCancelarEdicion = () => { setEditandoPresupuesto(null); setSelectedCategoriaId(''); setMontoPresupuesto(''); };

  const categoriasDisponibles = useMemo(() => {
    if (editandoPresupuesto) return categoriasEgreso;
    const idsConPresupuesto = new Set(presupuestosMes.map(p => p.categoria_id));
    return categoriasEgreso.filter(cat => !idsConPresupuesto.has(cat.id));
  }, [categoriasEgreso, presupuestosMes, editandoPresupuesto]);

  const formatearMonedaLocal = useCallback((monto) => {
    if (loadingSettings || (typeof monto !== 'number' && typeof monto !== 'string')) return '---';
    const num = parseFloat(monto); if (isNaN(num)) return '---';
    return num.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="page-title !mb-0"> {/* !mb-0 para anular el margen inferior de page-title aquí */}
          <TargetIcon />
          Presupuestos Mensuales
        </h1>
        <div>
          <label htmlFor="monthSelector" className="sr-only">Mes</label>
          <input type="month" id="monthSelector" value={mesSeleccionado.substring(0, 7)} onChange={handleMonthChange} className={`${baseInputClasses} w-full sm:w-auto`} />
        </div>
      </div>

      <section id="form-presupuesto-section" className="card-base">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">
          {editandoPresupuesto ? `Editando para: ${editandoPresupuesto.categoria_nombre}` : `Agregar Presupuesto para ${new Date(mesSeleccionado + 'T00:00:00Z').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 items-end">
          <div>
            <label htmlFor="categoriaSelect" className={baseLabelClasses}>Categoría (Egreso) <span className="text-red-500">*</span></label>
            <select id="categoriaSelect" value={selectedCategoriaId} onChange={(e) => setSelectedCategoriaId(e.target.value)} required className={baseSelectClasses} disabled={cargandoCategorias || !!editandoPresupuesto || categoriasDisponibles.length === 0}>
              <option value="" disabled>-- Seleccionar Categoría --</option>
              {cargandoCategorias ? (<option disabled>Cargando...</option>) : 
               (editandoPresupuesto ? (<option value={editandoPresupuesto.categoria_id}>{editandoPresupuesto.categoria_nombre || `ID: ${editandoPresupuesto.categoria_id}`}</option>) : 
               (categoriasDisponibles.length > 0 ? (categoriasDisponibles.map(cat => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))) : 
               (<option disabled>No hay categorías sin presupuesto</option>)))}
            </select>
          </div>
          <div>
            <label htmlFor="montoPresupuesto" className={baseLabelClasses}>Monto Presupuestado <span className="text-red-500">*</span></label>
            <input type="number" id="montoPresupuesto" value={montoPresupuesto} onChange={(e) => setMontoPresupuesto(e.target.value)} placeholder="Ej: 500.00" required min="0" step="0.01" className={baseInputClasses} disabled={loadingSettings || isSubmitting} />
          </div>
          <div className="flex space-x-3 sm:col-span-3 md:col-span-1 md:self-end">
            <button type="submit" className={baseButtonClasses(editandoPresupuesto ? 'yellow' : 'green')} disabled={loadingSettings || cargandoCategorias || isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editandoPresupuesto ? <><SaveIcon className="mr-2" /> Guardar</> : <><PlusCircleIcon className="mr-2" /> Agregar</>)}
            </button>
            {editandoPresupuesto && (<button type="button" onClick={handleCancelarEdicion} className={baseButtonClasses('slate')} disabled={isSubmitting}><XCircleIcon className="mr-2" /> Cancelar</button>)}
          </div>
        </form>
        {error && !cargandoPresupuestos && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      <section className="card-base">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Presupuestos de {new Date(mesSeleccionado + 'T00:00:00Z').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
        {cargandoPresupuestos && <p className="text-slate-400">Cargando presupuestos...</p>}
        {error && cargandoPresupuestos && <p className="text-red-400">{error}</p>}
        {!cargandoPresupuestos && presupuestosMes.length === 0 && !error && (<p className="text-slate-500">No hay presupuestos definidos para este mes.</p>)}
        {!cargandoPresupuestos && presupuestosMes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm text-left">
              <thead className="bg-slate-700/50">
                <tr>
                  <th scope="col" className={tableHeaderClasses}>Categoría</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right`}>Presupuestado</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right`}>Gastado</th>
                  <th scope="col" className={`${tableHeaderClasses} text-right`}>Restante</th>
                  <th scope="col" className={`${tableHeaderClasses} w-1/4 sm:w-1/5 md:w-1/6`}>Progreso</th>
                  <th scope="col" className={`${tableHeaderClasses} text-center`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {presupuestosMes.map((pres) => {
                  const gastado = pres.gasto_real_mes ?? 0;
                  const restante = pres.restante ?? (pres.monto - gastado);
                  const progresoNum = parseFloat(pres.progreso);
                  const progreso = isNaN(progresoNum) ? (pres.monto > 0 ? (gastado / pres.monto) * 100 : 0) : Math.max(0, progresoNum);
                  const progresoDisplay = Math.min(progreso, 100);
                  const restanteColor = restante >= 0 ? 'text-green-400' : 'text-red-400';
                  const progresoBarColor = progreso <= 50 ? 'bg-green-500' : progreso <= 85 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <tr key={pres.id} className="hover:bg-slate-700/40 transition-colors duration-100">
                      <td className={`${tableCellClasses} text-slate-100 font-medium`}>{pres.categoria_nombre || 'N/A'}</td>
                      <td className={`${tableCellClasses} text-slate-300 text-right`}>{formatearMonedaLocal(pres.monto)}</td>
                      <td className={`${tableCellClasses} text-orange-400 text-right`}>{formatearMonedaLocal(gastado)}</td>
                      <td className={`${tableCellClasses} font-medium text-right ${restanteColor}`}>{formatearMonedaLocal(restante)}</td>
                      <td className={tableCellClasses}>
                        <div className="flex items-center">
                          <div className="w-full bg-slate-600 rounded-full h-2.5 mr-2" title={`${progreso.toFixed(0)}% gastado`}>
                            <div className={`h-2.5 rounded-full ${progresoBarColor}`} style={{ width: `${progresoDisplay}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{progreso.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={`${tableCellClasses} text-center`}>
                        <div className="flex justify-center items-center space-x-1">
                          <button onClick={() => handleEditarClick(pres)} className={`${iconButtonClasses} hover:text-yellow-400`} title="Editar"><Edit3Icon className="w-5 h-5" /></button>
                          <button onClick={() => handleEliminarClick(pres.id)} className={`${iconButtonClasses} hover:text-red-400`} title="Eliminar" disabled={isSubmitting}><Trash2Icon className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Presupuestos;
