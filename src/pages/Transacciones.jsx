// Archivo: src/pages/Transacciones.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient'; // Added import
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { obtenerTransacciones, agregarTransaccion, editarTransaccion, eliminarTransaccion } from '../lib/transaccionesApi';
// No necesitamos obtenerCarteras y obtenerCategorias aquí si TransactionForm las maneja
// import { obtenerCarteras } from '../lib/carterasApi';
// import { obtenerCategorias } from '../lib/categoriasApi';
import { LuFilter, LuX } from "react-icons/lu";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { useGamificacion } from '../context/GamificacionContext';

const tiposFiltro = ['Ingreso', 'Egreso', 'Transferencia'];

// Añadir navigateTo como prop, aunque no se use directamente aquí, es buena práctica si se pasa desde App
function Transacciones({ session, initialNavigationState, clearNavigationState }) { // Removed navigateTo
  const [transacciones, setTransacciones] = useState([]);
  const [transaccionAEditar, setTransaccionAEditar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para los selectores de filtro (se cargarán en TransactionForm o aquí si es necesario globalmente)
  const [listaCarterasFiltro, setListaCarterasFiltro] = useState([]);
  const [listaCategoriasFiltro, setListaCategoriasFiltro] = useState([]);
  const [loadingFiltroOpts, setLoadingFiltroOpts] = useState(true); // Podría ser manejado por TransactionForm

  const estadoInicialFiltros = { fechaDesde: '', fechaHasta: '', tipo: '', categoria_id: '', cartera_id: '', descripcion: '', tagsString: '' };
  const [filtros, setFiltros] = useState(estadoInicialFiltros);
  const [aplicarFiltrosEnCarga, setAplicarFiltrosEnCarga] = useState(false);
  const [isFiltroOpen, setIsFiltroOpen] = useState(false); // Iniciar cerrado por defecto

  const { otorgarXP, verificarYOtorgarLogro, fetchEstadoGamificacion } = useGamificacion();

  // Cargar opciones para los filtros (carteras y categorías)
  // Esta función podría moverse a TransactionForm si solo se usan allí
  const cargarOpcionesFiltroGlobales = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingFiltroOpts(true);
    try {
      // Asumimos que estas APIs ya existen y funcionan
      const { data: carterasData, error: carterasError } = await supabase.from('carteras').select('id, nombre').eq('user_id', session.user.id).order('nombre');
      const { data: categoriasData, error: categoriasError } = await supabase.from('categorias').select('id, nombre, tipo').eq('user_id', session.user.id).order('nombre');
      
      if (carterasError) throw new Error(`Carteras Filtro: ${carterasError.message}`);
      if (categoriasError) throw new Error(`Categorías Filtro: ${categoriasError.message}`);
      
      setListaCarterasFiltro(carterasData || []);
      setListaCategoriasFiltro(categoriasData || []);
    } catch (err) {
      console.error("Error cargando opciones de filtro globales:", err);
      setError("Error al cargar opciones para filtros.");
    } finally {
      setLoadingFiltroOpts(false);
    }
  }, [session]);

  const cargarDatos = useCallback(async (forzarSinFiltros = false) => {
    if (!session?.user?.id) return;
    setCargando(true);
    setError(null);
    let filtrosParaApi = {};
    if (aplicarFiltrosEnCarga && !forzarSinFiltros) {
      filtrosParaApi = { ...filtros, tags: filtros.tagsString ? filtros.tagsString.split(',').map(t => t.trim()).filter(t => t !== '') : undefined };
      if (filtrosParaApi.tags && filtrosParaApi.tags.length === 0) delete filtrosParaApi.tags;
    }
    delete filtrosParaApi.tagsString;
    try {
      const { data, error: e } = await obtenerTransacciones(filtrosParaApi);
      if (e) throw e;
      setTransacciones(data || []);
    } catch (err) {
      setError(`Error al cargar transacciones: ${err.message}`);
      setTransacciones([]);
    } finally {
      setCargando(false);
    }
  }, [session, aplicarFiltrosEnCarga, filtros]);

  // Efecto para cargar la transacción a editar si viene del estado de navegación
  useEffect(() => {
    const cargarTransaccionParaEditar = async (id) => {
      setCargando(true);
      setError(null);
      console.log(`[Transacciones.jsx] Intentando cargar transacción ID: ${id} para editar.`);
      try {
        // Usamos la función obtenerTransacciones con un filtro de ID.
        // Sería ideal tener una función como obtenerTransaccionPorId(id) en transaccionesApi.js
        const { data, error: fetchError } = await obtenerTransacciones({ id: id }); // Asumiendo que obtenerTransacciones puede filtrar por ID
        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          console.log("[Transacciones.jsx] Transacción para editar encontrada:", data[0]);
          setTransaccionAEditar(data[0]);
          const formElement = document.getElementById('form-transaccion');
          if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          throw new Error(`Transacción con ID ${id} no encontrada.`);
        }
      } catch (err) {
        console.error("Error cargando transacción para editar:", err);
        setError(`No se pudo cargar la transacción para editar: ${err.message}`);
        setTransaccionAEditar(null); // Asegurar que no quede en estado de edición si falla
      } finally {
        setCargando(false);
        clearNavigationState(); // Limpiar el estado de navegación después de intentar usarlo
      }
    };

    if (initialNavigationState?.transaccionIdAEditar) {
      cargarTransaccionParaEditar(initialNavigationState.transaccionIdAEditar);
    }
  }, [initialNavigationState, clearNavigationState, session]); // Depender de session por si el user_id es necesario en la API

  useEffect(() => {
    cargarOpcionesFiltroGlobales();
    cargarDatos();
  }, [cargarDatos, cargarOpcionesFiltroGlobales]);


  const toggleFiltro = () => setIsFiltroOpen(!isFiltroOpen);

  const onSubmitHandler = async (idRecibido, datosFormulario) => {
    setError(null);
    // setCargando(true); // Podría ser manejado por TransactionForm

    if (!datosFormulario) {
      setError("Error interno: No se recibieron datos para procesar.");
      return;
    }

    try {
      let fueNuevaTransaccion = false;
      let transaccionAgregadaOEditada = null;

      if (idRecibido) {
        const { data, error: editError } = await editarTransaccion(idRecibido, datosFormulario);
        if (editError) throw editError;
        transaccionAgregadaOEditada = data;
        setTransaccionAEditar(null);
      } else {
        const { data, error: addError } = await agregarTransaccion(datosFormulario);
        if (addError) throw addError;
        fueNuevaTransaccion = true;
        transaccionAgregadaOEditada = data;
      }

      await cargarDatos();

      if (fueNuevaTransaccion && transaccionAgregadaOEditada) {
        try {
          await otorgarXP(10, 'NUEVA_TRANSACCION_REGISTRADA');
          await verificarYOtorgarLogro('PRIMER_PASO');
          await verificarYOtorgarLogro('REGISTRADOR_CONSTANTE_7D');
          await fetchEstadoGamificacion();
        } catch (gamificacionError) {
          console.error("[Transacciones.jsx] Error en lógica de gamificación:", gamificacionError);
        }
      }
    } catch (err) {
      setError(`Error al ${idRecibido ? 'editar' : 'agregar'} transacción: ${err.message || 'Desconocido'}`);
    } finally {
      // setCargando(false);
    }
  };

  const handleSeleccionarParaEditar = (tx) => {
    setTransaccionAEditar(tx);
    const formElement = document.getElementById('form-transaccion');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleCancelarEdicion = () => { setTransaccionAEditar(null); };

  const handleEliminar = async (id) => {
    if (!window.confirm(`¿Estás seguro de eliminar esta transacción? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      const { error: e } = await eliminarTransaccion(id);
      if (e) throw e;
      await cargarDatos();
    } catch (err) { setError(`Error al eliminar transacción: ${err.message}`); }
  };

  const handleFiltroChange = (e) => { const { name, value } = e.target; setFiltros(p => ({ ...p, [name]: value })); };
  const handleAplicarFiltros = () => { setAplicarFiltrosEnCarga(true); /* cargarDatos se llama por useEffect */ };
  
  useEffect(() => {
    cargarDatos();
  }, [aplicarFiltrosEnCarga, cargarDatos]);

  const handleLimpiarFiltros = () => { setFiltros(estadoInicialFiltros); if (aplicarFiltrosEnCarga) { setAplicarFiltrosEnCarga(false); } else { cargarDatos(true); } };
  const handleExportCSV = () => { /* ... (código igual que antes) ... */ if (transacciones.length === 0) { alert("No hay transacciones para exportar."); return; } const dataToExport = transacciones.map(tx => ({ Fecha: tx.fecha ? new Date(tx.fecha + 'T00:00:00Z').toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '', Tipo: tx.tipo, Descripcion: tx.descripcion || '', Categoria: tx.is_split ? `Dividido (${tx.splits?.length || 0})` : (tx.categoria?.nombre || (tx.tipo === 'Transferencia' ? 'Transferencia' : 'N/A')), Cartera_Principal: tx.tipo === 'Transferencia' ? '-' : (tx.cartera?.nombre || 'N/A'), Cartera_Origen: tx.tipo === 'Transferencia' ? (tx.cartera_origen?.nombre || '?') : '-', Cartera_Destino: tx.tipo === 'Transferencia' ? (tx.cartera_destino?.nombre || '?') : '-', Monto: tx.monto, Tags: Array.isArray(tx.tags) ? tx.tags.join(', ') : '', })); const csv = Papa.unparse(dataToExport, { header: true, columns: ["Fecha", "Tipo", "Descripcion", "Categoria", "Cartera_Principal", "Cartera_Origen", "Cartera_Destino", "Monto", "Tags"], delimiter: ",", newline: "\r\n" }); try { const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); saveAs(blob, `finanzas_transacciones_${new Date().toISOString().split('T')[0]}.csv`); } catch (error) { console.error("Error al exportar CSV:", error); alert("Error al generar el archivo CSV."); } };
  const inputDarkTheme = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="space-y-8">
      <section id="form-transaccion" className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-6 text-white">
          <span className="mr-3 text-xl">📝</span>
          <h2 className="text-xl font-semibold">
            {transaccionAEditar ? `Editando Transacción ID: ${transaccionAEditar.id}` : 'Registrar Nueva Transacción'}
          </h2>
        </div>
        <TransactionForm
          key={transaccionAEditar ? `edit-${transaccionAEditar.id}` : 'new-transaction'}
          onSubmit={onSubmitHandler}
          transaccionInicial={transaccionAEditar}
          onCancelEdit={handleCancelarEdicion}
        />
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-4 text-white">
          <span className="mr-3 text-xl">🧾</span>
          <h2 className="text-xl font-semibold">Historial de Transacciones</h2>
        </div>
        <div className="mb-6 border border-gray-700 rounded-md bg-gray-800 overflow-hidden">
          <button onClick={toggleFiltro} className="w-full flex justify-between items-center p-4 text-left text-lg font-medium text-gray-300 hover:bg-gray-700 focus:outline-none" aria-expanded={isFiltroOpen}>
            <span>Filtrar Transacciones</span>
            <span className={`transform transition-transform duration-200 ${isFiltroOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
          </button>
          <div className={`transition-all duration-300 ease-in-out ${isFiltroOpen ? 'max-h-[500px] opacity-100 p-4' : 'max-h-0 opacity-0 p-0'}`}>
            {isFiltroOpen && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-4">
                  <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFiltroChange} className={inputDarkTheme} />
                  <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFiltroChange} className={inputDarkTheme} />
                  <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} className={inputDarkTheme}><option value="">-- Tipo --</option>{tiposFiltro.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  <select name="categoria_id" value={filtros.categoria_id} onChange={handleFiltroChange} className={inputDarkTheme} disabled={loadingFiltroOpts}><option value="">-- Categoría --</option>{loadingFiltroOpts ? <option>Cargando...</option> : listaCategoriasFiltro.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
                  <select name="cartera_id" value={filtros.cartera_id} onChange={handleFiltroChange} className={inputDarkTheme} disabled={loadingFiltroOpts}><option value="">-- Cartera --</option>{loadingFiltroOpts ? <option>Cargando...</option> : listaCarterasFiltro.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
                  <input type="text" name="descripcion" value={filtros.descripcion} onChange={handleFiltroChange} placeholder="Buscar Desc..." className={inputDarkTheme} />
                  <input type="text" name="tagsString" value={filtros.tagsString} onChange={handleFiltroChange} placeholder="Tags (ej: v, i)" className={inputDarkTheme} />
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
                  <button onClick={handleAplicarFiltros} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow"> <LuFilter className="w-4 h-4 mr-2"/> Aplicar Filtros </button>
                  <button onClick={handleLimpiarFiltros} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium shadow"> <LuX className="w-4 h-4 mr-2"/> Limpiar Filtros </button>
                  <button onClick={handleExportCSV} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow disabled:opacity-50" disabled={cargando || transacciones.length === 0} > <span className="mr-2">⬇️</span> Exportar CSV </button>
                </div>
              </>
            )}
          </div>
        </div>
        {cargando && <div className="text-center text-blue-400 my-4">Cargando transacciones...</div>}
        {error && !cargando && ( <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4" role="alert"> <strong>Error: </strong><span className="block sm:inline">{error}</span> </div> )}
        {!cargando && transacciones.length === 0 && !error && ( <p className="text-center text-gray-500 my-4"> {aplicarFiltrosEnCarga ? 'No se encontraron transacciones con los filtros aplicados.' : 'Aún no hay transacciones registradas.'} </p> )}
        {!cargando && transacciones.length > 0 && ( <TransactionList transacciones={transacciones} onEdit={handleSeleccionarParaEditar} onDelete={handleEliminar} /> )}
        {!cargando && transacciones.length > 0 && ( <div className="mt-4 text-right text-sm text-gray-400"> Mostrando {transacciones.length} transacciones. </div> )}
      </section>
    </div>
  );
}
export default Transacciones;
