import { supabase } from './supabaseClient';

/**
 * Llama a la función RPC para obtener las transacciones de EGRESO filtradas.
 * @param {string} fechaInicio - Fecha de inicio en formato YYYY-MM-DD.
 * @param {string} fechaFin - Fecha de fin en formato YYYY-MM-DD.
 * @param {number|null} [categoriaId=null] - ID de la categoría a filtrar (o null para todas).
 * @param {number|null} [carteraId=null] - ID de la cartera a filtrar (o null para todas).
 * @returns {Promise<{data: Array|null, error: Object|null}>} Lista de transacciones filtradas.
 */
export const obtenerEgresosFiltrados = async (fechaInicio, fechaFin, categoriaId = null, carteraId = null) => {
  // Validar fechas
  if (!fechaInicio || !fechaFin) {
    return { data: null, error: { message: 'Fechas de inicio y fin son requeridas.' } };
  }
  // Convertir IDs vacíos o inválidos a null para la RPC
  const categoriaIdParam = categoriaId ? parseInt(categoriaId, 10) : null;
  const carteraIdParam = carteraId ? parseInt(carteraId, 10) : null;

  console.log(`[informesApi] RPC 'obtener_egresos_filtrados'`, { fechaInicio, fechaFin, categoriaIdParam, carteraIdParam });

  const { data, error } = await supabase
    .rpc('obtener_egresos_filtrados', {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      categoria_id_param: categoriaIdParam, // Pasa null si no se seleccionó
      cartera_id_param: carteraIdParam   // Pasa null si no se seleccionó
    });

  if (error) {
    console.error("API Error (Egresos Filtrados RPC):", error.message);
  } else {
    console.log("[informesApi] Egresos filtrados recibidos:", data);
  }
  // Devuelve la lista de transacciones individuales
  return { data, error };
};
