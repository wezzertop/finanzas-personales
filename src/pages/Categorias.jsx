import React, { useState, useEffect, useCallback } from 'react';
import { obtenerCategorias, agregarCategoria, eliminarCategoria, editarCategoria } from '../lib/categoriasApi';

function Categorias({ session }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');
  const [nuevaCategoriaTipo, setNuevaCategoriaTipo] = useState('Egreso');
  const [editandoCategoria, setEditandoCategoria] = useState(null);

  const cargarDatos = useCallback(async () => {
    if (!session?.user?.id) {
        setError("No hay sesión de usuario activa para cargar categorías.");
        setCargando(false);
        setCategorias([]);
        return;
    }
    setCargando(true);
    setError(null);
    try {
      const { data, error: errorFetch } = await obtenerCategorias();
      if (errorFetch) throw errorFetch;
      setCategorias(data || []);
    } catch (err) {
      setError(`Error al cargar categorías: ${err.message || 'Desconocido'}`);
      setCategorias([]);
    } finally {
      setCargando(false);
    }
  }, [session]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleAgregarSubmit = async (event) => {
    event.preventDefault();
    if (!nuevaCategoriaNombre.trim()) {
      alert("El nombre de la categoría no puede estar vacío."); return;
    }
    if (!session?.user?.id) {
        setError("Error: No se pudo obtener el ID del usuario para agregar la categoría."); return;
    }
    setError(null);
    const categoriaData = {
        nombre: nuevaCategoriaNombre.trim(),
        tipo: nuevaCategoriaTipo
    };
    const userId = session.user.id;
    try {
      const { data, error: errorAdd } = await agregarCategoria(categoriaData, userId);
      if (errorAdd) throw errorAdd;
      setCategorias(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevaCategoriaNombre('');
      setNuevaCategoriaTipo('Egreso');
    } catch (err) {
      setError(`Error al agregar categoría: ${err.message || 'Desconocido'}`);
    }
  };

  const handleEliminarClick = async (id) => {
     if (!window.confirm(`¿Estás seguro de eliminar esta categoría?`)) return;
     setError(null);
     try {
       const { error: errorDelete } = await eliminarCategoria(id);
       if (errorDelete) throw errorDelete;
       setCategorias(prev => prev.filter(c => c.id !== id));
     } catch (err) {
       setError(`Error al eliminar categoría: ${err.message || 'Desconocido'}`);
     }
  };

  const handleEditarClick = (categoria) => {
      setEditandoCategoria(categoria);
      setNuevaCategoriaNombre(categoria.nombre);
      setNuevaCategoriaTipo(categoria.tipo);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicion = () => {
      setEditandoCategoria(null);
      setNuevaCategoriaNombre('');
      setNuevaCategoriaTipo('Egreso');
  };

  const handleGuardarEdicionSubmit = async (event) => {
      event.preventDefault();
       if (!editandoCategoria || !nuevaCategoriaNombre.trim()) {
           alert("El nombre no puede estar vacío."); return;
       }
       setError(null);
       const datosActualizados = {
           nombre: nuevaCategoriaNombre.trim(),
           tipo: nuevaCategoriaTipo
       };
       try {
           const { data, error: errorEdit } = await editarCategoria(editandoCategoria.id, datosActualizados);
           if (errorEdit) throw errorEdit;
           setCategorias(prev => prev.map(c => c.id === editandoCategoria.id ? data : c).sort((a, b) => a.nombre.localeCompare(b.nombre)));
           handleCancelarEdicion();
       } catch (err) {
           setError(`Error al editar categoría: ${err.message || 'Desconocido'}`);
       }
  };

  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`;
  const selectClasses = `${inputClasses} bg-gray-700`;
  const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

  return (
    <div className="space-y-8">
      <div className="flex items-center text-white">
        <span className="mr-3 text-2xl" aria-hidden="true">🏷️</span>
        <h1 className="text-2xl font-semibold">Administrar Categorías</h1>
      </div>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">
            {editandoCategoria ? `Editando: ${editandoCategoria.nombre}` : 'Agregar Nueva Categoría'}
        </h2>
        <form onSubmit={editandoCategoria ? handleGuardarEdicionSubmit : handleAgregarSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="categoriaNombre" className={labelClasses}>Nombre Categoría</label>
            <input type="text" id="categoriaNombre" value={nuevaCategoriaNombre} onChange={(e) => setNuevaCategoriaNombre(e.target.value)} placeholder="Ej: Comida, Salario..." required className={inputClasses} />
          </div>
          <div>
             <label htmlFor="categoriaTipo" className={labelClasses}>Tipo</label>
             <select id="categoriaTipo" value={nuevaCategoriaTipo} onChange={(e) => setNuevaCategoriaTipo(e.target.value)} required className={selectClasses} >
                <option value="Ingreso">Ingreso</option>
                <option value="Egreso">Egreso</option>
             </select>
          </div>
          <div className="flex space-x-2 sm:pt-6">
            <button type="submit" className={buttonClasses(editandoCategoria ? 'yellow' : 'green')}>
              {editandoCategoria ? '💾 Guardar' : '➕ Agregar'}
            </button>
            {editandoCategoria && ( <button type="button" onClick={handleCancelarEdicion} className={buttonClasses('gray')}> Cancelar </button> )}
          </div>
        </form>
         {error && !cargando && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Categorías Existentes</h2>
        {cargando && <p className="text-blue-400">Cargando categorías...</p>}
        {error && cargando && <p className="text-red-400">{error}</p>}

        {!cargando && categorias.length === 0 && !error && ( <p className="text-gray-500">No hay categorías registradas.</p> )}

        {!cargando && categorias.length > 0 && (
          <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  {/* Tipo: Oculto por defecto (hidden), visible desde 'sm' */}
                  <th scope="col" className="px-4 py-3 hidden sm:table-cell">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                    <td className="px-4 py-4 font-medium text-gray-300 whitespace-nowrap">
                      {categoria.nombre}
                      {/* Mostrar tipo debajo del nombre en pantallas extra pequeñas */}
                      <div className="sm:hidden text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded font-medium ${categoria.tipo === 'Ingreso' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                            {categoria.tipo}
                        </span>
                      </div>
                    </td>
                    {/* Tipo: Oculto por defecto (hidden), visible desde 'sm' */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                       <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoria.tipo === 'Ingreso' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                           {categoria.tipo}
                       </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                       <div className="flex justify-center items-center flex-wrap gap-2">
                          <button onClick={() => handleEditarClick(categoria)} className="font-medium text-yellow-400 hover:text-yellow-300 whitespace-nowrap" aria-label={`Editar ${categoria.nombre}`}> ✏️ Editar </button>
                          <button onClick={() => handleEliminarClick(categoria.id)} className="font-medium text-red-500 hover:text-red-400 whitespace-nowrap" aria-label={`Eliminar ${categoria.nombre}`}> 🗑️ Eliminar </button>
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

export default Categorias;
