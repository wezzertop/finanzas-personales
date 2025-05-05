// Archivo: src/pages/Transacciones.jsx

import React, { useState, useEffect, useCallback } from 'react';
import TransactionForm from '../components/TransactionForm'; // Importaremos el formulario
import TransactionList from '../components/TransactionList'; // Importaremos la lista
import {
  obtenerTransacciones,
  agregarTransaccion,
  editarTransaccion,
  eliminarTransaccion
} from '../lib/transaccionesApi'; // Importamos nuestras funciones API

function Transacciones() {
  // --- Estados del Componente ---
  const [transacciones, setTransacciones] = useState([]); // Almacena la lista de transacciones
  const [transaccionAEditar, setTransaccionAEditar] = useState(null); // Almacena la transacción que se está editando
  const [cargando, setCargando] = useState(true); // Indica si se están cargando los datos
  const [error, setError] = useState(null); // Almacena mensajes de error

  // --- Efecto para Cargar Datos Iniciales ---
  // useCallback envuelve la función para asegurar que no cambie innecesariamente
  const cargarDatos = useCallback(async () => {
    console.log("PAGE: Cargando datos iniciales...");
    setCargando(true);
    setError(null); // Limpia errores previos
    try {
      const { data, error: errorFetch } = await obtenerTransacciones();
      if (errorFetch) {
        throw errorFetch; // Lanza el error para que sea capturado por el catch
      }
      setTransacciones(data || []); // Si data es null/undefined, usa un array vacío
      console.log("PAGE: Datos cargados:", data);
    } catch (err) {
      console.error("PAGE Error: Falló la carga de transacciones:", err);
      setError(`Error al cargar transacciones: ${err.message || 'Error desconocido'}`);
      setTransacciones([]); // Asegura que transacciones sea un array vacío en caso de error
    } finally {
      setCargando(false); // Termina la carga (éxito o error)
    }
  }, []); // El array vacío [] significa que `cargarDatos` no depende de props o estado externo

  // useEffect que llama a cargarDatos solo cuando el componente se monta
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]); // Depende de `cargarDatos` (que está envuelto en useCallback)

  // --- Manejadores de Acciones ---

  const handleAgregar = async (nuevaTransaccion) => {
    console.log("PAGE: Intentando agregar:", nuevaTransaccion);
    setError(null); // Limpia errores anteriores
    try {
      const { data, error: errorAdd } = await agregarTransaccion(nuevaTransaccion);
      if (errorAdd) throw errorAdd;
      // Actualiza el estado añadiendo la nueva transacción al PRINCIPIO de la lista
      setTransacciones(prev => [data, ...prev]);
      console.log("PAGE: Transacción agregada exitosamente");
    } catch (err) {
      console.error("PAGE Error: Falló al agregar transacción:", err);
      setError(`Error al agregar: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleSeleccionarParaEditar = (transaccion) => {
    console.log("PAGE: Seleccionado para editar:", transaccion);
    setTransaccionAEditar(transaccion); // Pone la transacción en el estado para editar
  };

  const handleCancelarEdicion = () => {
    console.log("PAGE: Cancelando edición");
    setTransaccionAEditar(null); // Limpia el estado de edición
  };

  const handleEditar = async (id, datosActualizados) => {
    console.log(`PAGE: Intentando editar ID ${id}:`, datosActualizados);
    setError(null);
    try {
      const { data, error: errorEdit } = await editarTransaccion(id, datosActualizados);
      if (errorEdit) throw errorEdit;
      // Actualiza la transacción en la lista local
      setTransacciones(prev =>
        prev.map(t => (t.id === id ? data : t))
      );
      setTransaccionAEditar(null); // Limpia el modo edición
      console.log("PAGE: Transacción editada exitosamente");
    } catch (err) {
      console.error("PAGE Error: Falló al editar transacción:", err);
      setError(`Error al editar: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleEliminar = async (id) => {
    console.log(`PAGE: Intentando eliminar ID ${id}`);
    // Confirmación básica (puedes mejorarla con un modal)
    if (!window.confirm(`¿Estás seguro de eliminar la transacción ${id}?`)) {
      console.log("PAGE: Eliminación cancelada por el usuario");
      return;
    }

    setError(null);
    try {
      const { error: errorDelete } = await eliminarTransaccion(id);
      if (errorDelete) throw errorDelete;
      // Actualiza el estado filtrando la transacción eliminada
      setTransacciones(prev => prev.filter(t => t.id !== id));
      console.log("PAGE: Transacción eliminada exitosamente");
    } catch (err) {
      console.error("PAGE Error: Falló al eliminar transacción:", err);
      setError(`Error al eliminar: ${err.message || 'Error desconocido'}`);
    }
  };

  // --- Renderizado del Componente ---
  return (
    <div className="container mx-auto p-4 max-w-4xl"> {/* Centrado y con ancho máximo */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Registro de Transacciones
      </h1>

      {/* Formulario para agregar/editar */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {transaccionAEditar ? 'Editar Transacción' : 'Agregar Nueva Transacción'}
        </h2>
        <TransactionForm
          onSubmit={transaccionAEditar ? handleEditar : handleAgregar} // Decide qué función llamar
          transaccionInicial={transaccionAEditar} // Pasa la transacción a editar (o null si es nueva)
          onCancelEdit={handleCancelarEdicion} // Pasa la función para cancelar edición
        />
      </div>

       {/* Indicador de carga */}
       {cargando && (
         <div className="text-center text-blue-600 my-4">Cargando transacciones...</div>
       )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}


      {/* Lista de transacciones (solo si no está cargando y hay transacciones) */}
      {!cargando && transacciones.length === 0 && !error && (
        <p className="text-center text-gray-500 my-4">No hay transacciones registradas todavía.</p>
      )}
      {!cargando && transacciones.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Historial</h2>
          <TransactionList
            transacciones={transacciones}
            onEdit={handleSeleccionarParaEditar} // Pasa la función para iniciar la edición
            onDelete={handleEliminar} // Pasa la función para eliminar
          />
        </div>
      )}
    </div>
  );
}

export default Transacciones;