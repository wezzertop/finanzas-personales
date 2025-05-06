import React, { useState, useEffect, useCallback } from 'react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { obtenerTransacciones, agregarTransaccion, editarTransaccion, eliminarTransaccion } from '../lib/transaccionesApi';
import { obtenerCarteras } from '../lib/carterasApi';
import { obtenerCategorias } from '../lib/categoriasApi';
// CORRECCIÓN: Cambiar LuXCircle por LuX
import { LuFilter, LuX } from "react-icons/lu";
// --- Export CSV ---
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
// --- Fin Export CSV ---


const tiposFiltro = ['Ingreso', 'Egreso'];

function Transacciones({ session }) {
  const [transacciones, setTransacciones] = useState([]);
  const [transaccionAEditar, setTransaccionAEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [listaCarterasFiltro, setListaCarterasFiltro] = useState([]);
  const [listaCategoriasFiltro, setListaCategoriasFiltro] = useState([]);
  const [loadingFiltroOpts, setLoadingFiltroOpts] = useState(true);
  const estadoInicialFiltros = { fechaDesde: '', fechaHasta: '', tipo: '', categoria_id: '', cartera_id: '', descripcion: '' };
  const [filtros, setFiltros] = useState(estadoInicialFiltros);
  const [aplicarFiltrosEnCarga, setAplicarFiltrosEnCarga] = useState(false);
  const [isFiltroOpen, setIsFiltroOpen] = useState(true);

  const cargarOpcionesFiltro = useCallback(async () => {
      setLoadingFiltroOpts(true); try { const [resC, resCa] = await Promise.all([obtenerCarteras(), obtenerCategorias()]); if (resC.error) throw new Error(`Cart: ${resC.error.message}`); if (resCa.error) throw new Error(`Cat: ${resCa.error.message}`); setListaCarterasFiltro(resC.data || []); setListaCategoriasFiltro(resCa.data || []); } catch (err) { console.error("FILTRO Opts Error:", err); } finally { setLoadingFiltroOpts(false); }
  }, []);

  const cargarDatos = useCallback(async () => {
      if (!session?.user?.id) return; setCargando(true); setError(null); const f = aplicarFiltrosEnCarga ? filtros : {}; try { const { data, error: e } = await obtenerTransacciones(f); if (e) throw e; setTransacciones(data || []); } catch (err) { setError(`Error: ${err.message}`); setTransacciones([]); } finally { setCargando(false); }
   }, [session, aplicarFiltrosEnCarga, filtros]);

  useEffect(() => { cargarOpcionesFiltro(); cargarDatos(); }, [cargarDatos, cargarOpcionesFiltro]);

  const toggleFiltro = () => setIsFiltroOpen(!isFiltroOpen);
  const handleAgregar = async (nueva) => { setError(null); try { const { error: e } = await agregarTransaccion(nueva); if (e) throw e; cargarDatos(); } catch (err) { setError(`Error: ${err.message}`); } };
  const handleSeleccionarParaEditar = (tx) => { setTransaccionAEditar(tx); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCancelarEdicion = () => { setTransaccionAEditar(null); };
  const handleEditar = async (id, datos) => { setError(null); try { const { error: e } = await editarTransaccion(id, datos); if (e) throw e; cargarDatos(); setTransaccionAEditar(null); } catch (err) { setError(`Error: ${err.message}`); } };
  const handleEliminar = async (id) => { if (!window.confirm(`¿Eliminar?`)) return; setError(null); try { const { error: e } = await eliminarTransaccion(id); if (e) throw e; setTransacciones(prev => prev.filter(t => t.id !== id)); } catch (err) { setError(`Error: ${err.message}`); } };
  const handleFiltroChange = (e) => { const { name, value } = e.target; setFiltros(p => ({ ...p, [name]: value })); };
  const handleAplicarFiltros = () => { setAplicarFiltrosEnCarga(true); };
  const handleLimpiarFiltros = () => { setFiltros(estadoInicialFiltros); setAplicarFiltrosEnCarga(false); };


  const handleExportCSV = () => {
    if (transacciones.length === 0) { alert("No hay datos."); return; }
    const dataToExport = transacciones.map(tx => ({ Fecha: tx.fecha ? new Date(tx.fecha + 'T00:00:00').toLocaleDateString('es-ES') : '', Tipo: tx.tipo, Descripcion: tx.descripcion || '', Categoria: tx.categoria?.nombre || 'N/A', Cartera: tx.cartera?.nombre || 'N/A', Monto: tx.monto, }));
    const csv = Papa.unparse(dataToExport, { header: true, columns: ["Fecha", "Tipo", "Descripcion", "Categoria", "Cartera", "Monto"], delimiter: ",", newline: "\r\n" });
    try { const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); saveAs(blob, `finanzas_transacciones_${new Date().toISOString().split('T')[0]}.csv`); }
    catch (error) { console.error("Error CSV:", error); alert("Error al generar CSV."); }
  };


  return (
    <div className="space-y-8">
      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
         <div className="flex items-center mb-6 text-white"> <span className="mr-3 text-xl">📝</span> <h2 className="text-xl font-semibold"> {transaccionAEditar ? 'Editar' : 'Registro'} </h2> </div>
        <TransactionForm onSubmit={transaccionAEditar ? handleEditar : handleAgregar} transaccionInicial={transaccionAEditar} onCancelEdit={handleCancelarEdicion} />
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
         <div className="flex items-center mb-4 text-white"> <span className="mr-3 text-xl">🧾</span> <h2 className="text-xl font-semibold">Historial</h2> </div>
        <div className="mb-6 border border-gray-700 rounded-md bg-gray-800 overflow-hidden">
            <button onClick={toggleFiltro} className="w-full flex justify-between items-center p-4 text-left text-lg font-medium text-gray-300 hover:bg-gray-700 focus:outline-none" aria-expanded={isFiltroOpen}>
                <span>Filtrar Transacciones</span> <span className={`transform transition-transform duration-200 ${isFiltroOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isFiltroOpen ? 'max-h-screen opacity-100 p-4' : 'max-h-0 opacity-0 p-0'}`}>
              {isFiltroOpen && ( <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
                      <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFiltroChange} className="input-dark-theme" />
                      <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFiltroChange} className="input-dark-theme" />
                      <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} className="input-dark-theme"><option value="">-- Tipo --</option>{tiposFiltro.map(t => <option key={t} value={t}>{t}</option>)}</select>
                      <select name="categoria_id" value={filtros.categoria_id} onChange={handleFiltroChange} className="input-dark-theme" disabled={loadingFiltroOpts}><option value="">-- Cat. --</option>{loadingFiltroOpts ? <option>...</option> : listaCategoriasFiltro.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
                      <select name="cartera_id" value={filtros.cartera_id} onChange={handleFiltroChange} className="input-dark-theme" disabled={loadingFiltroOpts}><option value="">-- Cart. --</option>{loadingFiltroOpts ? <option>...</option> : listaCarterasFiltro.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
                      <input type="text" name="descripcion" value={filtros.descripcion} onChange={handleFiltroChange} placeholder="Buscar..." className="input-dark-theme" />
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
                      <button onClick={handleAplicarFiltros} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow"> <LuFilter className="w-4 h-4 mr-2"/> Filtrar </button>
                       {/* CORRECCIÓN: Usar LuX */}
                       <button onClick={handleLimpiarFiltros} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium shadow"> <LuX className="w-4 h-4 mr-2"/> Limpiar </button>
                       <button onClick={handleExportCSV} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow disabled:opacity-50" disabled={cargando || transacciones.length === 0} > <span className="mr-2">⬇️</span> Exportar CSV </button>
                  </div>
                </>
              )}
            </div>
        </div>

        {cargando && <div className="text-center text-blue-400 my-4">Cargando...</div>}
        {error && ( <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4" role="alert"> <strong>Error: </strong><span className="block sm:inline">{error}</span> </div> )}
        {!cargando && transacciones.length === 0 && !error && ( <p className="text-center text-gray-500 my-4"> {aplicarFiltrosEnCarga ? 'No hay resultados.' : 'No hay transacciones.'} </p> )}
        {!cargando && transacciones.length > 0 && ( <TransactionList transacciones={transacciones} onEdit={handleSeleccionarParaEditar} onDelete={handleEliminar} /> )}
        {!cargando && transacciones.length > 0 && ( <div className="mt-4 text-right text-sm text-gray-400"> Mostrando {transacciones.length} transacciones. </div> )}
      </section>
    </div>
  );
}

const inputDarkTheme = ` block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed `;
if (!document.querySelector('style#input-dark-theme-style')) { const style = document.createElement('style'); style.id = 'input-dark-theme-style'; style.innerHTML = `.input-dark-theme { @apply ${inputDarkTheme.replace(/\s+/g, ' ')} }`; document.head.appendChild(style); }

export default Transacciones;
