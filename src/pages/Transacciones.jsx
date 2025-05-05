import React, { useState, useEffect, useCallback } from 'react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import {
  obtenerTransacciones,
  agregarTransaccion,
  editarTransaccion,
  eliminarTransaccion
} from '../lib/transaccionesApi';

const tiposFiltro = ['Ingreso', 'Egreso'];
const categoriasFiltro = ['Comida', 'Transporte', 'Salario', 'Entretenimiento', 'Servicios', 'Otros'];
const carterasFiltro = ['Efectivo', 'Banco Principal', 'Tarjeta Crédito', 'Ahorros'];

function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [transaccionAEditar, setTransaccionAEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const estadoInicialFiltros = {
    fechaDesde: '',
    fechaHasta: '',
    tipo: '',
    categoria: '',
    cartera: '',
    descripcion: ''
  };
  const [filtros, setFiltros] = useState(estadoInicialFiltros);
  const [aplicarFiltrosEnCarga, setAplicarFiltrosEnCarga] = useState(false);

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

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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

        <div className="mb-6 p-4 border border-gray-700 rounded-md bg-gray-800">
            <h3 className="text-lg font-medium mb-4 text-gray-300">▼ Filtrar Transacciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
                <input
                    type="date"
                    name="fechaDesde"
                    value={filtros.fechaDesde}
                    onChange={handleFiltroChange}
                    className="input-dark-theme"
                    aria-label="Fecha desde"
                />
                <input
                    type="date"
                    name="fechaHasta"
                    value={filtros.fechaHasta}
                    onChange={handleFiltroChange}
                    className="input-dark-theme"
                    aria-label="Fecha hasta"
                />
                <select
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                    className="input-dark-theme"
                    aria-label="Filtrar por tipo"
                >
                    <option value="">-- Todos Tipos --</option>
                    {tiposFiltro.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                    name="categoria"
                    value={filtros.categoria}
                    onChange={handleFiltroChange}
                    className="input-dark-theme"
                    aria-label="Filtrar por categoría"
                >
                    <option value="">-- Todas Cat. --</option>
                    {categoriasFiltro.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    name="cartera"
                    value={filtros.cartera}
                    onChange={handleFiltroChange}
                    className="input-dark-theme"
                    aria-label="Filtrar por cartera"
                >
                    <option value="">-- Todas Cart. --</option>
                    {carterasFiltro.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                    type="text"
                    name="descripcion"
                    value={filtros.descripcion}
                    onChange={handleFiltroChange}
                    placeholder="Buscar descripción..."
                    className="input-dark-theme"
                    aria-label="Filtrar por descripción"
                />
            </div>
            {/* Contenedor de botones: flex-col por defecto, sm:flex-row desde pantalla pequeña */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
                <button
                    onClick={handleAplicarFiltros}
                     // Botones ocupan todo el ancho en móvil (w-full), ancho auto desde sm
                    className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150"
                >
                    <span className="mr-2" aria-hidden="true">🔍</span> Filtrar
                </button>
                 <button
                    onClick={handleLimpiarFiltros}
                    className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150"
                >
                     <span className="mr-2" aria-hidden="true">🧹</span> Limpiar
                </button>
                 <button className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150" disabled>
                    <span className="mr-2" aria-hidden="true">⬇️</span> Exportar CSV
                </button>
            </div>
        </div>

        {cargando && <div className="text-center text-blue-400 my-4">Cargando...</div>}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
            <strong>Error: </strong><span className="block sm:inline">{error}</span>
          </div>
        )}

        {!cargando && transacciones.length === 0 && !error && (
          <p className="text-center text-gray-500 my-4">
            {aplicarFiltrosEnCarga ? 'No se encontraron transacciones con los filtros aplicados.' : 'No hay transacciones registradas todavía.'}
          </p>
        )}
        {!cargando && transacciones.length > 0 && (
          <TransactionList
            transacciones={transacciones}
            onEdit={handleSeleccionarParaEditar}
            onDelete={handleEliminar}
          />
        )}
         {!cargando && transacciones.length > 0 && (
             <div className="mt-4 text-right text-sm text-gray-400">
                 Mostrando {transacciones.length} transacciones.
             </div>
         )}
      </section>
    </div>
  );
}

const inputDarkTheme = `
  block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
  text-gray-200 placeholder-gray-500 text-sm
  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
  disabled:bg-gray-800 disabled:cursor-not-allowed
`;
if (!document.querySelector('style#input-dark-theme-style')) {
    const style = document.createElement('style');
    style.id = 'input-dark-theme-style';
    style.innerHTML = `.input-dark-theme { @apply ${inputDarkTheme.replace(/\s+/g, ' ')} }`;
    document.head.appendChild(style);
}

export default Transacciones;
