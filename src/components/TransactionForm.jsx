import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { obtenerCarteras } from '../lib/carterasApi';
import { obtenerCategorias } from '../lib/categoriasApi';
import { useSettings } from '../context/SettingsContext';

const tipos = ['Ingreso', 'Egreso', 'Transferencia'];

function SplitInputRow({ index, split, categoriasEgreso, onSplitChange, onRemoveSplit, currency, loadingSettings }) {
    const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || typeof monto !== 'number') return '---'; return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings]);
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
    const selectClasses = `${inputClasses} bg-gray-700`;
    return ( <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center py-1 border-b border-gray-700 last:border-b-0"> <div className="sm:col-span-5"> <label htmlFor={`split-cat-${index}`} className="sr-only">Categoría Split</label> <select id={`split-cat-${index}`} name="categoria_id" value={split.categoria_id || ''} onChange={(e) => onSplitChange(index, e)} required className={selectClasses} > <option value="" disabled>-- Categoría Egreso --</option> {categoriasEgreso.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)} </select> </div> <div className="sm:col-span-3"> <label htmlFor={`split-monto-${index}`} className="sr-only">Monto Split</label> <input type="number" id={`split-monto-${index}`} name="monto" value={split.monto || ''} onChange={(e) => onSplitChange(index, e)} required min="0.01" step="0.01" className={inputClasses} placeholder="Monto" disabled={loadingSettings} /> </div> <div className="sm:col-span-3"> <label htmlFor={`split-notas-${index}`} className="sr-only">Notas Split</label> <input type="text" id={`split-notas-${index}`} name="notas" value={split.notas || ''} onChange={(e) => onSplitChange(index, e)} className={inputClasses} placeholder="Nota (opcional)" /> </div> <div className="sm:col-span-1 text-right"> <button type="button" onClick={() => onRemoveSplit(index)} className="text-red-500 hover:text-red-400 p-1" title="Eliminar división" > <span role="img" aria-label="Eliminar">🗑️</span> </button> </div> </div> );
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

    useEffect(() => { const cL = async () => { setLoadingListas(true); setErrorListas(null); try { const [rC, rCa] = await Promise.all([obtenerCarteras(), obtenerCategorias()]); if (rC.error || rCa.error) throw new Error(rC.error?.message || rCa.error?.message); setListaCarteras(rC.data || []); setListaCategorias(rCa.data || []); } catch (e) { setErrorListas(`Error cargando listas: ${e.message}`); } finally { setLoadingListas(false); } }; cL(); }, []);
    useEffect(() => {
        if (transaccionInicial) {
            setMonto(transaccionInicial.monto || ''); setDescripcion(transaccionInicial.descripcion || ''); setTipo(transaccionInicial.tipo || 'Egreso'); setFecha(transaccionInicial.fecha ? new Date(transaccionInicial.fecha).toISOString().split('T')[0] : ''); setTagsInput(Array.isArray(transaccionInicial.tags) ? transaccionInicial.tags.join(', ') : '');
            if (transaccionInicial.tipo === 'Transferencia') { setCarteraOrigenId(transaccionInicial.cartera_origen_id || ''); setCarteraDestinoId(transaccionInicial.cartera_destino_id || ''); setIsSplitEnabled(false); setSplits([{ categoria_id: '', monto: '', notas: '' }]); }
            else if (transaccionInicial.is_split && Array.isArray(transaccionInicial.splits) && transaccionInicial.splits.length > 0) { setSplits(transaccionInicial.splits.map(s => ({ categoria_id: s.categoria_id || '', monto: s.monto || '', notas: s.notas || '' }))); setIsSplitEnabled(true); setCategoriaId(''); setCarteraId(transaccionInicial.cartera_id || ''); }
            else { setCategoriaId(transaccionInicial.categoria_id || ''); setCarteraId(transaccionInicial.cartera_id || ''); setIsSplitEnabled(false); setSplits([{ categoria_id: '', monto: '', notas: '' }]); }
        } else { resetForm(); }
    }, [transaccionInicial]);

    const resetForm = () => { setMonto(''); setDescripcion(''); setTipo('Egreso'); setCategoriaId(''); setCarteraId(''); setCarteraOrigenId(''); setCarteraDestinoId(''); setFecha(new Date().toISOString().split('T')[0]); setTagsInput(''); setSplits([{ categoria_id: '', monto: '', notas: '' }]); setIsSplitEnabled(false); };
    const categoriasEgreso = useMemo(() => listaCategorias.filter(cat => cat.tipo === 'Egreso'), [listaCategorias]);
    const categoriasFiltradas = useMemo(() => { if (tipo === 'Transferencia') return []; return listaCategorias.filter(cat => cat.tipo === tipo); }, [listaCategorias, tipo]);
    const handleSplitChange = (index, event) => { const { name, value } = event.target; const newSplits = [...splits]; newSplits[index] = { ...newSplits[index], [name]: value }; setSplits(newSplits); };
    const addSplitRow = () => { setSplits([...splits, { categoria_id: '', monto: '', notas: '' }]); };
    const removeSplitRow = (index) => { if (splits.length > 1) { const newSplits = splits.filter((_, i) => i !== index); setSplits(newSplits); } };
    const sumaSplits = useMemo(() => splits.reduce((sum, s) => sum + (parseFloat(s.monto) || 0), 0), [splits]);
    const montoTotalFloat = parseFloat(monto) || 0;
    const restanteSplit = montoTotalFloat - sumaSplits;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!monto || isNaN(montoTotalFloat)) { alert('Monto total inválido.'); return; }
        if (!fecha) { alert('Fecha requerida.'); return; }

        const tagsArray = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

        let datosTransaccion = {
          monto: montoTotalFloat,
          descripcion: descripcion.trim() || null,
          tipo,
          fecha,
          tags: tagsArray,
          categoria_id: null, cartera_id: null, cartera_origen_id: null, cartera_destino_id: null,
          splits: null, is_split: false
        };

        if (tipo === 'Transferencia') { if (!carteraOrigenId || !carteraDestinoId || carteraOrigenId === carteraDestinoId || montoTotalFloat <= 0) { alert('Datos de transferencia inválidos.'); return; } datosTransaccion.cartera_origen_id = parseInt(carteraOrigenId, 10); datosTransaccion.cartera_destino_id = parseInt(carteraDestinoId, 10); }
        else if (isSplitEnabled && tipo === 'Egreso') { if (!carteraId) { alert('Cartera para egreso dividido requerida.'); return; } if (splits.length === 0 || splits.some(s => !s.categoria_id || !s.monto || parseFloat(s.monto) <= 0)) { alert('Completa todas las divisiones con categoría y monto positivo.'); return; } if (Math.abs(restanteSplit) > 0.01) { alert(`La suma de divisiones (${sumaSplits.toFixed(2)}) no coincide con el monto total (${montoTotalFloat.toFixed(2)}). Restante: ${restanteSplit.toFixed(2)}`); return; } datosTransaccion.cartera_id = parseInt(carteraId, 10); datosTransaccion.splits = splits.map(s => ({ categoria_id: parseInt(s.categoria_id, 10), monto: parseFloat(s.monto), notas: s.notas || null })); datosTransaccion.is_split = true; datosTransaccion.categoria_id = null; }
        else { if (!categoriaId) { alert('Categoría requerida para Ingreso/Egreso.'); return; } if (!carteraId) { alert('Cartera requerida para Ingreso/Egreso.'); return; } if (montoTotalFloat <= 0) { alert('Monto debe ser positivo para Ingreso/Egreso.'); return; } datosTransaccion.categoria_id = parseInt(categoriaId, 10); datosTransaccion.cartera_id = parseInt(carteraId, 10); }

        console.log("[TransactionForm.jsx] Datos a enviar:", datosTransaccion, "ID para editar:", transaccionInicial?.id);

        // Llamada a onSubmit siempre con la misma estructura
        // La función padre (handleAgregar o handleEditar) distinguirá por el ID
        onSubmit(transaccionInicial?.id, datosTransaccion);

        if (!transaccionInicial) { resetForm(); }
    };

    const formatearMonedaLocal = useCallback((m) => { if (loadingSettings || typeof m !== 'number') return '---'; return m.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
    const selectClasses = `${inputClasses} bg-gray-700`;
    const buttonClasses = (color = 'indigo') => `px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

    if (errorListas) { return <div className="text-red-400 p-4">Error cargando listas: {errorListas}</div>; }

    return ( <form onSubmit={handleSubmit} className="space-y-4"> {/* ... (resto del JSX del formulario igual que antes) ... */} <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> <div><label htmlFor="monto" className={labelClasses}>Monto Total</label><input type="number" id="monto" value={monto} onChange={(e) => setMonto(e.target.value)} required step="0.01" className={inputClasses} /></div> <div className="sm:col-span-2"><label htmlFor="descripcion" className={labelClasses}>Descripción</label><input type="text" id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClasses} placeholder="Detalle del movimiento..."/></div> </div> <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> <div> <label htmlFor="tipo" className={labelClasses}>Tipo</label> <select id="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(''); setCarteraId(''); setCarteraOrigenId(''); setCarteraDestinoId(''); setIsSplitEnabled(false); setSplits([{ categoria_id: '', monto: '', notas: '' }]); }} required className={selectClasses}> {tipos.map(t => <option key={t} value={t}>{t}</option>)} </select> </div> {tipo !== 'Transferencia' && !isSplitEnabled && ( <> <div> <label htmlFor="categoriaId" className={labelClasses}>Categoría</label> <select id="categoriaId" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required={!isSplitEnabled} className={selectClasses} disabled={loadingListas || categoriasFiltradas.length === 0}> <option value="" disabled>-- Sel. --</option> {loadingListas ? <option>...</option> : categoriasFiltradas.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)} {!loadingListas && categoriasFiltradas.length === 0 && <option disabled>No hay</option>} </select> </div> <div> <label htmlFor="carteraId" className={labelClasses}>Cartera</label> <select id="carteraId" value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required={!isSplitEnabled} className={selectClasses} disabled={loadingListas}> <option value="" disabled>-- Sel. --</option> {loadingListas ? <option>...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)} </select> </div> </> )} {tipo === 'Transferencia' && ( <> <div> <label htmlFor="carteraOrigenId" className={labelClasses}>Origen</label> <select id="carteraOrigenId" value={carteraOrigenId} onChange={(e) => setCarteraOrigenId(e.target.value)} required className={selectClasses} disabled={loadingListas}> <option value="" disabled>-- Origen --</option> {loadingListas ? <option>...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)} </select> </div> <div> <label htmlFor="carteraDestinoId" className={labelClasses}>Destino</label> <select id="carteraDestinoId" value={carteraDestinoId} onChange={(e) => setCarteraDestinoId(e.target.value)} required className={selectClasses} disabled={loadingListas}> <option value="" disabled>-- Destino --</option> {loadingListas ? <option>...</option> : listaCarteras.filter(c => c.id !== parseInt(carteraOrigenId, 10)).map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)} </select> </div> </> )} {tipo === 'Egreso' && isSplitEnabled && ( <div> <label htmlFor="carteraIdSplit" className={labelClasses}>Cartera (Egreso)</label> <select id="carteraIdSplit" value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required className={selectClasses} disabled={loadingListas}> <option value="" disabled>-- Sel. --</option> {loadingListas ? <option>...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)} </select> </div> )} </div> {tipo === 'Egreso' && ( <div className="flex items-center mt-2"> <input id="split-enable" type="checkbox" checked={isSplitEnabled} onChange={(e) => setIsSplitEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-700" /> <label htmlFor="split-enable" className="ml-2 text-sm text-gray-300">Dividir en categorías</label> </div> )} {isSplitEnabled && tipo === 'Egreso' && ( <div className="mt-4 p-4 border border-gray-700 rounded-md bg-gray-800 space-y-3"> <h4 className="text-md font-medium text-gray-200 mb-2">Divisiones por Categoría</h4> {splits.map((split, index) => ( <SplitInputRow key={index} index={index} split={split} categoriasEgreso={categoriasEgreso} onSplitChange={handleSplitChange} onRemoveSplit={removeSplitRow} currency={currency} loadingSettings={loadingSettings} /> ))} <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700"> <button type="button" onClick={addSplitRow} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center"> <span role="img" aria-label="Añadir" className="mr-1 text-lg">➕</span> Añadir División </button> <div className={`text-sm font-medium ${Math.abs(restanteSplit) < 0.01 ? 'text-green-400' : 'text-red-400'}`}> Restante: {formatearMonedaLocal(restanteSplit)} </div> </div> </div> )} <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> <div><label htmlFor="fecha" className={labelClasses}>Fecha</label><input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={inputClasses} /></div> <div className="sm:col-span-2"> <label htmlFor="tags" className={labelClasses}>Etiquetas (separadas por coma)</label> <input type="text" id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputClasses} placeholder="Ej: vacaciones, importante" /> </div> </div> <div className="flex justify-start pt-4 space-x-3"> <button type="submit" className={buttonClasses(transaccionInicial ? 'yellow' : 'green')} disabled={loadingListas}> {transaccionInicial ? '💾 Guardar Cambios' : '💾 Guardar'} </button> {transaccionInicial && ( <button type="button" onClick={onCancelEdit} className={buttonClasses('gray')}> Cancelar </button> )} </div> </form> );
}

export default TransactionForm;
