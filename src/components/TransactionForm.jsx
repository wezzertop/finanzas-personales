import React, { useState, useEffect } from 'react';
import { obtenerCarteras } from '../lib/carterasApi';
import { obtenerCategorias } from '../lib/categoriasApi';

// Tipos de transacción disponibles
const tipos = ['Ingreso', 'Egreso', 'Transferencia'];

function TransactionForm({ onSubmit, transaccionInicial, onCancelEdit }) {
  // Estados para los campos del formulario
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('Egreso'); // Default a Egreso
  const [categoriaId, setCategoriaId] = useState('');
  const [carteraId, setCarteraId] = useState(''); // Cartera principal para Ingreso/Egreso
  const [carteraOrigenId, setCarteraOrigenId] = useState(''); // Para Transferencia
  const [carteraDestinoId, setCarteraDestinoId] = useState(''); // Para Transferencia
  const [fecha, setFecha] = useState('');
  const [tagsInput, setTagsInput] = useState(''); // String de tags separados por coma

  // Estados para cargar listas de opciones
  const [listaCarteras, setListaCarteras] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [loadingListas, setLoadingListas] = useState(true);
  const [errorListas, setErrorListas] = useState(null);

  // Cargar listas de carteras y categorías al montar
  useEffect(() => {
    const cargarListas = async () => {
      setLoadingListas(true);
      setErrorListas(null);
      try {
        const [resCarteras, resCategorias] = await Promise.all([
          obtenerCarteras(),
          obtenerCategorias() // Todas las categorías
        ]);
        if (resCarteras.error) throw new Error(`Carteras: ${resCarteras.error.message}`);
        if (resCategorias.error) throw new Error(`Categorías: ${resCategorias.error.message}`);
        setListaCarteras(resCarteras.data || []);
        setListaCategorias(resCategorias.data || []);
      } catch (err) {
        setErrorListas(`Error cargando opciones: ${err.message}`);
        setListaCarteras([]);
        setListaCategorias([]);
      } finally {
        setLoadingListas(false);
      }
    };
    cargarListas();
  }, []); // Ejecutar solo una vez

  // Rellenar el formulario cuando se pasa una transacción para editar
  useEffect(() => {
    if (transaccionInicial) {
      setMonto(transaccionInicial.monto || '');
      setDescripcion(transaccionInicial.descripcion || '');
      setTipo(transaccionInicial.tipo || 'Egreso');
      setCategoriaId(transaccionInicial.categoria_id || '');
      setCarteraId(transaccionInicial.cartera_id || '');
      setCarteraOrigenId(transaccionInicial.cartera_origen_id || '');
      setCarteraDestinoId(transaccionInicial.cartera_destino_id || '');
      setFecha(transaccionInicial.fecha ? new Date(transaccionInicial.fecha).toISOString().split('T')[0] : '');
      // Convertir array de tags a string para el input
      setTagsInput(Array.isArray(transaccionInicial.tags) ? transaccionInicial.tags.join(', ') : '');
    } else {
      resetForm(); // Limpiar si no hay transacción inicial
    }
  }, [transaccionInicial]); // Ejecutar si cambia la transacción a editar

  // Función para resetear todos los campos del formulario
  const resetForm = () => {
      setMonto(''); setDescripcion(''); setTipo('Egreso');
      setCategoriaId(''); setCarteraId(''); setCarteraOrigenId(''); setCarteraDestinoId('');
      setFecha(new Date().toISOString().split('T')[0]); // Fecha actual por defecto
      setTagsInput(''); // Limpiar input de tags
  };

  // Filtrar las categorías disponibles según el tipo de transacción seleccionado
  const categoriasFiltradas = React.useMemo(() => {
      if (tipo === 'Transferencia') return []; // No se usa categoría en transferencias
      return listaCategorias.filter(cat => cat.tipo === tipo);
  }, [listaCategorias, tipo]); // Recalcular si cambian las categorías o el tipo

  // Manejar el envío del formulario
  const handleSubmit = (event) => {
    event.preventDefault(); // Evitar recarga de página

    // Validaciones básicas
    if (!monto || isNaN(parseFloat(monto))) { alert('Monto inválido.'); return; }
    if (!fecha) { alert('Fecha requerida.'); return; }

    // Procesar tags: convertir string a array limpio
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    // Objeto base de la transacción
    let datosTransaccion = {
      monto: parseFloat(monto),
      descripcion: descripcion.trim() || null,
      tipo,
      fecha,
      tags: tagsArray, // Array de tags procesado
      categoria_id: null, cartera_id: null, cartera_origen_id: null, cartera_destino_id: null, // Iniciar en null
    };

    // Añadir/Validar campos específicos según el tipo
    if (tipo === 'Transferencia') {
        if (!carteraOrigenId || !carteraDestinoId) { alert('Selecciona cartera origen y destino.'); return; }
        if (carteraOrigenId === carteraDestinoId) { alert('Carteras origen y destino deben ser diferentes.'); return; }
        if (datosTransaccion.monto <= 0) { alert('Monto de transferencia debe ser positivo.'); return; }
        datosTransaccion.cartera_origen_id = parseInt(carteraOrigenId, 10);
        datosTransaccion.cartera_destino_id = parseInt(carteraDestinoId, 10);
    } else { // Ingreso o Egreso
        if (!categoriaId) { alert('Selecciona categoría.'); return; }
        if (!carteraId) { alert('Selecciona cartera.'); return; }
        if (datosTransaccion.monto <= 0) { alert('Monto debe ser positivo para Ingreso/Egreso.'); return; }
        datosTransaccion.categoria_id = parseInt(categoriaId, 10);
        datosTransaccion.cartera_id = parseInt(carteraId, 10);
    }

    // Llamar a la función onSubmit pasada por el padre (Transacciones.jsx)
    if (transaccionInicial) {
      onSubmit(transaccionInicial.id, datosTransaccion); // Pasar ID si se edita
    } else {
      onSubmit(datosTransaccion); // Pasar solo datos si se agrega
    }

    // Limpiar formulario solo si se estaba agregando una nueva
    if (!transaccionInicial) {
      resetForm();
    }
  };

  // --- Clases CSS reutilizables ---
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
  const selectClasses = `${inputClasses} bg-gray-700`; // Asegurar fondo para select
  const buttonClasses = (color = 'indigo') => `px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

  // Mostrar error si falló la carga de listas
  if (errorListas) { return <div className="text-red-400 p-4 bg-gray-800 rounded">Error cargando opciones: {errorListas}</div>; }

  // Renderizado del formulario
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fila 1: Monto y Descripción */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label htmlFor="monto" className={labelClasses}>Monto</label><input type="number" id="monto" value={monto} onChange={(e) => setMonto(e.target.value)} required step="0.01" className={inputClasses} /></div>
        <div className="sm:col-span-2"><label htmlFor="descripcion" className={labelClasses}>Descripción</label><input type="text" id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClasses} placeholder="Detalle del movimiento..." /></div>
      </div>

       {/* Fila 2: Tipo y campos condicionales (Categoría/Cartera o Origen/Destino) */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
                <label htmlFor="tipo" className={labelClasses}>Tipo</label>
                <select id="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(''); setCarteraId(''); setCarteraOrigenId(''); setCarteraDestinoId(''); }} required className={selectClasses}>
                    {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Campos para Ingreso/Egreso */}
            {tipo !== 'Transferencia' && (
                <>
                    <div>
                        <label htmlFor="categoriaId" className={labelClasses}>Categoría</label>
                        <select id="categoriaId" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required={tipo !== 'Transferencia'} className={selectClasses} disabled={loadingListas || categoriasFiltradas.length === 0}>
                            <option value="" disabled>-- Seleccione --</option>
                            {loadingListas ? <option>Cargando...</option> : categoriasFiltradas.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                            {!loadingListas && categoriasFiltradas.length === 0 && <option disabled>No hay categorías de {tipo}</option>}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="carteraId" className={labelClasses}>Cartera</label>
                        <select id="carteraId" value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required={tipo !== 'Transferencia'} className={selectClasses} disabled={loadingListas}>
                            <option value="" disabled>-- Seleccione --</option>
                            {loadingListas ? <option>Cargando...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}
                        </select>
                    </div>
                </>
            )}

            {/* Campos para Transferencia */}
            {tipo === 'Transferencia' && (
                <>
                    <div>
                        <label htmlFor="carteraOrigenId" className={labelClasses}>Cartera Origen</label>
                        <select id="carteraOrigenId" value={carteraOrigenId} onChange={(e) => setCarteraOrigenId(e.target.value)} required={tipo === 'Transferencia'} className={selectClasses} disabled={loadingListas}>
                            <option value="" disabled>-- Seleccione Origen --</option>
                            {loadingListas ? <option>Cargando...</option> : listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="carteraDestinoId" className={labelClasses}>Cartera Destino</label>
                        <select id="carteraDestinoId" value={carteraDestinoId} onChange={(e) => setCarteraDestinoId(e.target.value)} required={tipo === 'Transferencia'} className={selectClasses} disabled={loadingListas}>
                            <option value="" disabled>-- Seleccione Destino --</option>
                            {/* Excluir la cartera de origen de las opciones de destino */}
                            {loadingListas ? <option>Cargando...</option> : listaCarteras.filter(c => c.id !== parseInt(carteraOrigenId, 10)).map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}
                        </select>
                    </div>
                </>
            )}
       </div>

       {/* Fila 3: Fecha y Tags */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label htmlFor="fecha" className={labelClasses}>Fecha</label><input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={inputClasses} /></div>
            {/* Campo Tags */}
            <div className="sm:col-span-2">
                <label htmlFor="tags" className={labelClasses}>Etiquetas (separadas por coma)</label>
                <input
                    type="text"
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className={inputClasses}
                    placeholder="Ej: vacaciones, importante, pendiente"
                />
            </div>
       </div>

      {/* Botones de Acción */}
      <div className="flex justify-start pt-4 space-x-3">
        <button type="submit" className={buttonClasses(transaccionInicial ? 'yellow' : 'green')} disabled={loadingListas}>
            {transaccionInicial ? '💾 Guardar Cambios' : '💾 Guardar Transacción'}
        </button>
        {/* Botón Cancelar solo visible al editar */}
        {transaccionInicial && (
            <button type="button" onClick={onCancelEdit} className={buttonClasses('gray')}>
                Cancelar
            </button>
        )}
      </div>
    </form>
  );
}

export default TransactionForm;
