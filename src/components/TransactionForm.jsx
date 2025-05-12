// Archivo: src/components/TransactionForm.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { obtenerCarteras } from '../lib/carterasApi';
import { obtenerCategorias } from '../lib/categoriasApi';
import { useSettings } from '../context/SettingsContext';

// --- Iconos SVG Inline ---
const PlusCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const Trash2Icon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
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
// --- Fin Iconos SVG Inline ---

const tipos = ['Ingreso', 'Egreso', 'Transferencia'];

function SplitInputRow({ index, split, categoriasEgreso, onSplitChange, onRemoveSplit, currency, loadingSettings }) {
  const { currency: contextCurrency, loadingSettings: contextLoadingSettings } = useSettings();
  const currentCurrency = currency || contextCurrency;
  const isLoadingSettings = loadingSettings || contextLoadingSettings;

  const formatearMonedaLocal = useCallback((monto) => {
    if (isLoadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currentCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currentCurrency, isLoadingSettings]);

  const baseInputClasses = "block w-full px-3 py-2 bg-slate-700 border-slate-600 rounded-md text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60";
  const baseSelectClasses = `${baseInputClasses} appearance-none pr-8 bg-slate-700`;

  return (
    <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-center py-2 border-b border-slate-700 last:border-b-0">
      <div className="col-span-12 sm:col-span-5">
        <label htmlFor={`split-cat-${index}`} className="sr-only">Categoría División {index + 1}</label>
        <select id={`split-cat-${index}`} name="categoria_id" value={split.categoria_id || ''} onChange={(e) => onSplitChange(index, e)} required className={baseSelectClasses}>
          <option value="" disabled>-- Categoría Egreso --</option>
          {categoriasEgreso.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
        </select>
      </div>
      <div className="col-span-6 sm:col-span-3">
        <label htmlFor={`split-monto-${index}`} className="sr-only">Monto División {index + 1}</label>
        <input type="number" id={`split-monto-${index}`} name="monto" value={split.monto || ''} onChange={(e) => onSplitChange(index, e)} required min="0.01" step="0.01" className={baseInputClasses} placeholder="Monto" disabled={isLoadingSettings} />
      </div>
      <div className="col-span-10 sm:col-span-3">
        <label htmlFor={`split-notas-${index}`} className="sr-only">Notas División {index + 1}</label>
        <input type="text" id={`split-notas-${index}`} name="notas" value={split.notas || ''} onChange={(e) => onSplitChange(index, e)} className={baseInputClasses} placeholder="Nota (opc.)" />
      </div>
      <div className="col-span-2 sm:col-span-1 text-right sm:text-center">
        {index > 0 && (
          <button type="button" onClick={() => onRemoveSplit(index)} className="p-1.5 text-red-500 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors" title="Eliminar división">
            <Trash2Icon className="w-4 h-4" />
            <span className="sr-only">Eliminar División</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TransactionForm({ onSubmit, transaccionInicial, onCancelEdit }) {
  const { currency, loadingSettings } = useSettings();
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('Egreso');
  const [categoriaId, setCategoriaId] = useState('');
  const [carteraId, setCarteraId] = useState('');
  const [carteraOrigenId, setCarteraOrigenId] = useState('');
  const [carteraDestinoId, setCarteraDestinoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [splits, setSplits] = useState([{ categoria_id: '', monto: '', notas: '' }]);
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [listaCarteras, setListaCarteras] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [loadingListas, setLoadingListas] = useState(true);
  const [errorListas, setErrorListas] = useState(null);

  useEffect(() => {
    const cargarDependencias = async () => {
      setLoadingListas(true); setErrorListas(null);
      try {
        const [resCarteras, resCategorias] = await Promise.all([obtenerCarteras(), obtenerCategorias()]);
        if (resCarteras.error) throw new Error(`Carteras: ${resCarteras.error.message}`);
        if (resCategorias.error) throw new Error(`Categorías: ${resCategorias.error.message}`);
        setListaCarteras(resCarteras.data || []); setListaCategorias(resCategorias.data || []);
      } catch (e) { setErrorListas(`Error cargando listas: ${e.message}`); console.error("Error en TransactionForm al cargar dependencias:", e); }
      finally { setLoadingListas(false); }
    };
    cargarDependencias();
  }, []);

  useEffect(() => {
    if (transaccionInicial) {
      setMonto(String(transaccionInicial.monto || '')); setDescripcion(transaccionInicial.descripcion || ''); setTipo(transaccionInicial.tipo || 'Egreso'); setFecha(transaccionInicial.fecha ? new Date(transaccionInicial.fecha).toISOString().split('T')[0] : ''); setTagsInput(Array.isArray(transaccionInicial.tags) ? transaccionInicial.tags.join(', ') : '');
      if (transaccionInicial.tipo === 'Transferencia') {
        setCarteraOrigenId(String(transaccionInicial.cartera_origen_id || '')); setCarteraDestinoId(String(transaccionInicial.cartera_destino_id || '')); setIsSplitEnabled(false); setSplits([{ categoria_id: '', monto: '', notas: '' }]); setCategoriaId(''); setCarteraId('');
      } else if (transaccionInicial.is_split && Array.isArray(transaccionInicial.splits) && transaccionInicial.splits.length > 0) {
        setSplits(transaccionInicial.splits.map(s => ({ categoria_id: String(s.categoria_id || ''), monto: String(s.monto || ''), notas: s.notas || '' }))); setIsSplitEnabled(true); setCategoriaId(''); setCarteraId(String(transaccionInicial.cartera_id || ''));
      } else {
        setCategoriaId(String(transaccionInicial.categoria_id || '')); setCarteraId(String(transaccionInicial.cartera_id || '')); setIsSplitEnabled(false); setSplits([{ categoria_id: '', monto: '', notas: '' }]);
      }
    } else { resetForm(); }
  }, [transaccionInicial]);

  const resetForm = () => {
    setMonto(''); setDescripcion(''); setTipo('Egreso'); setCategoriaId(''); setCarteraId(''); setCarteraOrigenId(''); setCarteraDestinoId(''); setFecha(new Date().toISOString().split('T')[0]); setTagsInput(''); setSplits([{ categoria_id: '', monto: '', notas: '' }]); setIsSplitEnabled(false);
  };

  const categoriasEgreso = useMemo(() => listaCategorias.filter(cat => cat.tipo === 'Egreso'), [listaCategorias]);
  const categoriasFiltradas = useMemo(() => { if (tipo === 'Transferencia' || isSplitEnabled) return []; return listaCategorias.filter(cat => cat.tipo === tipo); }, [listaCategorias, tipo, isSplitEnabled]);
  const handleSplitChange = (index, event) => { const { name, value } = event.target; const newSplits = [...splits]; newSplits[index] = { ...newSplits[index], [name]: value }; setSplits(newSplits); };
  const addSplitRow = () => setSplits([...splits, { categoria_id: '', monto: '', notas: '' }]);
  const removeSplitRow = (index) => { if (splits.length > 1) { const newSplits = splits.filter((_, i) => i !== index); setSplits(newSplits); } };
  const sumaSplits = useMemo(() => splits.reduce((sum, s) => sum + (parseFloat(s.monto) || 0), 0), [splits]);
  const montoTotalFloat = parseFloat(monto) || 0;
  const restanteSplit = montoTotalFloat - sumaSplits;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loadingListas) { alert('Espere a que carguen las listas.'); return; }
    if (!monto || isNaN(montoTotalFloat)) { alert('El Monto Total es inválido.'); return; }
    if (!fecha) { alert('La Fecha es requerida.'); return; }
    const tagsArray = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
    let datosTransaccion = {
      monto: montoTotalFloat, descripcion: descripcion.trim() || null, tipo, fecha, tags: tagsArray,
      categoria_id: null, cartera_id: null, cartera_origen_id: null, cartera_destino_id: null, splits: null, is_split: false
    };
    if (tipo === 'Transferencia') {
      if (!carteraOrigenId || !carteraDestinoId) { alert('Cartera de Origen y Destino son requeridas para Transferencias.'); return; }
      if (carteraOrigenId === carteraDestinoId) { alert('Cartera de Origen y Destino deben ser diferentes.'); return; }
      if (montoTotalFloat <= 0) { alert('El monto de la Transferencia debe ser positivo.'); return; }
      datosTransaccion.cartera_origen_id = parseInt(carteraOrigenId, 10); datosTransaccion.cartera_destino_id = parseInt(carteraDestinoId, 10);
    } else if (isSplitEnabled && tipo === 'Egreso') {
      if (!carteraId) { alert('La Cartera es requerida para un Egreso dividido.'); return; }
      if (splits.length === 0 || splits.some(s => !s.categoria_id || !s.monto || parseFloat(s.monto) <= 0)) { alert('Cada división debe tener una Categoría y un Monto positivo.'); return; }
      if (Math.abs(restanteSplit) > 0.01) { alert(`La suma de las divisiones (${formatearMonedaLocal(sumaSplits)}) no coincide con el Monto Total (${formatearMonedaLocal(montoTotalFloat)}). Restante: ${formatearMonedaLocal(restanteSplit)}`); return; }
      datosTransaccion.cartera_id = parseInt(carteraId, 10); datosTransaccion.splits = splits.map(s => ({ categoria_id: parseInt(s.categoria_id, 10), monto: parseFloat(s.monto), notas: s.notas || null })); datosTransaccion.is_split = true;
    } else {
      if (!categoriaId) { alert('La Categoría es requerida para Ingresos/Egresos.'); return; }
      if (!carteraId) { alert('La Cartera es requerida para Ingresos/Egresos.'); return; }
      if (montoTotalFloat <= 0) { alert('El monto para Ingresos/Egresos debe ser positivo.'); return; }
      datosTransaccion.categoria_id = parseInt(categoriaId, 10); datosTransaccion.cartera_id = parseInt(carteraId, 10);
    }
    onSubmit(transaccionInicial?.id, datosTransaccion);
    if (!transaccionInicial) resetForm();
  };

  const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---'; return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings]);
  const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60 disabled:cursor-not-allowed";
  const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
  const baseButtonClasses = (color = 'indigo') => `inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''} ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' : ''} ${color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' : ''} ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''} ${color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}`;

  if (loadingListas && !errorListas) { return <div className="text-center py-10"><p className="text-slate-400">Cargando formulario...</p></div>; }
  if (errorListas) { return <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">Error cargando datos del formulario: {errorListas}</div>; }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <div className="md:col-span-1"><label htmlFor="monto" className={baseLabelClasses}>Monto Total <span className="text-red-500">*</span></label><input type="number" id="monto" value={monto} onChange={(e) => setMonto(e.target.value)} required step="0.01" className={baseInputClasses} placeholder="0.00" disabled={loadingSettings} /></div>
        <div className="md:col-span-2"><label htmlFor="descripcion" className={baseLabelClasses}>Descripción</label><input type="text" id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={baseInputClasses} placeholder="Ej: Compra semanal, Salario, etc." /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <div><label htmlFor="tipo" className={baseLabelClasses}>Tipo <span className="text-red-500">*</span></label><select id="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(''); setCarteraId(''); setCarteraOrigenId(''); setCarteraDestinoId(''); setIsSplitEnabled(false); setSplits([{ categoria_id: '', monto: '', notas: '' }]); }} required className={baseSelectClasses}>{tipos.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        {tipo !== 'Transferencia' && !isSplitEnabled && (<><div><label htmlFor="categoriaId" className={baseLabelClasses}>Categoría <span className="text-red-500">*</span></label><select id="categoriaId" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required={!isSplitEnabled} className={baseSelectClasses} disabled={loadingListas || categoriasFiltradas.length === 0}><option value="" disabled>-- Seleccionar --</option>{loadingListas ? <option>Cargando...</option> : categoriasFiltradas.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}{!loadingListas && categoriasFiltradas.length === 0 && <option disabled>No hay categorías para este tipo</option>}</select></div><div><label htmlFor="carteraId" className={baseLabelClasses}>Cartera <span className="text-red-500">*</span></label><select id="carteraId" value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required={!isSplitEnabled} className={baseSelectClasses} disabled={loadingListas}><option value="" disabled>-- Seleccionar --</option>{loadingListas ? <option>Cargando...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}</select></div></>)}
        {tipo === 'Transferencia' && (<><div><label htmlFor="carteraOrigenId" className={baseLabelClasses}>Cartera Origen <span className="text-red-500">*</span></label><select id="carteraOrigenId" value={carteraOrigenId} onChange={(e) => setCarteraOrigenId(e.target.value)} required className={baseSelectClasses} disabled={loadingListas}><option value="" disabled>-- Seleccionar Origen --</option>{loadingListas ? <option>Cargando...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}</select></div><div><label htmlFor="carteraDestinoId" className={baseLabelClasses}>Cartera Destino <span className="text-red-500">*</span></label><select id="carteraDestinoId" value={carteraDestinoId} onChange={(e) => setCarteraDestinoId(e.target.value)} required className={baseSelectClasses} disabled={loadingListas}><option value="" disabled>-- Seleccionar Destino --</option>{loadingListas ? <option>Cargando...</option> : listaCarteras.filter(c => String(c.id) !== String(carteraOrigenId)).map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}</select></div></>)}
        {tipo === 'Egreso' && isSplitEnabled && (<div><label htmlFor="carteraIdSplit" className={baseLabelClasses}>Cartera (Egreso Dividido) <span className="text-red-500">*</span></label><select id="carteraIdSplit" value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required className={baseSelectClasses} disabled={loadingListas}><option value="" disabled>-- Seleccionar Cartera --</option>{loadingListas ? <option>Cargando...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}</select></div>)}
      </div>
      {tipo === 'Egreso' && (<div className="flex items-center pt-2"><input id="split-enable" type="checkbox" checked={isSplitEnabled} onChange={(e) => { setIsSplitEnabled(e.target.checked); if (!e.target.checked) { setSplits([{ categoria_id: '', monto: '', notas: '' }]); } else { setCategoriaId(''); } }} className="h-4 w-4 rounded border-slate-500 text-brand-accent-primary focus:ring-brand-accent-primary bg-slate-700" /><label htmlFor="split-enable" className="ml-2 text-sm text-slate-300">Dividir egreso en múltiples categorías</label></div>)}
      {isSplitEnabled && tipo === 'Egreso' && (<div className="mt-4 p-4 border border-slate-700 rounded-lg bg-slate-800/50 space-y-3"><h4 className="text-md font-semibold text-slate-200 mb-1">Divisiones por Categoría</h4>{splits.map((split, index) => (<SplitInputRow key={index} index={index} split={split} categoriasEgreso={categoriasEgreso} onSplitChange={handleSplitChange} onRemoveSplit={removeSplitRow} />))}<div className="flex flex-col sm:flex-row justify-between items-center mt-3 pt-3 border-t border-slate-700"><button type="button" onClick={addSplitRow} className="flex items-center text-sm font-medium text-brand-accent-primary hover:text-opacity-80 transition-colors py-1.5 px-3 rounded-md hover:bg-brand-accent-primary/10"><PlusCircleIcon className="w-4 h-4 mr-1.5" />Añadir División</button><div className={`text-sm font-medium mt-2 sm:mt-0 ${Math.abs(restanteSplit) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>Restante por asignar: {formatearMonedaLocal(restanteSplit)}</div></div></div>)}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <div><label htmlFor="fecha" className={baseLabelClasses}>Fecha <span className="text-red-500">*</span></label><input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={baseInputClasses} /></div>
        <div className="md:col-span-2"><label htmlFor="tags" className={baseLabelClasses}>Etiquetas (separadas por coma)</label><input type="text" id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={baseInputClasses} placeholder="Ej: viaje, urgente, personal" /></div>
      </div>
      <div className="flex items-center justify-start pt-4 space-x-3">
        <button type="submit" className={baseButtonClasses(transaccionInicial ? 'yellow' : 'green')} disabled={loadingListas || loadingSettings}>{transaccionInicial ? <><SaveIcon className="w-4 h-4 mr-2"/>Actualizar Transacción</> : <><SaveIcon className="w-4 h-4 mr-2"/>Guardar Transacción</>}</button>
        {transaccionInicial && onCancelEdit && (<button type="button" onClick={onCancelEdit} className={baseButtonClasses('slate')}><XCircleIcon className="w-4 h-4 mr-2"/>Cancelar Edición</button>)}
      </div>
    </form>
  );
}

export default TransactionForm;
