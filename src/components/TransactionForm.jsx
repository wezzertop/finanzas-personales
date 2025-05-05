import React, { useState, useEffect } from 'react';
// Importamos las funciones API para obtener listas
import { obtenerCarteras } from '../lib/carterasApi';
import { obtenerCategorias } from '../lib/categoriasApi';

const tipos = ['Ingreso', 'Egreso']; // Tipo sigue siendo texto directo

function TransactionForm({ onSubmit, transaccionInicial, onCancelEdit }) {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState(tipos[0]);
  // Estados para los IDs seleccionados
  const [categoriaId, setCategoriaId] = useState('');
  const [carteraId, setCarteraId] = useState('');
  const [fecha, setFecha] = useState('');

  // Estados para las listas de opciones
  const [listaCarteras, setListaCarteras] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [loadingListas, setLoadingListas] = useState(true);
  const [errorListas, setErrorListas] = useState(null);

  // Efecto para cargar las listas de carteras y categorías al montar
  useEffect(() => {
    const cargarListas = async () => {
      setLoadingListas(true);
      setErrorListas(null);
      try {
        // Obtenemos ambas listas en paralelo
        const [resCarteras, resCategorias] = await Promise.all([
          obtenerCarteras(),
          obtenerCategorias() // Obtiene todas por defecto
        ]);

        if (resCarteras.error) throw new Error(`Carteras: ${resCarteras.error.message}`);
        if (resCategorias.error) throw new Error(`Categorías: ${resCategorias.error.message}`);

        setListaCarteras(resCarteras.data || []);
        setListaCategorias(resCategorias.data || []);

      } catch (err) {
        console.error("FORM Error: No se pudieron cargar listas", err);
        setErrorListas(`Error cargando opciones: ${err.message}`);
        setListaCarteras([]);
        setListaCategorias([]);
      } finally {
        setLoadingListas(false);
      }
    };
    cargarListas();
  }, []); // Se ejecuta solo una vez al montar

  // Efecto para rellenar el formulario al editar
  useEffect(() => {
    if (transaccionInicial) {
      setMonto(transaccionInicial.monto || '');
      setDescripcion(transaccionInicial.descripcion || '');
      setTipo(transaccionInicial.tipo || tipos[0]);
      // Usamos los IDs que vienen en la transacción editada
      setCategoriaId(transaccionInicial.categoria_id || '');
      setCarteraId(transaccionInicial.cartera_id || '');
      setFecha(transaccionInicial.fecha ? new Date(transaccionInicial.fecha).toISOString().split('T')[0] : '');
    } else {
      // Resetear formulario para agregar
      setMonto('');
      setDescripcion('');
      setTipo(tipos[0]);
      setCategoriaId(''); // Resetear IDs
      setCarteraId('');   // Resetear IDs
      setFecha(new Date().toISOString().split('T')[0]);
    }
  }, [transaccionInicial]);

  // Filtra las categorías disponibles según el tipo de transacción seleccionado (Ingreso/Egreso)
  const categoriasFiltradas = listaCategorias.filter(cat => cat.tipo === tipo);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      alert('Por favor, ingresa un monto válido y positivo.'); return;
    }
    if (!descripcion.trim()) {
      alert('La descripción no puede estar vacía.'); return;
    }
    // Validar que se haya seleccionado un ID
    if (!categoriaId) {
       alert('Por favor, selecciona una categoría.'); return;
    }
    if (!carteraId) {
       alert('Por favor, selecciona una cartera.'); return;
    }
    if (!fecha) {
        alert('Por favor, selecciona una fecha.'); return;
    }

    // Construimos el objeto con los IDs
    const datosTransaccion = {
      monto: parseFloat(monto),
      descripcion: descripcion.trim(),
      tipo,
      categoria_id: parseInt(categoriaId, 10), // Aseguramos que sea número
      cartera_id: parseInt(carteraId, 10),     // Aseguramos que sea número
      fecha,
    };

    if (transaccionInicial) {
      onSubmit(transaccionInicial.id, datosTransaccion);
    } else {
      onSubmit(datosTransaccion);
    }

    if (!transaccionInicial) {
      setMonto('');
      setDescripcion('');
      setTipo(tipos[0]);
      setCategoriaId(''); // Limpiar IDs
      setCarteraId('');   // Limpiar IDs
      setFecha(new Date().toISOString().split('T')[0]);
    }
  };

  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `
    block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
    text-gray-200 placeholder-gray-500 text-sm shadow-sm
    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `; // Añadido disabled styles

  // Mensaje de error si fallan las listas
  if (errorListas) {
      return <div className="text-red-400 p-4 bg-gray-800 rounded">Error cargando opciones: {errorListas}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label htmlFor="monto" className={labelClasses}>Monto ($)</label>
          <input type="number" id="monto" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="50.00" step="0.01" required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="descripcion" className={labelClasses}>Descripción</label>
          <input type="text" id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Café..." required maxLength={100} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="tipo" className={labelClasses}>Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoriaId(''); /* Resetea categoría al cambiar tipo */ }} required className={inputClasses}>
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
         <div>
          <label htmlFor="categoriaId" className={labelClasses}>Categoría</label>
          <select
            id="categoriaId"
            name="categoriaId" // Añadido name
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            className={inputClasses}
            disabled={loadingListas || categoriasFiltradas.length === 0} // Deshabilitado si carga o no hay opciones
          >
            <option value="" disabled>-- Seleccione --</option>
            {loadingListas ? (
              <option disabled>Cargando...</option>
            ) : (
              categoriasFiltradas.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)
            )}
             {/* Mostrar mensaje si no hay categorías para el tipo seleccionado */}
             {!loadingListas && categoriasFiltradas.length === 0 && <option disabled>No hay categorías de {tipo}</option>}
          </select>
        </div>
        <div>
          <label htmlFor="carteraId" className={labelClasses}>Cartera</label>
          <select
            id="carteraId"
            name="carteraId" // Añadido name
            value={carteraId}
            onChange={(e) => setCarteraId(e.target.value)}
            required
            className={inputClasses}
            disabled={loadingListas} // Deshabilitado mientras carga
          >
            <option value="" disabled>-- Seleccione --</option>
             {loadingListas ? (
              <option disabled>Cargando...</option>
             ) : (
               listaCarteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)
             )}
          </select>
        </div>
         <div>
          <label htmlFor="fecha" className={labelClasses}>Fecha</label>
          <input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={inputClasses} />
        </div>
      </div>

      <div className="flex items-center justify-start pt-4 space-x-3">
        <button
          type="submit"
          disabled={loadingListas} // Deshabilitar botón si las listas están cargando
          className={`px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${transaccionInicial ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {transaccionInicial ? '💾 Guardar Cambios' : '💾 Guardar Transacción'}
        </button>
        {transaccionInicial && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition duration-150"
            >
              Cancelar
            </button>
        )}
      </div>
    </form>
  );
}

export default TransactionForm;
