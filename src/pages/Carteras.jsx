// Archivo: src/pages/Carteras.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCarteras, agregarCartera, eliminarCartera, editarCartera } from '../lib/carterasApi';
import { obtenerTransacciones, eliminarTransaccion } from '../lib/transaccionesApi';
import TransactionList from '../components/TransactionList';

// Se necesita navigateTo como prop
function Carteras({ session, navigateTo }) { 
  const { currency, loadingSettings } = useSettings();
  const [carteras, setCarteras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaCarteraNombre, setNuevaCarteraNombre] = useState('');
  const [nuevaCarteraSaldo, setNuevaCarteraSaldo] = useState('');
  const [editandoCartera, setEditandoCartera] = useState(null);

  const [selectedCarteraId, setSelectedCarteraId] = useState(null);
  const [selectedCarteraNombre, setSelectedCarteraNombre] = useState('');
  const [historialCartera, setHistorialCartera] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState(null);

  const cargarDatosCarteras = useCallback(async () => {
    if (!session?.user?.id) {
      setError("No hay sesión activa."); setCargando(false); setCarteras([]); return;
    }
    setCargando(true); setError(null);
    try {
      const { data, error: e } = await obtenerCarteras();
      if (e) throw e;
      const carterasOrdenadas = (data || []).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setCarteras(carterasOrdenadas);
    } catch (err) { setError(`Error al cargar carteras: ${err.message}`); setCarteras([]); }
    finally { setCargando(false); }
  }, [session]);

  const cargarHistorial = useCallback(async (idCartera, nombreCartera) => {
    if (!idCartera) return;
    setSelectedCarteraId(idCartera); setSelectedCarteraNombre(nombreCartera);
    setCargandoHistorial(true); setErrorHistorial(null); setHistorialCartera([]);
    try {
      const { data, error: e } = await obtenerTransacciones({ cartera_id: idCartera });
      if (e) throw e;
      setHistorialCartera(data || []);
    } catch (err) { setErrorHistorial(`Error al cargar historial: ${err.message}`); setHistorialCartera([]); }
    finally { setCargandoHistorial(false); }
  }, []);

  const cerrarHistorial = () => { setSelectedCarteraId(null); setHistorialCartera([]); setErrorHistorial(null); setSelectedCarteraNombre(''); };

  useEffect(() => { cargarDatosCarteras(); }, [cargarDatosCarteras]);

  const handleAgregarSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaCarteraNombre.trim()) { alert("El nombre no puede estar vacío."); return; }
    if (!session?.user?.id) { setError("Sin ID."); return; }
    const saldoInicialNum = parseFloat(nuevaCarteraSaldo);
    const saldoParaGuardar = isNaN(saldoInicialNum) ? 0 : saldoInicialNum;
    setError(null);
    const datosNuevaCartera = { nombre: nuevaCarteraNombre.trim(), saldo_inicial: saldoParaGuardar };
    const userId = session.user.id;
    try {
      const { error: errorAdd } = await agregarCartera(datosNuevaCartera, userId);
      if (errorAdd) throw errorAdd;
      setNuevaCarteraNombre(''); setNuevaCarteraSaldo('');
      cargarDatosCarteras();
    } catch (err) { setError(`Error al agregar cartera: ${err.message}`); }
  };

  const handleEliminarCarteraClick = async (idCartera) => {
    if (!window.confirm(`¿Eliminar cartera? Transacciones no se borrarán.`)) return;
    setError(null);
    try {
      const { error: e } = await eliminarCartera(idCartera);
      if (e) throw e;
      if (selectedCarteraId === idCartera) cerrarHistorial();
      cargarDatosCarteras();
    } catch (err) { setError(`Error al eliminar cartera: ${err.message}`); }
  };

  const handleEditarCarteraClick = (cartera) => { setEditandoCartera(cartera); setNuevaCarteraNombre(cartera.nombre); setNuevaCarteraSaldo(String(cartera.saldo_inicial ?? '')); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCancelarEdicion = () => { setEditandoCartera(null); setNuevaCarteraNombre(''); setNuevaCarteraSaldo(''); };

  const handleGuardarEdicionSubmit = async (e) => {
    e.preventDefault();
    if (!editandoCartera || !nuevaCarteraNombre.trim()) { alert("Nombre vacío."); return; }
    const saldoInicialNum = parseFloat(nuevaCarteraSaldo);
    const saldoParaGuardar = isNaN(saldoInicialNum) ? 0 : saldoInicialNum;
    setError(null);
    const datosActualizados = { nombre: nuevaCarteraNombre.trim(), saldo_inicial: saldoParaGuardar };
    try {
      const { error: errorEdit } = await editarCartera(editandoCartera.id, datosActualizados);
      if (errorEdit) throw errorEdit;
      handleCancelarEdicion();
      cargarDatosCarteras();
    } catch (err) { setError(`Error al editar cartera: ${err.message}`); }
  };

  const handleEliminarTransaccionDelHistorial = async (transaccionId) => {
    if (!window.confirm(`¿Eliminar esta transacción del historial?`)) return;
    setErrorHistorial(null); setCargandoHistorial(true);
    try {
      const { error: deleteError } = await eliminarTransaccion(transaccionId);
      if (deleteError) throw deleteError;
      if (selectedCarteraId) await cargarHistorial(selectedCarteraId, selectedCarteraNombre);
      await cargarDatosCarteras();
    } catch (err) { console.error("Error eliminando transacción:", err); setErrorHistorial(`Error: ${err.message}`); }
    // setCargandoHistorial(false) es manejado por cargarHistorial
  };
  
  // --- FUNCIÓN MODIFICADA PARA EDITAR TRANSACCIÓN DEL HISTORIAL ---
  const handleEditarTransaccionDelHistorial = (transaccion) => {
    console.log("[Carteras.jsx] Solicitando editar transacción ID:", transaccion.id);
    if (navigateTo) {
      navigateTo('Transacciones', { transaccionIdAEditar: transaccion.id });
    } else {
      console.error("navigateTo no está disponible en Carteras.jsx");
      alert("Error de navegación. No se puede editar la transacción en este momento.");
    }
  };

  const formatearMonedaLocal = useCallback((monto) => {
    if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currency });
  }, [currency, loadingSettings]);

  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`;
  const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;
  const actionButtonClasses = "font-medium px-2 py-1 rounded hover:opacity-80 whitespace-nowrap text-xs";

  return (
    <div className="space-y-8">
      <div className="flex items-center text-white">
        <span className="mr-3 text-2xl" role="img" aria-label="Cartera">💰</span>
        <h1 className="text-2xl font-semibold">Administrar Carteras</h1>
      </div>
      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {editandoCartera ? `Editando Cartera: ${editandoCartera.nombre}` : 'Agregar Nueva Cartera'}
        </h2>
        <form onSubmit={editandoCartera ? handleGuardarEdicionSubmit : handleAgregarSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div><label htmlFor="carteraNombre" className={labelClasses}>Nombre Cartera</label><input type="text" id="carteraNombre" value={nuevaCarteraNombre} onChange={(e) => setNuevaCarteraNombre(e.target.value)} required className={inputClasses} /></div>
          <div><label htmlFor="carteraSaldo" className={labelClasses}>Saldo Inicial</label><input type="number" id="carteraSaldo" value={nuevaCarteraSaldo} onChange={(e) => setNuevaCarteraSaldo(e.target.value)} step="0.01" className={inputClasses} placeholder="0.00" /></div>
          <div className="flex space-x-2 sm:pt-6"><button type="submit" className={buttonClasses(editandoCartera ? 'yellow' : 'green')} disabled={cargando}>{editandoCartera ? '💾 Guardar Cambios' : '➕ Agregar Cartera'}</button>{editandoCartera && (<button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}>Cancelar</button>)}</div>
        </form>
        {error && !cargando && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Carteras Existentes</h2>
        {cargando && <p className="text-blue-400">Cargando carteras...</p>}
        {!cargando && carteras.length === 0 && !error && (<p className="text-gray-500">No hay carteras registradas.</p>)}
        {!cargando && carteras.length > 0 && (
          <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Saldo Inicial</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Saldo Actual</th>
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carteras.map((cartera) => (
                  <tr key={cartera.id} className={`bg-gray-800 border-b border-gray-700 hover:bg-gray-600 ${selectedCarteraId === cartera.id ? 'bg-gray-700/70' : ''}`}>
                    <td className="px-4 py-4 font-medium text-gray-300 whitespace-nowrap">{cartera.nombre}</td>
                    <td className="px-4 py-4 text-gray-400 whitespace-nowrap">{formatearMonedaLocal(cartera.saldo_inicial)}</td>
                    <td className={`px-4 py-4 whitespace-nowrap font-semibold ${parseFloat(cartera.saldo_actual) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(cartera.saldo_actual)}</td>
                    <td className="px-4 py-4 text-center">
                       <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row justify-center items-center sm:space-x-1">
                          <button onClick={() => cargarHistorial(cartera.id, cartera.nombre)} className={`${actionButtonClasses} text-blue-400 bg-gray-700 hover:bg-gray-600 w-full sm:w-auto`} aria-label={`Ver historial de ${cartera.nombre}`}> <span role="img" aria-label="Historial">👁️</span> Historial </button>
                          <button onClick={() => handleEditarCarteraClick(cartera)} className={`${actionButtonClasses} text-yellow-400 bg-gray-700 hover:bg-gray-600 w-full sm:w-auto`} aria-label={`Editar ${cartera.nombre}`}> <span role="img" aria-label="Editar">✏️</span> Editar </button>
                          <button onClick={() => handleEliminarCarteraClick(cartera.id)} className={`${actionButtonClasses} text-red-500 bg-gray-700 hover:bg-gray-600 w-full sm:w-auto`} aria-label={`Eliminar ${cartera.nombre}`}> <span role="img" aria-label="Eliminar">🗑️</span> Eliminar </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedCarteraId && (
        <section className="bg-gray-900 p-6 rounded-lg shadow-lg mt-8 border-t-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Historial de: <span className="text-blue-400">{selectedCarteraNombre}</span></h2>
            <button onClick={cerrarHistorial} className="text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-gray-700" aria-label="Cerrar historial"><span role="img" aria-label="Cerrar">❌</span></button>
          </div>
          {cargandoHistorial && <p className="text-blue-400">Cargando historial...</p>}
          {errorHistorial && <p className="text-red-400">{errorHistorial}</p>}
          {!cargandoHistorial && historialCartera.length === 0 && !errorHistorial && (<p className="text-gray-500">No hay transacciones para mostrar en esta cartera.</p>)}
          {!cargandoHistorial && historialCartera.length > 0 && (
            <TransactionList
              transacciones={historialCartera}
              onEdit={handleEditarTransaccionDelHistorial} // <--- FUNCIÓN MODIFICADA
              onDelete={handleEliminarTransaccionDelHistorial}
            />
          )}
        </section>
      )}
    </div>
  );
}

export default Carteras;
