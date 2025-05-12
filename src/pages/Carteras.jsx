// Archivo: src/pages/Carteras.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCarteras, agregarCartera, eliminarCartera, editarCartera } from '../lib/carterasApi';
import { obtenerTransacciones, eliminarTransaccion } from '../lib/transaccionesApi';
import TransactionList from '../components/TransactionList';

// --- Iconos SVG Inline ---
const WalletIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 7V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M3 5h18"/><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
  </svg>
);
const PlusCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const Edit3Icon = ({ className = "w-4 h-4" }) => ( // Ajustado tamaño para tabla
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const Trash2Icon = ({ className = "w-4 h-4" }) => ( // Ajustado tamaño
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const EyeIcon = ({ className = "w-4 h-4" }) => ( // Ajustado tamaño
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const XCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
// --- Fin Iconos SVG Inline ---

function Carteras({ session, navigateTo }) {
  const { currency, loadingSettings } = useSettings();
  const [carteras, setCarteras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaCarteraNombre, setNuevaCarteraNombre] = useState('');
  const [nuevaCarteraSaldo, setNuevaCarteraSaldo] = useState('');
  const [editandoCartera, setEditandoCartera] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCarteraId, setSelectedCarteraId] = useState(null);
  const [selectedCarteraNombre, setSelectedCarteraNombre] = useState('');
  const [historialCartera, setHistorialCartera] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState(null);

  const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const baseButtonClasses = (color = 'indigo', size = 'md') => `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''} ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' : ''} ${color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' : ''} ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''} ${color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}`;
  const tableHeaderClasses = "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
  const tableCellClasses = "px-4 py-3.5 whitespace-nowrap text-sm";
  const actionButtonTableCellClasses = `${tableCellClasses} text-center`;
  const iconButtonClasses = "p-2 text-slate-400 hover:text-white rounded-md transition-colors duration-150 hover:bg-slate-700";

  const cargarDatosCarteras = useCallback(async () => { if (!session?.user?.id) { setError("No hay sesión activa."); setCargando(false); setCarteras([]); return; } setCargando(true); setError(null); try { const { data, error: e } = await obtenerCarteras(); if (e) throw e; const carterasOrdenadas = (data || []).sort((a, b) => a.nombre.localeCompare(b.nombre)); setCarteras(carterasOrdenadas); } catch (err) { setError(`Error al cargar carteras: ${err.message}`); setCarteras([]); } finally { setCargando(false); } }, [session]);
  const cargarHistorial = useCallback(async (idCartera, nombreCartera) => { if (!idCartera) return; setSelectedCarteraId(idCartera); setSelectedCarteraNombre(nombreCartera); setCargandoHistorial(true); setErrorHistorial(null); setHistorialCartera([]); try { const { data, error: e } = await obtenerTransacciones({ cartera_id: idCartera }); if (e) throw e; setHistorialCartera(data || []); } catch (err) { setErrorHistorial(`Error al cargar historial: ${err.message}`); setHistorialCartera([]); } finally { setCargandoHistorial(false); } }, []);
  const cerrarHistorial = () => { setSelectedCarteraId(null); setHistorialCartera([]); setErrorHistorial(null); setSelectedCarteraNombre(''); };
  useEffect(() => { cargarDatosCarteras(); }, [cargarDatosCarteras]);

  const handleFormSubmit = async (e) => {
    e.preventDefault(); if (!nuevaCarteraNombre.trim()) { alert("El nombre no puede estar vacío."); return; } if (!session?.user?.id) { setError("Sin ID de usuario."); return; }
    setIsSubmitting(true); setError(null); const saldoInicialNum = parseFloat(nuevaCarteraSaldo); const saldoParaGuardar = isNaN(saldoInicialNum) ? 0 : saldoInicialNum; const userId = session.user.id;
    try {
      if (editandoCartera) { const datosActualizados = { nombre: nuevaCarteraNombre.trim(), saldo_inicial: saldoParaGuardar }; const { error: errorEdit } = await editarCartera(editandoCartera.id, datosActualizados); if (errorEdit) throw errorEdit; }
      else { const datosNuevaCartera = { nombre: nuevaCarteraNombre.trim(), saldo_inicial: saldoParaGuardar }; const { error: errorAdd } = await agregarCartera(datosNuevaCartera, userId); if (errorAdd) throw errorAdd; }
      setNuevaCarteraNombre(''); setNuevaCarteraSaldo(''); setEditandoCartera(null); cargarDatosCarteras();
    } catch (err) { setError(`Error al guardar cartera: ${err.message}`); } finally { setIsSubmitting(false); }
  };
  const handleEliminarCarteraClick = async (idCartera) => { if (!window.confirm(`¿Eliminar cartera? Las transacciones asociadas no se borrarán pero podrían quedar sin referencia de cartera.`)) return; setIsSubmitting(true); setError(null); try { const { error: e } = await eliminarCartera(idCartera); if (e) throw e; if (selectedCarteraId === idCartera) cerrarHistorial(); cargarDatosCarteras(); } catch (err) { setError(`Error al eliminar cartera: ${err.message}`); } finally { setIsSubmitting(false); } };
  const handleEditarCarteraClick = (cartera) => { setEditandoCartera(cartera); setNuevaCarteraNombre(cartera.nombre); setNuevaCarteraSaldo(String(cartera.saldo_inicial ?? '')); document.getElementById('form-cartera-section')?.scrollIntoView({ behavior: 'smooth' }); };
  const handleCancelarEdicion = () => { setEditandoCartera(null); setNuevaCarteraNombre(''); setNuevaCarteraSaldo(''); };
  const handleEliminarTransaccionDelHistorial = async (transaccionId) => { if (!window.confirm(`¿Eliminar esta transacción del historial?`)) return; setErrorHistorial(null); setCargandoHistorial(true); try { const { error: deleteError } = await eliminarTransaccion(transaccionId); if (deleteError) throw deleteError; if (selectedCarteraId) await cargarHistorial(selectedCarteraId, selectedCarteraNombre); await cargarDatosCarteras(); } catch (err) { console.error("Error eliminando transacción:", err); setErrorHistorial(`Error: ${err.message}`); } finally { setCargandoHistorial(false); } };
  const handleEditarTransaccionDelHistorial = (transaccion) => { if (navigateTo) { navigateTo('Transacciones', { transaccionIdAEditar: transaccion.id }); } else { console.error("navigateTo no está disponible en Carteras.jsx"); alert("Error de navegación. No se puede editar la transacción en este momento."); } };
  const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---'; return monto.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);

  return (
    <div className="space-y-8">
      <h1 className="page-title"><WalletIcon />Administrar Carteras</h1>
      <section id="form-cartera-section" className="card-base">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">{editandoCartera ? `Editando: ${editandoCartera.nombre}` : 'Agregar Nueva Cartera'}</h2>
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 items-end">
          <div className="sm:col-span-2 md:col-span-1"><label htmlFor="carteraNombre" className={baseLabelClasses}>Nombre Cartera <span className="text-red-500">*</span></label><input type="text" id="carteraNombre" value={nuevaCarteraNombre} onChange={(e) => setNuevaCarteraNombre(e.target.value)} required className={baseInputClasses} placeholder="Ej: Banco Principal, Efectivo" /></div>
          <div><label htmlFor="carteraSaldo" className={baseLabelClasses}>Saldo Inicial</label><input type="number" id="carteraSaldo" value={nuevaCarteraSaldo} onChange={(e) => setNuevaCarteraSaldo(e.target.value)} step="0.01" className={baseInputClasses} placeholder="0.00" disabled={loadingSettings} /></div>
          <div className="flex space-x-3 sm:col-span-3 md:col-span-1 md:self-end">
            <button type="submit" className={baseButtonClasses(editandoCartera ? 'yellow' : 'green')} disabled={cargando || isSubmitting}>{isSubmitting ? 'Guardando...' : (editandoCartera ? <><SaveIcon className="w-4 h-4 mr-2"/> Guardar</> : <><PlusCircleIcon className="w-4 h-4 mr-2"/> Agregar</>)}</button>
            {editandoCartera && (<button type="button" onClick={handleCancelarEdicion} className={baseButtonClasses('slate')} disabled={isSubmitting}><XCircleIcon className="w-4 h-4 mr-2"/> Cancelar</button>)}
          </div>
        </form>
        {error && !cargando && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>
      <section className="card-base">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Carteras Existentes</h2>
        {cargando && <p className="text-slate-400">Cargando carteras...</p>}
        {!cargando && carteras.length === 0 && !error && (<p className="text-slate-500">No hay carteras registradas.</p>)}
        {!cargando && carteras.length > 0 && (
          <div className="overflow-x-auto"><table className="w-full min-w-max text-sm text-left"><thead className="bg-slate-700/50"><tr><th scope="col" className={tableHeaderClasses}>Nombre</th><th scope="col" className={`${tableHeaderClasses} text-right`}>Saldo Inicial</th><th scope="col" className={`${tableHeaderClasses} text-right font-bold`}>Saldo Actual</th><th scope="col" className={actionButtonTableCellClasses}>Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-700">
              {carteras.map((cartera) => (<tr key={cartera.id} className={`hover:bg-slate-700/40 transition-colors duration-100 ${selectedCarteraId === cartera.id ? 'bg-slate-700/60' : ''}`}><td className={`${tableCellClasses} text-slate-100 font-medium`}>{cartera.nombre}</td><td className={`${tableCellClasses} text-slate-400 text-right`}>{formatearMonedaLocal(cartera.saldo_inicial)}</td><td className={`${tableCellClasses} text-right font-semibold ${parseFloat(cartera.saldo_actual) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(cartera.saldo_actual)}</td><td className={actionButtonTableCellClasses}><div className="flex justify-center items-center space-x-1"><button onClick={() => cargarHistorial(cartera.id, cartera.nombre)} className={`${iconButtonClasses} hover:text-blue-400`} title="Ver historial"><EyeIcon className="w-5 h-5" /></button><button onClick={() => handleEditarCarteraClick(cartera)} className={`${iconButtonClasses} hover:text-yellow-400`} title="Editar"><Edit3Icon className="w-5 h-5" /></button><button onClick={() => handleEliminarCarteraClick(cartera.id)} className={`${iconButtonClasses} hover:text-red-400`} title="Eliminar" disabled={isSubmitting}><Trash2Icon className="w-5 h-5" /></button></div></td></tr>))}
            </tbody>
          </table></div>
        )}
      </section>
      {selectedCarteraId && (
        <section className="card-base mt-8 border-t-4 border-brand-accent-primary">
          <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-slate-100">Historial de: <span className="text-brand-accent-primary">{selectedCarteraNombre}</span></h2><button onClick={cerrarHistorial} className={`${iconButtonClasses} text-slate-300`} aria-label="Cerrar historial" title="Cerrar Historial"><XCircleIcon className="w-5 h-5"/></button></div>
          {cargandoHistorial && <p className="text-slate-400">Cargando historial...</p>}
          {errorHistorial && <p className="text-red-400">{errorHistorial}</p>}
          {!cargandoHistorial && historialCartera.length === 0 && !errorHistorial && (<p className="text-slate-500">No hay transacciones para mostrar en esta cartera.</p>)}
          {!cargandoHistorial && historialCartera.length > 0 && (<TransactionList transacciones={historialCartera} onEdit={handleEditarTransaccionDelHistorial} onDelete={handleEliminarTransaccionDelHistorial} />)}
        </section>
      )}
    </div>
  );
}
export default Carteras;
