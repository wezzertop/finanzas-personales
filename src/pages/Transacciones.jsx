import React, { useState, useEffect, useCallback } from 'react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import {
  obtenerTransacciones,
  agregarTransaccion,
  editarTransaccion,
  eliminarTransaccion
} from '../lib/transaccionesApi';
// Importamos APIs para listas de filtros
import { obtenerCarteras } from '../lib/carterasApi';
import { obtenerCategorias } from '../lib/categoriasApi';


const tiposFiltro = ['Ingreso', 'Egreso'];
// Ya no necesitamos listas hardcodeadas aquí, las cargaremos

function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [transaccionAEditar, setTransaccionAEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Listas para los selects de filtros
  const [listaCarterasFiltro, setListaCarterasFiltro] = useState([]);
  const [listaCategoriasFiltro, setListaCategoriasFiltro] = useState([]);
  const [loadingFiltroOpts, setLoadingFiltroOpts] = useState(true);

  const estadoInicialFiltros = {
    fechaDesde: '',
    fechaHasta: '',
    tipo: '',
    categoria_id: '', // Usamos ID
    cartera_id: '',   // Usamos ID
    descripcion: ''
  };
  const [filtros, setFiltros] = useState(estadoInicialFiltros);
  const [aplicarFiltrosEnCarga, setAplicarFiltrosEnCarga] = useState(false);
  const [isFiltroOpen, setIsFiltroOpen] = useState(true);

  // Carga las opciones para los selects de filtro
  const cargarOpcionesFiltro = useCallback(async () => {
      setLoadingFiltroOpts(true);
       try {
        const [resCarteras, resCategorias] = await Promise.all([
          obtenerCarteras(),
          obtenerCategorias() // Todas las categorías para filtros
        ]);
        if (resCarteras.error) throw new Error(`Carteras: ${resCarteras.error.message}`);
        if (resCategorias.error) throw new Error(`Categorías: ${resCategorias.error.message}`);
        setListaCarterasFiltro(resCarteras.data || []);
        setListaCategoriasFiltro(resCategorias.data || []);
      } catch (err) {
        console.error("FILTRO Error: No se pudieron cargar opciones", err);
        // Podríamos mostrar un error específico para las opciones
      } finally {
        setLoadingFiltroOpts(false);
      }
  }, []);

  // Carga las transacciones (depende de filtros)
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    const filtrosParaApi = aplicarFiltrosEnCarga ? filtros : {};

    try {
      const { data, error: errorFetch } = await obtenerTransacciones(filtrosParaApi);
      if (errorFetch) throw errorFetch;
      setTransacciones(data || []);
    } catch (err) {
      setError(`Error al cargar: ${err.message || 'Desconocido'}`);
      setTransacciones([]);
    } finally {
      setCargando(false);
    }
  }, [aplicarFiltrosEnCarga, filtros]);

  // Efecto inicial para cargar todo
  useEffect(() => {
    cargarOpcionesFiltro();
    cargarDatos();
  }, [cargarDatos, cargarOpcionesFiltro]); // Dependencias iniciales


  const toggleFiltro = () => setIsFiltroOpen(!isFiltroOpen);

   const handleAgregar = async (nuevaTransaccion) => {
    setError(null);
    try {
      const { data, error: errorAdd } = await agregarTransaccion(nuevaTransaccion);
      if (errorAdd) throw errorAdd;
      cargarDatos();
    } catch (err) {
      setError(`Error al agregar: ${err.message || 'Error desconocido'}`);
    }
  };

   const handleSeleccionarParaEditar = (transaccion) => {
    setTransaccionAEditar(transaccion);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

   const handleCancelarEdicion = () => {
    setTransaccionAEditar(null);
  };

   const handleEditar = async (id, datosActualizados) => {
    setError(null);
    try {
      const { data, error: errorEdit } = await editarTransaccion(id, datosActualizados);
      if (errorEdit) throw errorEdit;
      cargarDatos();
      setTransaccionAEditar(null);
    } catch (err) {
      setError(`Error al editar: ${err.message || 'Error desconocido'}`);
    }
  };

   const handleEliminar = async (id) => {
    if (!window.confirm(`¿Estás seguro de eliminar la transacción ${id}?`)) {
      return;
    }
    setError(null);
    try {
      const { error: errorDelete } = await eliminarTransaccion(id);
      if (errorDelete) throw errorDelete;
      setTransacciones(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(`Error al eliminar: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleFiltroChange = (event) => {
    const { name, value } = event.target;
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      [name]: value
    }));
  };

  const handleAplicarFiltros = () => {
    setAplicarFiltrosEnCarga(true);
  };

  const handleLimpiarFiltros = () => {
    setFiltros(estadoInicialFiltros);
    setAplicarFiltrosEnCarga(false);
  };

  return (
    <div className="space-y-8">

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
         <div className="flex items-center mb-6 text-white">
             <span className="mr-3 text-xl" aria-hidden="true">📝</span>
             <h2 className="text-xl font-semibold">
                 {transaccionAEditar ? 'Editar Transacción' : 'Registro de Transacciones'}
             </h2>
         </div>
        <TransactionForm
          onSubmit={transaccionAEditar ? handleEditar : handleAgregar}
          transaccionInicial={transaccionAEditar}
          onCancelEdit={handleCancelarEdicion}
        />
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
         <div className="flex items-center mb-4 text-white">
             <span className="mr-3 text-xl" aria-hidden="true">🧾</span>
             <h2 className="text-xl font-semibold">Historial de Transacciones</h2>
         </div>

        <div className="mb-6 border border-gray-700 rounded-md bg-gray-800 overflow-hidden">
            <button
                onClick={toggleFiltro}
                className="w-full flex justify-between items-center p-4 text-left text-lg font-medium text-gray-300 hover:bg-gray-700 focus:outline-none"
                aria-expanded={isFiltroOpen}
            >
                <span>Filtrar Transacciones</span>
                <span className={`transform transition-transform duration-200 ${isFiltroOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </button>

            <div className={`transition-all duration-300 ease-in-out ${isFiltroOpen ? 'max-h-screen opacity-100 p-4' : 'max-h-0 opacity-0 p-0'}`}>
              {isFiltroOpen && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
                      <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFiltroChange} className="input-dark-theme" aria-label="Fecha desde" />
                      <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFiltroChange} className="input-dark-theme" aria-label="Fecha hasta" />
                      <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} className="input-dark-theme" aria-label="Filtrar por tipo">
                          <option value="">-- Todos Tipos --</option>
                          {tiposFiltro.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {/* Select de Categorías con datos de API */}
                      <select
                          name="categoria_id" // Cambiado a _id
                          value={filtros.categoria_id}
                          onChange={handleFiltroChange}
                          className="input-dark-theme"
                          aria-label="Filtrar por categoría"
                          disabled={loadingFiltroOpts}
                      >
                          <option value="">-- Todas Cat. --</option>
                          {loadingFiltroOpts ? <option disabled>Cargando...</option> : listaCategoriasFiltro.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                       {/* Select de Carteras con datos de API */}
                      <select
                          name="cartera_id" // Cambiado a _id
                          value={filtros.cartera_id}
                          onChange={handleFiltroChange}
                          className="input-dark-theme"
                          aria-label="Filtrar por cartera"
                          disabled={loadingFiltroOpts}
                      >
                          <option value="">-- Todas Cart. --</option>
                          {loadingFiltroOpts ? <option disabled>Cargando...</option> : listaCarterasFiltro.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                      <input type="text" name="descripcion" value={filtros.descripcion} onChange={handleFiltroChange} placeholder="Buscar descripción..." className="input-dark-theme" aria-label="Filtrar por descripción" />
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
                      <button onClick={handleAplicarFiltros} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150">
                          <span className="mr-2" aria-hidden="true">🔍</span> Filtrar
                      </button>
                       <button onClick={handleLimpiarFiltros} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150">
                           <span className="mr-2" aria-hidden="true">🧹</span> Limpiar
                      </button>
                       <button className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150" disabled>
                          <span className="mr-2" aria-hidden="true">⬇️</span> Exportar CSV
                      </button>
                  </div>
                </>
              )}
            </div>
        </div>

        {cargando && <div className="text-center text-blue-400 my-4">Cargando...</div>}
        {error && ( <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4" role="alert"> <strong>Error: </strong><span className="block sm:inline">{error}</span> </div> )}
        {!cargando && transacciones.length === 0 && !error && ( <p className="text-center text-gray-500 my-4"> {aplicarFiltrosEnCarga ? 'No se encontraron transacciones con los filtros aplicados.' : 'No hay transacciones registradas todavía.'} </p> )}
        {!cargando && transacciones.length > 0 && ( <TransactionList transacciones={transacciones} onEdit={handleSeleccionarParaEditar} onDelete={handleEliminar} /> )}
        {!cargando && transacciones.length > 0 && ( <div className="mt-4 text-right text-sm text-gray-400"> Mostrando {transacciones.length} transacciones. </div> )}
      </section>
    </div>
  );
}

const inputDarkTheme = ` block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed `;
if (!document.querySelector('style#input-dark-theme-style')) {
    const style = document.createElement('style');
    style.id = 'input-dark-theme-style';
    style.innerHTML = `.input-dark-theme { @apply ${inputDarkTheme.replace(/\s+/g, ' ')} }`;
    document.head.appendChild(style);
}

export default Transacciones;
