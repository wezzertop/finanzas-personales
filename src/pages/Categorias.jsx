// Archivo: src/pages/Categorias.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { obtenerCategorias, agregarCategoria, eliminarCategoria, editarCategoria } from '../lib/categoriasApi';

// --- Iconos SVG Inline ---
const TagIcon = ({ className = "page-title-icon" }) => ( // Clase por defecto para título de página
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const PlusCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const Edit3Icon = ({ className = "w-4 h-4" }) => ( // Cambiado a w-4 h-4 para consistencia en tabla
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const Trash2Icon = ({ className = "w-4 h-4" }) => ( // Cambiado a w-4 h-4
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const XCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
// --- Fin Iconos SVG Inline ---


function Categorias({ session }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');
  const [nuevaCategoriaTipo, setNuevaCategoriaTipo] = useState('Egreso');
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
  const baseButtonClasses = (color = 'indigo', size = 'md') => `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''} ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-slate-900' : ''} ${color === 'slate' ? 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400' : ''} ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''} ${color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}`;
  const tableHeaderClasses = "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
  const tableCellClasses = "px-4 py-3.5 whitespace-nowrap text-sm";
  const actionButtonTableCellClasses = `${tableCellClasses} text-center`;
  const iconButtonClasses = "p-2 text-slate-400 hover:text-white rounded-md transition-colors duration-150 hover:bg-slate-700";

  const cargarDatos = useCallback(async () => {
    if (!session?.user?.id) { setError("No hay sesión de usuario activa para cargar categorías."); setCargando(false); setCategorias([]); return; }
    setCargando(true); setError(null);
    try {
      const { data, error: errorFetch } = await obtenerCategorias();
      if (errorFetch) throw errorFetch;
      const categoriasOrdenadas = (data || []).sort((a, b) => { if (a.nombre.toLowerCase() < b.nombre.toLowerCase()) return -1; if (a.nombre.toLowerCase() > b.nombre.toLowerCase()) return 1; if (a.tipo < b.tipo) return -1; if (a.tipo > b.tipo) return 1; return 0; });
      setCategorias(categoriasOrdenadas);
    } catch (err) { setError(`Error al cargar categorías: ${err.message || 'Desconocido'}`); setCategorias([]); }
    finally { setCargando(false); }
  }, [session]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!nuevaCategoriaNombre.trim()) { alert("El nombre de la categoría no puede estar vacío."); return; }
    if (!session?.user?.id) { setError("Error: No se pudo obtener el ID del usuario."); return; }
    setIsSubmitting(true); setError(null); const userId = session.user.id;
    try {
      if (editandoCategoria) {
        const datosActualizados = { nombre: nuevaCategoriaNombre.trim(), tipo: nuevaCategoriaTipo };
        const { error: errorEdit } = await editarCategoria(editandoCategoria.id, datosActualizados);
        if (errorEdit) throw errorEdit;
      } else {
        const categoriaData = { nombre: nuevaCategoriaNombre.trim(), tipo: nuevaCategoriaTipo };
        const { error: errorAdd } = await agregarCategoria(categoriaData, userId);
        if (errorAdd) throw errorAdd;
      }
      setNuevaCategoriaNombre(''); setNuevaCategoriaTipo('Egreso'); setEditandoCategoria(null); await cargarDatos();
    } catch (err) { setError(`Error al guardar categoría: ${err.message || 'Desconocido'}`); }
    finally { setIsSubmitting(false); }
  };

  const handleEliminarClick = async (id) => {
    if (!window.confirm(`¿Estás seguro de eliminar esta categoría? Esto podría afectar transacciones existentes.`)) return;
    setIsSubmitting(true); setError(null);
    try {
      const { error: errorDelete } = await eliminarCategoria(id);
      if (errorDelete) throw errorDelete;
      await cargarDatos(); if (editandoCategoria?.id === id) handleCancelarEdicion();
    } catch (err) { setError(`Error al eliminar categoría: ${err.message || 'Desconocido'}`); }
    finally { setIsSubmitting(false); }
  };

  const handleEditarClick = (categoria) => { setEditandoCategoria(categoria); setNuevaCategoriaNombre(categoria.nombre); setNuevaCategoriaTipo(categoria.tipo); document.getElementById('form-categoria-section')?.scrollIntoView({ behavior: 'smooth' }); };
  const handleCancelarEdicion = () => { setEditandoCategoria(null); setNuevaCategoriaNombre(''); setNuevaCategoriaTipo('Egreso'); };

  return (
    <div className="space-y-8">
      <h1 className="page-title">
        <TagIcon /> {/* Usando componente SVG */}
        Administrar Categorías
      </h1>
      <section id="form-categoria-section" className="card-base">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">{editandoCategoria ? `Editando: ${editandoCategoria.nombre}` : 'Agregar Nueva Categoría'}</h2>
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 items-end">
          <div className="sm:col-span-2 md:col-span-1"><label htmlFor="categoriaNombre" className={baseLabelClasses}>Nombre Categoría <span className="text-red-500">*</span></label><input type="text" id="categoriaNombre" value={nuevaCategoriaNombre} onChange={(e) => setNuevaCategoriaNombre(e.target.value)} placeholder="Ej: Comida, Salario..." required className={baseInputClasses} /></div>
          <div><label htmlFor="categoriaTipo" className={baseLabelClasses}>Tipo <span className="text-red-500">*</span></label><select id="categoriaTipo" value={nuevaCategoriaTipo} onChange={(e) => setNuevaCategoriaTipo(e.target.value)} required className={baseSelectClasses}><option value="Egreso">Egreso</option><option value="Ingreso">Ingreso</option></select></div>
          <div className="flex space-x-3 sm:col-span-3 md:col-span-1 md:self-end">
            <button type="submit" className={baseButtonClasses(editandoCategoria ? 'yellow' : 'green')} disabled={isSubmitting || cargando}>{isSubmitting ? 'Guardando...' : (editandoCategoria ? <><SaveIcon className="w-4 h-4 mr-2"/> Guardar</> : <><PlusCircleIcon className="w-4 h-4 mr-2"/> Agregar</>)}</button>
            {editandoCategoria && (<button type="button" onClick={handleCancelarEdicion} className={baseButtonClasses('slate')} disabled={isSubmitting}><XCircleIcon className="w-4 h-4 mr-2"/> Cancelar</button>)}
          </div>
        </form>
        {error && !cargando && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </section>
      <section className="card-base">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Categorías Existentes</h2>
        {cargando && <p className="text-slate-400">Cargando categorías...</p>}
        {error && cargando && <p className="text-red-400">{error}</p>}
        {!cargando && categorias.length === 0 && !error && (<p className="text-slate-500">No hay categorías registradas.</p>)}
        {!cargando && categorias.length > 0 && (
          <div className="overflow-x-auto"><table className="w-full min-w-max text-sm text-left"><thead className="bg-slate-700/50"><tr><th scope="col" className={tableHeaderClasses}>Nombre</th><th scope="col" className={`${tableHeaderClasses} text-center`}>Tipo</th><th scope="col" className={actionButtonTableCellClasses}>Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-700">
              {categorias.map((categoria) => (<tr key={categoria.id} className="hover:bg-slate-700/40 transition-colors duration-100"><td className={`${tableCellClasses} text-slate-100 font-medium`}>{categoria.nombre}</td><td className={`${tableCellClasses} text-center`}><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${categoria.tipo === 'Ingreso' ? 'bg-green-500/20 text-green-300' : categoria.tipo === 'Egreso' ? 'bg-red-500/20 text-red-300' : 'bg-slate-600 text-slate-300'}`}>{categoria.tipo}</span></td><td className={actionButtonTableCellClasses}><div className="flex justify-center items-center space-x-1"><button onClick={() => handleEditarClick(categoria)} className={`${iconButtonClasses} hover:text-yellow-400`} title="Editar"><Edit3Icon className="w-4 h-4" /></button><button onClick={() => handleEliminarClick(categoria.id)} className={`${iconButtonClasses} hover:text-red-400`} title="Eliminar" disabled={isSubmitting}><Trash2Icon className="w-4 h-4" /></button></div></td></tr>))}
            </tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
export default Categorias;
