// Archivo: src/lib/transaccionesApi.js

// Importamos nuestro cliente Supabase inicializado
import { supabase } from './supabaseClient';

// --- FUNCIÓN PARA OBTENER TODAS LAS TRANSACCIONES ---
/**
 * Obtiene todas las transacciones de la base de datos, ordenadas por fecha de creación descendente.
 * @returns {Promise<{data: Array|null, error: Object|null}>} Un objeto con la data o el error.
 */
export const obtenerTransacciones = async () => {
  console.log("API: Intentando obtener transacciones...");
  const { data, error } = await supabase
    .from('transacciones') // De la tabla 'transacciones'
    .select('*') // Selecciona todas las columnas (*)
    .order('fecha_creacion', { ascending: false }); // Ordena por fecha, las más nuevas primero

  if (error) {
    console.error("API Error: No se pudieron obtener las transacciones:", error.message);
  } else {
    console.log("API Éxito: Transacciones obtenidas:", data);
  }
  // Devolvemos tanto la data como el error para que el componente que llame decida qué hacer
  return { data, error };
};

// --- FUNCIÓN PARA AGREGAR UNA NUEVA TRANSACCIÓN ---
/**
 * Agrega una nueva transacción a la base de datos.
 * @param {Object} nuevaTransaccion - El objeto con los datos de la transacción (monto, descripcion, tipo, categoria, cartera).
 * @returns {Promise<{data: Object|null, error: Object|null}>} Un objeto con la data insertada o el error.
 */
export const agregarTransaccion = async (nuevaTransaccion) => {
  console.log("API: Intentando agregar transacción:", nuevaTransaccion);
  // No necesitamos pasar 'id' ni 'fecha_creacion', Supabase los maneja.
  const { data, error } = await supabase
    .from('transacciones')
    .insert([
      // Pasamos un array con el objeto de la nueva transacción
      nuevaTransaccion
    ])
    .select() // Importante: .select() devuelve el registro recién insertado
    .single(); // .single() asegura que recibimos un objeto, no un array (ya que insertamos uno solo)

  if (error) {
    console.error("API Error: No se pudo agregar la transacción:", error.message);
  } else {
    console.log("API Éxito: Transacción agregada:", data);
  }
  return { data, error };
};

// --- FUNCIÓN PARA EDITAR UNA TRANSACCIÓN EXISTENTE ---
/**
 * Edita una transacción existente en la base de datos, identificada por su ID.
 * @param {number|string} id - El ID de la transacción a editar.
 * @param {Object} datosActualizados - Un objeto con los campos a actualizar.
 * @returns {Promise<{data: Object|null, error: Object|null}>} Un objeto con la data actualizada o el error.
 */
export const editarTransaccion = async (id, datosActualizados) => {
  console.log(`API: Intentando editar transacción ID: ${id}`, datosActualizados);
  // No actualizamos 'id' ni 'fecha_creacion'
  const { data, error } = await supabase
    .from('transacciones')
    .update(datosActualizados) // Pasamos los datos a actualizar
    .eq('id', id) // Condición: donde el 'id' sea igual al que nos pasaron
    .select() // Devuelve el registro actualizado
    .single(); // Esperamos un solo objeto como resultado

  if (error) {
    console.error("API Error: No se pudo editar la transacción:", error.message);
  } else {
    console.log("API Éxito: Transacción editada:", data);
  }
  return { data, error };
};

// --- FUNCIÓN PARA ELIMINAR UNA TRANSACCIÓN ---
/**
 * Elimina una transacción de la base de datos, identificada por su ID.
 * @param {number|string} id - El ID de la transacción a eliminar.
 * @returns {Promise<{data: null, error: Object|null}>} Un objeto que solo contendrá el error si algo falla.
 */
export const eliminarTransaccion = async (id) => {
  console.log(`API: Intentando eliminar transacción ID: ${id}`);
  const { error } = await supabase
    .from('transacciones')
    .delete() // Comando para borrar
    .eq('id', id); // Condición: donde el 'id' sea igual al proporcionado

  // El método delete no devuelve los datos borrados por defecto.
  // Solo nos interesa si hubo un error.
  if (error) {
    console.error("API Error: No se pudo eliminar la transacción:", error.message);
  } else {
    console.log("API Éxito: Transacción eliminada (ID:", id, ")");
  }
  // Devolvemos solo el error, ya que no hay 'data' relevante en un delete exitoso.
  // Podríamos devolver un objeto { success: !error } si quisiéramos ser más explícitos.
  return { data: null, error };
};