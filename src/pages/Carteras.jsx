import React, { useState, useEffect, useCallback } from 'react';
// Importamos APIs de carteras y TRANSACCIONES
import { obtenerCarteras, agregarCartera, eliminarCartera, editarCartera } from '../lib/carterasApi';
import { obtenerTransacciones } from '../lib/transaccionesApi'; // <--- NUEVO: Para obtener historial
import TransactionList from '../components/TransactionList'; // <--- NUEVO: Para mostrar historial

function Carteras({ session }) {
  const [carteras, setCarteras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaCarteraNombre, setNuevaCarteraNombre] = useState('');
  const [nuevaCarteraSaldo, setNuevaCarteraSaldo] = useState('');
  const [editandoCartera, setEditandoCartera] = useState(null);

  // --- Historial Cartera ---
  const [selectedCarteraId, setSelectedCarteraId] = useState(null); // ID de la cartera cuyo historial vemos
  const [historialCartera, setHistorialCartera] = useState([]); // Transacciones de la cartera seleccionada
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [selectedCarteraNombre, setSelectedCarteraNombre] = useState(''); // Para mostrar el nombre en el título
  // --- Fin Historial Cartera ---

  const cargarDatosCarteras = useCallback(async () => {
    if (!session?.user?.id) { /* ... manejo de error ... */ return; }
    setCargando(true); setError(null);
    try {
      const { data, error: errorFetch } = await obtenerCarteras();
      if (errorFetch) throw errorFetch;
      const carterasOrdenadas = (data || []).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setCarteras(carterasOrdenadas);
    } catch (err) { setError(`Error al cargar carteras: ${err.message || 'Desconocido'}`); setCarteras([]); }
    finally { setCargando(false); }
  }, [session]);

  // --- Historial Cartera ---
  // Función para cargar el historial de una cartera específica
  const cargarHistorial = useCallback(async (carteraId, carteraNombre) => {
     if (!carteraId) return;
     console.log(`Cargando historial para cartera ID: ${carteraId}`);
     setSelectedCarteraId(carteraId); // Marca la cartera como seleccionada
     setSelectedCarteraNombre(carteraNombre); // Guarda el nombre para mostrarlo
     setCargandoHistorial(true); setErrorHistorial(null); setHistorialCartera([]); // Resetea estado
     try {
         // Llama a obtenerTransacciones filtrando por cartera_id
         const { data, error: errorFetch } = await obtenerTransacciones({ cartera_id: carteraId });
         if (errorFetch) throw errorFetch;
         setHistorialCartera(data || []);
         console.log("Historial cargado:", data);
     } catch (err) {
         setErrorHistorial(`Error al cargar historial: ${err.message || 'Desconocido'}`);
         setHistorialCartera([]);
     } finally {
         setCargandoHistorial(false);
     }
  }, []); // No depende de nada externo directamente aquí

  // Cierra la vista de historial
  const cerrarHistorial = () => {
      setSelectedCarteraId(null);
      setHistorialCartera([]);
      setErrorHistorial(null);
      setSelectedCarteraNombre('');
  };
  // --- Fin Historial Cartera ---


  useEffect(() => {
    cargarDatosCarteras();
  }, [cargarDatosCarteras]);

  // --- Lógica de Agregar, Editar, Eliminar (Ajuste para recargar) ---
  const handleAgregarSubmit = async (event) => {
    event.preventDefault();
    if (!nuevaCarteraNombre.trim()) { alert("..."); return; }
    if (!session?.user?.id) { setError("..."); return; }
    // ... resto de validaciones y preparación de carteraData ...
    const saldoInicialNum = parseFloat(nuevaCarteraSaldo);
    const saldoParaGuardar = isNaN(saldoInicialNum) ? 0 : saldoInicialNum;
    setError(null);
    const carteraData = { nombre: nuevaCarteraNombre.trim(), saldo_inicial: saldoParaGuardar };
    const userId = session.user.id;
    try {
      const { error: errorAdd } = await agregarCartera(carteraData, userId);
      if (errorAdd) throw errorAdd;
      setNuevaCarteraNombre(''); setNuevaCarteraSaldo('');
      cargarDatosCarteras(); // Recargar lista de carteras
    } catch (err) { setError(`Error al agregar: ${err.message || 'Desconocido'}`); }
  };
  const handleEliminarClick = async (id) => {
     if (!window.confirm(`¿Estás seguro?`)) return;
     setError(null);
     try {
       const { error: errorDelete } = await eliminarCartera(id);
       if (errorDelete) throw errorDelete;
       setCarteras(prev => prev.filter(c => c.id !== id));
       // Si se elimina la cartera cuyo historial se está viendo, cerrar historial
       if (selectedCarteraId === id) {
           cerrarHistorial();
       }
     } catch (err) { setError(`Error al eliminar: ${err.message || 'Desconocido'}`); }
  };
  const handleEditarClick = (cartera) => { /* ... sin cambios ... */
      setEditandoCartera(cartera);
      setNuevaCarteraNombre(cartera.nombre);
      setNuevaCarteraSaldo(cartera.saldo_inicial !== null ? String(cartera.saldo_inicial) : '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancelarEdicion = () => { /* ... sin cambios ... */
      setEditandoCartera(null);
      setNuevaCarteraNombre('');
      setNuevaCarteraSaldo('');
   };
  const handleGuardarEdicionSubmit = async (event) => {
      event.preventDefault();
       if (!editandoCartera || !nuevaCarteraNombre.trim()) { alert("..."); return; }
       // ... resto de validaciones y preparación de datosActualizados ...
       const saldoInicialNum = parseFloat(nuevaCarteraSaldo);
       const saldoParaGuardar = isNaN(saldoInicialNum) ? 0 : saldoInicialNum;
       setError(null);
       const datosActualizados = { nombre: nuevaCarteraNombre.trim(), saldo_inicial: saldoParaGuardar };
       try {
           const { error: errorEdit } = await editarCartera(editandoCartera.id, datosActualizados);
           if (errorEdit) throw errorEdit;
           handleCancelarEdicion();
           cargarDatosCarteras(); // Recargar lista de carteras
       } catch (err) { setError(`Error al editar: ${err.message || 'Desconocido'}`); }
  };
  // --- Fin Lógica ---

  const formatearMoneda = (monto) => { /* ... sin cambios ... */
    if (typeof monto !== 'number' && typeof monto !== 'string') return 'N/A';
     const num = parseFloat(monto);
     if (isNaN(num)) return 'N/A';
    return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };

  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`;
  const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

  return (
    <div className="space-y-8">
      <div className="flex items-center text-white">
        <span className="mr-3 text-2xl" aria-hidden="true">💰</span>
        <h1 className="text-2xl font-semibold">Administrar Carteras</h1>
      </div>

      {/* --- Formulario Agregar/Editar (sin cambios visuales) --- */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        {/* ... contenido del formulario ... */}
         <h2 className="text-xl font-semibold mb-4 text-white"> {editandoCartera ? `Editando: ${editandoCartera.nombre}` : 'Agregar Nueva Cartera'} </h2>
         <form onSubmit={editandoCartera ? handleGuardarEdicionSubmit : handleAgregarSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
           <div> <label htmlFor="carteraNombre" className={labelClasses}>Nombre Cartera</label> <input type="text" id="carteraNombre" value={nuevaCarteraNombre} onChange={(e) => setNuevaCarteraNombre(e.target.value)} placeholder="Ej: Efectivo, Banco..." required className={inputClasses} /> </div>
           <div> <label htmlFor="carteraSaldo" className={labelClasses}>Saldo Inicial (Opcional)</label> <input type="number" id="carteraSaldo" value={nuevaCarteraSaldo} onChange={(e) => setNuevaCarteraSaldo(e.target.value)} placeholder="0.00" step="0.01" className={inputClasses} /> </div>
           <div className="flex space-x-2 sm:pt-6"> <button type="submit" className={buttonClasses(editandoCartera ? 'yellow' : 'green')}> {editandoCartera ? '💾 Guardar' : '➕ Agregar'} </button> {editandoCartera && ( <button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}> Cancelar </button> )} </div>
         </form>
         {error && !cargando && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      {/* --- Lista de Carteras (Añadido botón historial) --- */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Carteras Existentes</h2>
        {cargando && <p className="text-blue-400">Cargando carteras...</p>}
        {error && cargando && <p className="text-red-400">{error}</p>}
        {!cargando && carteras.length === 0 && !error && ( <p className="text-gray-500">No hay carteras registradas.</p> )}

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
                  <tr key={cartera.id} className={`bg-gray-800 border-b border-gray-700 hover:bg-gray-600 ${selectedCarteraId === cartera.id ? 'bg-gray-700' : ''}`}> {/* Resalta fila seleccionada */}
                    <td className="px-4 py-4 font-medium text-gray-300 whitespace-nowrap">{cartera.nombre}</td>
                    <td className="px-4 py-4 text-gray-400 whitespace-nowrap">{formatearMoneda(cartera.saldo_inicial)}</td>
                     <td className={`px-4 py-4 whitespace-nowrap font-semibold ${parseFloat(cartera.saldo_actual) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMoneda(cartera.saldo_actual)}</td>
                    <td className="px-4 py-4 text-center">
                       <div className="flex justify-center items-center flex-wrap gap-2">
                          {/* Botón Ver Historial */}
                          <button onClick={() => cargarHistorial(cartera.id, cartera.nombre)} className="font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap" aria-label={`Ver historial de ${cartera.nombre}`}> 👁️ Historial </button>
                          <button onClick={() => handleEditarClick(cartera)} className="font-medium text-yellow-400 hover:text-yellow-300 whitespace-nowrap" aria-label={`Editar ${cartera.nombre}`}> ✏️ Editar </button>
                          <button onClick={() => handleEliminarClick(cartera.id)} className="font-medium text-red-500 hover:text-red-400 whitespace-nowrap" aria-label={`Eliminar ${cartera.nombre}`}> 🗑️ Eliminar </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- Sección Historial Cartera (Se muestra si hay cartera seleccionada) --- */}
      {selectedCarteraId && (
          <section className="bg-gray-900 p-6 rounded-lg shadow-lg mt-8 border-t-4 border-blue-500">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold text-white">
                     Historial de: <span className="text-blue-400">{selectedCarteraNombre}</span>
                 </h2>
                 <button onClick={cerrarHistorial} className="text-gray-400 hover:text-white" aria-label="Cerrar historial">
                     ❌ Cerrar
                 </button>
             </div>

             {cargandoHistorial && <p className="text-blue-400">Cargando historial...</p>}
             {errorHistorial && <p className="text-red-400">{errorHistorial}</p>}

             {!cargandoHistorial && historialCartera.length === 0 && !errorHistorial && (
               <p className="text-gray-500">No hay transacciones registradas para esta cartera.</p>
             )}

             {!cargandoHistorial && historialCartera.length > 0 && (
                 // Reutilizamos el componente TransactionList
                 <TransactionList
                     transacciones={historialCartera}
                     // Pasamos funciones vacías o null si no queremos editar/borrar desde aquí
                     onEdit={() => {}} // O null o una función que navegue a la transaccion
                     onDelete={() => {}} // O null
                 />
             )}
          </section>
      )}
      {/* --- Fin Sección Historial Cartera --- */}

    </div>
  );
}

export default Carteras;
