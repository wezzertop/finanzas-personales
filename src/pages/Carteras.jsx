import React, { useState, useEffect, useCallback } from 'react';
import { obtenerCarteras, agregarCartera, eliminarCartera, editarCartera } from '../lib/carterasApi';

function Carteras({ session }) {
  const [carteras, setCarteras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaCarteraNombre, setNuevaCarteraNombre] = useState('');
  const [nuevaCarteraSaldo, setNuevaCarteraSaldo] = useState('');
  const [editandoCartera, setEditandoCartera] = useState(null);

  const cargarDatos = useCallback(async () => {
    if (!session?.user?.id) {
        setError("No hay sesión de usuario activa para cargar carteras.");
        setCargando(false);
        setCarteras([]);
        return;
    }
    setCargando(true);
    setError(null);
    try {
      const { data, error: errorFetch } = await obtenerCarteras();
      if (errorFetch) throw errorFetch;
      setCarteras(data || []);
    } catch (err) {
      setError(`Error al cargar carteras: ${err.message || 'Desconocido'}`);
      setCarteras([]);
    } finally {
      setCargando(false);
    }
  }, [session]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleAgregarSubmit = async (event) => {
    event.preventDefault();
    if (!nuevaCarteraNombre.trim()) {
      alert("El nombre de la cartera no puede estar vacío."); return;
    }
    if (!session?.user?.id) {
        setError("Error: No se pudo obtener el ID del usuario para agregar la cartera.");
        return;
    }
    const saldoInicialNum = parseFloat(nuevaCarteraSaldo);
    const saldoParaGuardar = isNaN(saldoInicialNum) ? 0 : saldoInicialNum;
    setError(null);
    const carteraData = {
        nombre: nuevaCarteraNombre.trim(),
        saldo_inicial: saldoParaGuardar
    };
    const userId = session.user.id;
    try {
      const { data, error: errorAdd } = await agregarCartera(carteraData, userId);
      if (errorAdd) throw errorAdd;
      setCarteras(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre))); // Ordenar al agregar
      setNuevaCarteraNombre('');
      setNuevaCarteraSaldo('');
    } catch (err) {
      setError(`Error al agregar cartera: ${err.message || 'Desconocido'}`);
    }
  };

  const handleEliminarClick = async (id) => {
     if (!window.confirm(`¿Estás seguro de eliminar esta cartera?`)) return;
     setError(null);
     try {
       const { error: errorDelete } = await eliminarCartera(id);
       if (errorDelete) throw errorDelete;
       setCarteras(prev => prev.filter(c => c.id !== id));
     } catch (err) {
       setError(`Error al eliminar cartera: ${err.message || 'Desconocido'}`);
     }
  };

  const handleEditarClick = (cartera) => {
      setEditandoCartera(cartera);
      setNuevaCarteraNombre(cartera.nombre);
      setNuevaCarteraSaldo(cartera.saldo_inicial !== null ? String(cartera.saldo_inicial) : '');
      // Scroll al formulario (opcional)
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicion = () => {
      setEditandoCartera(null);
      setNuevaCarteraNombre('');
      setNuevaCarteraSaldo('');
  };

  const handleGuardarEdicionSubmit = async (event) => {
      event.preventDefault();
       if (!editandoCartera || !nuevaCarteraNombre.trim()) {
           alert("El nombre no puede estar vacío."); return;
       }
       const saldoInicialNum = parseFloat(nuevaCarteraSaldo);
       const saldoParaGuardar = isNaN(saldoInicialNum) ? 0 : saldoInicialNum;
       setError(null);
       const datosActualizados = {
           nombre: nuevaCarteraNombre.trim(),
           saldo_inicial: saldoParaGuardar
       };
       try {
           const { data, error: errorEdit } = await editarCartera(editandoCartera.id, datosActualizados);
           if (errorEdit) throw errorEdit;
           setCarteras(prev => prev.map(c => c.id === editandoCartera.id ? data : c).sort((a, b) => a.nombre.localeCompare(b.nombre))); // Ordenar al editar
           handleCancelarEdicion();
       } catch (err) {
           setError(`Error al editar cartera: ${err.message || 'Desconocido'}`);
       }
  };

  const formatearMoneda = (monto) => {
    if (typeof monto !== 'number') return 'N/A';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
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

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">
            {editandoCartera ? `Editando: ${editandoCartera.nombre}` : 'Agregar Nueva Cartera'}
        </h2>
        <form onSubmit={editandoCartera ? handleGuardarEdicionSubmit : handleAgregarSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="carteraNombre" className={labelClasses}>Nombre Cartera</label>
            <input type="text" id="carteraNombre" value={nuevaCarteraNombre} onChange={(e) => setNuevaCarteraNombre(e.target.value)} placeholder="Ej: Efectivo, Banco..." required className={inputClasses} />
          </div>
          <div>
             <label htmlFor="carteraSaldo" className={labelClasses}>Saldo Inicial (Opcional)</label>
             <input type="number" id="carteraSaldo" value={nuevaCarteraSaldo} onChange={(e) => setNuevaCarteraSaldo(e.target.value)} placeholder="0.00" step="0.01" className={inputClasses} />
          </div>
          <div className="flex space-x-2 sm:pt-6">
            <button type="submit" className={buttonClasses(editandoCartera ? 'yellow' : 'green')}>
              {editandoCartera ? '💾 Guardar' : '➕ Agregar'}
            </button>
            {editandoCartera && ( <button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}> Cancelar </button> )}
          </div>
        </form>
         {error && !cargando && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Carteras Existentes</h2>
        {cargando && <p className="text-blue-400">Cargando carteras...</p>}
        {error && cargando && <p className="text-red-400">{error}</p>}

        {!cargando && carteras.length === 0 && !error && ( <p className="text-gray-500">No hay carteras registradas.</p> )}

        {!cargando && carteras.length > 0 && (
          // Contenedor de la tabla con overflow
          <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  {/* Ajustamos padding para menos espacio horizontal */}
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Saldo Inicial</th>
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carteras.map((cartera) => (
                  <tr key={cartera.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                    <td className="px-4 py-4 font-medium text-gray-300 whitespace-nowrap">
                      {cartera.nombre}
                    </td>
                    <td className="px-4 py-4 text-gray-400 whitespace-nowrap"> {/* Evita wrap en saldo */}
                      {formatearMoneda(cartera.saldo_inicial)}
                    </td>
                    {/* Celda de Acciones: flex y wrap para mejor manejo en pantallas pequeñas */}
                    <td className="px-4 py-4 text-center">
                       {/* Contenedor flex para botones, permite wrap si no caben */}
                       <div className="flex justify-center items-center flex-wrap gap-2"> {/* gap-2 añade espacio */}
                          <button
                            onClick={() => handleEditarClick(cartera)}
                            className="font-medium text-yellow-400 hover:text-yellow-300 whitespace-nowrap" // whitespace-nowrap en botón
                            aria-label={`Editar ${cartera.nombre}`}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleEliminarClick(cartera.id)}
                            className="font-medium text-red-500 hover:text-red-400 whitespace-nowrap" // whitespace-nowrap en botón
                            aria-label={`Eliminar ${cartera.nombre}`}
                          >
                            🗑️ Eliminar
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Carteras;
