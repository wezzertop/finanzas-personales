import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerCategorias } from '../lib/categoriasApi';
// La API ahora devuelve el estado completo
import { obtenerPresupuestosPorMes, agregarPresupuesto, editarPresupuesto, eliminarPresupuesto } from '../lib/presupuestosApi';

const getPrimerDiaMes = (date) => { /* ... (igual que antes) ... */
    const d = new Date(date); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

function Presupuestos({ session }) {
  const { currency, loadingSettings, formatearMoneda } = useSettings(); // Usamos formateador del contexto

  const [mesSeleccionado, setMesSeleccionado] = useState(getPrimerDiaMes(new Date()));
  // presupuestosMes ahora contendrá gasto_real_mes, restante, progreso
  const [presupuestosMes, setPresupuestosMes] = useState([]);
  const [categoriasEgreso, setCategoriasEgreso] = useState([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');
  const [montoPresupuesto, setMontoPresupuesto] = useState('');
  const [editandoPresupuesto, setEditandoPresupuesto] = useState(null);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [cargandoPresupuestos, setCargandoPresupuestos] = useState(true);
  const [error, setError] = useState(null);

  const cargarCategorias = useCallback(async () => { /* ... (igual que antes) ... */
      if (!session?.user?.id) return; setCargandoCategorias(true); setError(null); try { const { data, error: e } = await obtenerCategorias('Egreso'); if (e) throw e; setCategoriasEgreso(data || []); } catch (err) { setError(`Error cat: ${err.message}`); setCategoriasEgreso([]); } finally { setCargandoCategorias(false); }
   }, [session]);

  // Cargar presupuestos llama a la API que usa la RPC de estado
  const cargarPresupuestos = useCallback(async () => {
    if (!session?.user?.id || !mesSeleccionado) return;
    setCargandoPresupuestos(true); setError(null);
    try {
      // obtenerPresupuestosPorMes ahora devuelve el estado completo
      const { data, error: errorFetch } = await obtenerPresupuestosPorMes(mesSeleccionado);
      if (errorFetch) throw errorFetch;
      // Ordenar por nombre de categoría
      const presupuestosOrdenados = (data || []).sort((a, b) =>
        a.categoria_nombre?.localeCompare(b.categoria_nombre || '') || 0 // Usa categoria_nombre devuelto por RPC
      );
      setPresupuestosMes(presupuestosOrdenados);
    } catch (err) { setError(`Error al cargar presupuestos: ${err.message || 'Desconocido'}`); setPresupuestosMes([]); }
    finally { setCargandoPresupuestos(false); }
  }, [session, mesSeleccionado]);

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);
  useEffect(() => { cargarPresupuestos(); }, [cargarPresupuestos]);

  const handleMonthChange = (event) => { /* ... (igual que antes) ... */
      const [year, month] = event.target.value.split('-'); setMesSeleccionado(getPrimerDiaMes(new Date(year, month - 1, 1))); setEditandoPresupuesto(null); setSelectedCategoriaId(''); setMontoPresupuesto('');
   };

  // Submit ahora recarga los datos para ver el estado actualizado
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCategoriaId || !montoPresupuesto || isNaN(parseFloat(montoPresupuesto)) || parseFloat(montoPresupuesto) < 0) { alert("..."); return; }
    if (!session?.user?.id) { setError("..."); return; }
    setError(null);
    const montoNum = parseFloat(montoPresupuesto);
    const userId = session.user.id;
    try {
      if (editandoPresupuesto) {
        const datosActualizados = { monto: montoNum };
        // Editar solo necesita el ID y los datos a cambiar
        const { error: errorEdit } = await editarPresupuesto(editandoPresupuesto.id, datosActualizados);
        if (errorEdit) throw errorEdit;
        handleCancelarEdicion();
        cargarPresupuestos(); // Recargar para ver el estado actualizado
      } else {
        const existe = presupuestosMes.some(p => p.categoria_id === parseInt(selectedCategoriaId, 10));
        if (existe) { alert(`Ya existe presupuesto...`); return; }
        const presupuestoData = { categoria_id: parseInt(selectedCategoriaId, 10), monto: montoNum, mes: mesSeleccionado };
        // Agregar necesita los datos y el user ID
        const { error: errorAdd } = await agregarPresupuesto(presupuestoData, userId);
        if (errorAdd) throw errorAdd;
        setSelectedCategoriaId(''); setMontoPresupuesto('');
        cargarPresupuestos(); // Recargar para ver el estado actualizado
      }
    } catch (err) {
      setError(`Error: ${err.message || 'Desconocido'}`);
      if (!editandoPresupuesto && err.message?.includes('presupuesto_unico_mes_categoria_usuario')) { alert(`Error: Ya existe.`); }
    }
  };

  const handleEliminarClick = async (id) => { /* ... (igual que antes, recarga implícita al cambiar mes o manualmente) ... */
      if (!window.confirm(`¿Eliminar?`)) return; setError(null); try { const { error: e } = await eliminarPresupuesto(id); if (e) throw e; setPresupuestosMes(prev => prev.filter(p => p.id !== id)); if (editandoPresupuesto?.id === id) { handleCancelarEdicion(); } } catch (err) { setError(`Error: ${err.message}`); }
  };
  const handleEditarClick = (presupuesto) => { /* ... (igual que antes) ... */
      setEditandoPresupuesto(presupuesto); setSelectedCategoriaId(String(presupuesto.categoria_id)); setMontoPresupuesto(String(presupuesto.monto)); const formSection = document.getElementById('form-presupuesto'); if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
  };
  const handleCancelarEdicion = () => { /* ... (igual que antes) ... */
      setEditandoPresupuesto(null); setSelectedCategoriaId(''); setMontoPresupuesto('');
  };

  const categoriasDisponibles = useMemo(() => { /* ... (igual que antes) ... */
      if (editandoPresupuesto) return categoriasEgreso; const idsConPresupuesto = new Set(presupuestosMes.map(p => p.categoria_id)); return categoriasEgreso.filter(cat => !idsConPresupuesto.has(cat.id));
  }, [categoriasEgreso, presupuestosMes, editandoPresupuesto]);

  // Formateador local usa contexto
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
      {/* ... (Título y Selector de Mes sin cambios) ... */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"> <div className="flex items-center text-white"> <span className="mr-3 text-2xl">🎯</span> <h1 className="text-2xl font-semibold">Presupuestos Mensuales</h1> </div> <div> <label htmlFor="monthSelector" className="sr-only">Mes</label> <input type="month" id="monthSelector" value={mesSeleccionado.substring(0, 7)} onChange={handleMonthChange} className={`${inputClasses} w-full sm:w-auto`} /> </div> </div>

      {/* ... (Formulario sin cambios visuales) ... */}
      <section id="form-presupuesto" className="bg-gray-900 p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white"> {editandoPresupuesto ? `Editando: ${editandoPresupuesto.categoria_nombre}` : `Agregar para ${mesSeleccionado.substring(0, 7)}`} </h2> <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"> <div> <label htmlFor="categoriaSelect" className={labelClasses}>Categoría (Egreso)</label> <select id="categoriaSelect" value={selectedCategoriaId} onChange={(e) => setSelectedCategoriaId(e.target.value)} required className={selectClasses} disabled={cargandoCategorias || !!editandoPresupuesto} > <option value="" disabled>-- Seleccione --</option> {cargandoCategorias ? ( <option disabled>Cargando...</option> ) : ( editandoPresupuesto ? ( <option value={editandoPresupuesto.categoria_id}> {editandoPresupuesto.categoria_nombre || `ID: ${editandoPresupuesto.categoria_id}`} </option> ) : ( categoriasDisponibles.length > 0 ? ( categoriasDisponibles.map(cat => ( <option key={cat.id} value={cat.id}>{cat.nombre}</option> )) ) : ( <option disabled>No hay más</option> ) ) )} </select> </div> <div> <label htmlFor="montoPresupuesto" className={labelClasses}>Monto Presupuestado</label> <input type="number" id="montoPresupuesto" value={montoPresupuesto} onChange={(e) => setMontoPresupuesto(e.target.value)} placeholder="Ej: 500.00" required min="0" step="0.01" className={inputClasses} disabled={loadingSettings} /> </div> <div className="flex space-x-2 sm:pt-6"> <button type="submit" className={buttonClasses(editandoPresupuesto ? 'yellow' : 'green')} disabled={loadingSettings || cargandoCategorias}> {editandoPresupuesto ? '💾 Guardar' : '➕ Agregar'} </button> {editandoPresupuesto && ( <button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}> Cancelar </button> )} </div> </form> {error && !cargandoPresupuestos && <p className="text-red-400 mt-4 text-sm">{error}</p>} </section>

      {/* --- Lista de Presupuestos (Usa datos de RPC) --- */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Presupuestos de {new Date(mesSeleccionado).toLocaleDateString('es-ES', { month: 'long', year: 'numeric'})}</h2>
        {cargandoPresupuestos && <p className="text-blue-400">Cargando...</p>}
        {error && cargandoPresupuestos && <p className="text-red-400">{error}</p>}
        {!cargandoPresupuestos && presupuestosMes.length === 0 && !error && ( <p className="text-gray-500">No hay presupuestos definidos.</p> )}

        {!cargandoPresupuestos && presupuestosMes.length > 0 && (
          <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Categoría</th>
                  <th scope="col" className="px-4 py-3">Presupuestado</th>
                  <th scope="col" className="px-4 py-3">Gastado</th> {/* Cambiado */}
                  <th scope="col" className="px-4 py-3">Restante</th>
                  <th scope="col" className="px-4 py-3">Progreso</th>
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presupuestosMes.map((pres) => {
                  // Usa los valores calculados directamente de la RPC
                  const gastado = pres.gasto_real_mes || 0;
                  const restante = pres.restante || pres.monto; // Usa el restante de RPC o calcula si es null
                  // Asegura que progreso sea un número válido entre 0 y potencialmente > 100
                  const progresoNum = parseFloat(pres.progreso);
                  const progreso = isNaN(progresoNum) ? 0 : Math.max(0, progresoNum); // Usa progreso de RPC, asegura >= 0
                  const progresoDisplay = Math.min(progreso, 100); // Limita a 100 para la barra visual

                  const restanteColor = restante >= 0 ? 'text-green-400' : 'text-red-400';
                  // Color de barra: verde <=50%, amarillo <=85%, rojo >85%
                  const progresoColor = progreso <= 50 ? 'bg-green-500' : progreso <= 85 ? 'bg-yellow-500' : 'bg-red-500';

                  return (
                    <tr key={pres.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                      <td className="px-4 py-3 font-medium text-gray-300 whitespace-nowrap">
                        {pres.categoria_nombre || 'N/A'} {/* Usa nombre de RPC */}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatearMonedaLocal(pres.monto)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-orange-400">
                        {formatearMonedaLocal(gastado)} {/* Muestra gasto real */}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap font-medium ${restanteColor}`}>
                        {formatearMonedaLocal(restante)} {/* Muestra restante real */}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-600 rounded-full h-2.5" title={`${progreso.toFixed(0)}% gastado`}>
                           <div
                             className={`h-2.5 rounded-full ${progresoColor}`}
                             style={{ width: `${progresoDisplay}%` }} // Usa progreso limitado para ancho
                           ></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center flex-wrap gap-2">
                          {/* Pasamos el objeto completo (que incluye categoria_nombre) a editar */}
                          <button onClick={() => handleEditarClick(pres)} className="font-medium text-yellow-400 hover:text-yellow-300 whitespace-nowrap">✏️ Editar</button>
                          <button onClick={() => handleEliminarClick(pres.id)} className="font-medium text-red-500 hover:text-red-400 whitespace-nowrap">🗑️ Eliminar</button>
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
