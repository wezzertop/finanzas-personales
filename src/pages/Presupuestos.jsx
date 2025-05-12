// Archivo: src/pages/Presupuestos.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi';
import { obtenerPresupuestosPorMes, agregarPresupuesto, editarPresupuesto, eliminarPresupuesto } from '../lib/presupuestosApi';
import { useGamificacion } from '../context/GamificacionContext'; // <--- NUEVA IMPORTACIÓN

// Función auxiliar para obtener el primer día del mes en formato YYYY-MM-DD
const getPrimerDiaMes = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('sv-SE');
};

function Presupuestos({ session }) {
  const { currency, loadingSettings } = useSettings();
  const { verificarYOtorgarLogro, fetchEstadoGamificacion } = useGamificacion(); // <--- OBTENER FUNCIONES DEL CONTEXTO

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
      console.log("[Presupuestos.jsx] Presupuestos cargados:", presupuestosOrdenados);

      // --- LÓGICA DE GAMIFICACIÓN AL CARGAR PRESUPUESTOS ---
      // La función SQL 'fn_verificar_y_otorgar_logro' para 'PRESUPUESTO_CUMPLIDO_1X'
      // ya verifica internamente los presupuestos del mes pasado.
      // Solo necesitamos llamarla para que haga su trabajo.
      // No es necesario pasarle detalles específicos del presupuesto aquí,
      // a menos que el logro fuera "Cumpliste el presupuesto X".
      console.log("[Presupuestos.jsx] Verificando logro 'PRESUPUESTO_CUMPLIDO_1X'");
      const logroOtorgado = await verificarYOtorgarLogro('PRESUPUESTO_CUMPLIDO_1X');
      if (logroOtorgado) {
        console.log("[Presupuestos.jsx] Logro 'PRESUPUESTO_CUMPLIDO_1X' procesado. Recargando estado de gamificación.");
        await fetchEstadoGamificacion(); // Actualizar estado global si se otorgó algo
      }
      // --- FIN LÓGICA DE GAMIFICACIÓN ---

    } catch (err) { setError(`Error cargando presupuestos: ${err.message}`); setPresupuestosMes([]); }
    finally { setCargandoPresupuestos(false); }
  }, [session, mesSeleccionado, verificarYOtorgarLogro, fetchEstadoGamificacion]); // Añadir dependencias de gamificación

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);
  useEffect(() => { cargarPresupuestos(); }, [cargarPresupuestos]); // Se llama cuando mesSeleccionado cambia

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
    const montoNum = parseFloat(montoPresupuesto);
    const userId = session.user.id;
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
      await cargarPresupuestos(); // Recargar para ver cambios y potencialmente activar gamificación
    } catch (err) {
      setError(`Error al guardar presupuesto: ${err.message || 'Desconocido'}`);
      if (!editandoPresupuesto && err.message?.includes('presupuesto_unico_mes_categoria_usuario')) { alert(`Error: Ya existe un presupuesto para esta categoría en el mes seleccionado.`); }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarClick = async (id) => {
    if (!window.confirm(`¿Estás seguro de eliminar este presupuesto?`)) return; setError(null);
    setIsSubmitting(true); // Indicar carga durante eliminación
    try {
      const { error: errorDelete } = await eliminarPresupuesto(id);
      if (errorDelete) throw errorDelete;
      // setPresupuestosMes(prev => prev.filter(p => p.id !== id)); // Se actualiza con cargarPresupuestos
      if (editandoPresupuesto?.id === id) { handleCancelarEdicion(); }
      await cargarPresupuestos(); // Recargar
    } catch (err) { setError(`Error al eliminar presupuesto: ${err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const handleEditarClick = (presupuesto) => {
    setEditandoPresupuesto(presupuesto);
    setSelectedCategoriaId(String(presupuesto.categoria_id));
    setMontoPresupuesto(String(presupuesto.monto));
    document.getElementById('form-presupuesto')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleCancelarEdicion = () => { setEditandoPresupuesto(null); setSelectedCategoriaId(''); setMontoPresupuesto(''); };

  const categoriasDisponibles = useMemo(() => {
      if (editandoPresupuesto) return categoriasEgreso; // Permitir ver la categoría actual al editar
      const idsConPresupuesto = new Set(presupuestosMes.map(p => p.categoria_id));
      return categoriasEgreso.filter(cat => !idsConPresupuesto.has(cat.id));
  }, [categoriasEgreso, presupuestosMes, editandoPresupuesto]);

  const formatearMonedaLocal = useCallback((monto) => {
    if (loadingSettings || (typeof monto !== 'number' && typeof monto !== 'string')) return '---';
     const num = parseFloat(monto);
     if (isNaN(num)) return '---';
    return num.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
  const selectClasses = `${inputClasses} bg-gray-700`;
  const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center text-white"> <span className="mr-3 text-2xl">🎯</span> <h1 className="text-2xl font-semibold">Presupuestos Mensuales</h1> </div>
        <div> <label htmlFor="monthSelector" className="sr-only">Mes</label> <input type="month" id="monthSelector" value={mesSeleccionado.substring(0, 7)} onChange={handleMonthChange} className={`${inputClasses} w-full sm:w-auto`} /> </div>
      </div>

      <section id="form-presupuesto" className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white"> {editandoPresupuesto ? `Editando Presupuesto para: ${editandoPresupuesto.categoria_nombre}` : `Agregar Presupuesto para ${new Date(mesSeleccionado + 'T00:00:00Z').toLocaleDateString('es-ES', { month: 'long', year: 'numeric'})}`} </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="categoriaSelect" className={labelClasses}>Categoría (Egreso)</label>
            <select id="categoriaSelect" value={selectedCategoriaId} onChange={(e) => setSelectedCategoriaId(e.target.value)} required className={selectClasses} disabled={cargandoCategorias || !!editandoPresupuesto} >
              <option value="" disabled>-- Seleccione Categoría --</option>
              {cargandoCategorias ? ( <option disabled>Cargando categorías...</option> ) : ( editandoPresupuesto ? ( <option value={editandoPresupuesto.categoria_id}> {editandoPresupuesto.categoria_nombre || `ID: ${editandoPresupuesto.categoria_id}`} </option> ) : ( categoriasDisponibles.length > 0 ? ( categoriasDisponibles.map(cat => ( <option key={cat.id} value={cat.id}>{cat.nombre}</option> )) ) : ( <option disabled>No hay categorías disponibles</option> ) ) )}
            </select>
          </div>
          <div>
            <label htmlFor="montoPresupuesto" className={labelClasses}>Monto Presupuestado</label>
            <input type="number" id="montoPresupuesto" value={montoPresupuesto} onChange={(e) => setMontoPresupuesto(e.target.value)} placeholder="Ej: 500.00" required min="0" step="0.01" className={inputClasses} disabled={loadingSettings || isSubmitting} />
          </div>
          <div className="flex space-x-2 sm:pt-6">
            <button type="submit" className={buttonClasses(editandoPresupuesto ? 'yellow' : 'green')} disabled={loadingSettings || cargandoCategorias || isSubmitting}> {isSubmitting ? 'Guardando...' : (editandoPresupuesto ? '💾 Guardar Cambios' : '➕ Agregar Presupuesto')} </button>
            {editandoPresupuesto && ( <button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')} disabled={isSubmitting}> Cancelar </button> )}
          </div>
        </form>
        {error && !cargandoPresupuestos && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Presupuestos de {new Date(mesSeleccionado + 'T00:00:00Z').toLocaleDateString('es-ES', { month: 'long', year: 'numeric'})}</h2>
        {cargandoPresupuestos && <p className="text-blue-400">Cargando presupuestos...</p>}
        {error && cargandoPresupuestos && <p className="text-red-400">{error}</p>}
        {!cargandoPresupuestos && presupuestosMes.length === 0 && !error && ( <p className="text-gray-500">No hay presupuestos definidos para este mes.</p> )}

        {!cargandoPresupuestos && presupuestosMes.length > 0 && (
          <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Categoría</th>
                  <th scope="col" className="px-4 py-3">Presupuestado</th>
                  <th scope="col" className="px-4 py-3">Gastado</th>
                  <th scope="col" className="px-4 py-3">Restante</th>
                  <th scope="col" className="px-4 py-3">Progreso</th>
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presupuestosMes.map((pres) => {
                  const gastado = pres.gasto_real_mes ?? 0;
                  const restante = pres.restante ?? (pres.monto - gastado);
                  const progresoNum = parseFloat(pres.progreso);
                  const progreso = isNaN(progresoNum) ? (pres.monto > 0 ? (gastado / pres.monto) * 100 : 0) : Math.max(0, progresoNum);
                  const progresoDisplay = Math.min(progreso, 100);
                  const restanteColor = restante >= 0 ? 'text-green-400' : 'text-red-400';
                  const progresoColor = progreso <= 50 ? 'bg-green-500' : progreso <= 85 ? 'bg-yellow-500' : 'bg-red-500';

                  return (
                    <tr key={pres.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                      <td className="px-4 py-3 font-medium text-gray-300 whitespace-nowrap">
                        {pres.categoria_nombre || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatearMonedaLocal(pres.monto)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-orange-400">
                        {formatearMonedaLocal(gastado)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap font-medium ${restanteColor}`}>
                        {formatearMonedaLocal(restante)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-600 rounded-full h-2.5" title={`${progreso.toFixed(0)}% gastado`}>
                           <div
                             className={`h-2.5 rounded-full ${progresoColor}`}
                             style={{ width: `${progresoDisplay}%` }}
                           ></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center flex-wrap gap-2">
                          <button onClick={() => handleEditarClick(pres)} className="font-medium text-yellow-400 hover:text-yellow-300 whitespace-nowrap">✏️ Editar</button>
                          <button onClick={() => handleEliminarClick(pres.id)} className="font-medium text-red-500 hover:text-red-400 whitespace-nowrap" disabled={isSubmitting}>🗑️ Eliminar</button>
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
