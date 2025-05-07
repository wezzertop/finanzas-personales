import { supabase } from './supabaseClient';

/**
 * Llama a la función RPC para obtener las transacciones de EGRESO filtradas.
 * @param {string} fechaInicio - Fecha inicio YYYY-MM-DD.
 * @param {string} fechaFin - Fecha fin YYYY-MM-DD.
 * @param {number|null} [categoriaId=null] - ID categoría opcional.
 * @param {number|null} [carteraId=null] - ID cartera opcional.
 * @param {Array<string>|null} [tags=null] - Array de tags opcional.
 * @returns {Promise<{data: Array|null, error: Object|null}>} Lista de transacciones filtradas.
 */
export const obtenerEgresosFiltrados = async (fechaInicio, fechaFin, categoriaId = null, carteraId = null, tags = null) => {
  // Validar fechas
  if (!fechaInicio || !fechaFin) {
    return { data: null, error: { message: 'Fechas de inicio y fin son requeridas.' } };
  }
  // Convertir IDs vacíos o inválidos a null para la RPC
  const categoriaIdParam = categoriaId ? parseInt(categoriaId, 10) : null;
  const carteraIdParam = carteraId ? parseInt(carteraId, 10) : null;
  // Asegurar que tags sea un array de strings limpios o null
  const tagsParam = (Array.isArray(tags) && tags.length > 0)
      ? tags.map(t => String(t).trim()).filter(t => t !== '')
      : null;
  // Si después de limpiar no quedan tags, enviar null
  const finalTagsParam = (tagsParam && tagsParam.length > 0) ? tagsParam : null;


  console.log(`[informesApi] RPC 'obtener_egresos_filtrados'`, { fechaInicio, fechaFin, categoriaIdParam, carteraIdParam, tags_param: finalTagsParam });

  const { data, error } = await supabase
    .rpc('obtener_egresos_filtrados', {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      categoria_id_param: categoriaIdParam, // Pasa null si no se seleccionó
      cartera_id_param: carteraIdParam,   // Pasa null si no se seleccionó
      tags_param: finalTagsParam          // Pasa el array de tags (o null)
    });

  if (error) {
    console.error("API Error (Egresos Filtrados RPC):", error.message);
  } else {
    console.log("[informesApi] Egresos filtrados recibidos:", data);
  }
  // La data ahora incluye la columna 'tags'
  return { data, error };
};

/**
 * Llama a la función RPC para obtener el informe de ingresos vs egresos mensuales.
 * @param {string} fechaInicio - Fecha de inicio en formato YYYY-MM-DD.
 * @param {string} fechaFin - Fecha de fin en formato YYYY-MM-DD.
 * @returns {Promise<{data: Array<{mes: string, total_ingresos: number, total_egresos: number, flujo_neto: number}>|null, error: Object|null}>}
 */
export const obtenerInformeFlujoMensual = async (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) {
        return { data: null, error: { message: 'Fechas de inicio y fin son requeridas.' } };
    }
    console.log(`[informesApi] RPC 'informe_ingresos_egresos_mensual' de ${fechaInicio} a ${fechaFin}`);
    const { data, error } = await supabase
        .rpc('informe_ingresos_egresos_mensual', {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        });

    if (error) {
        console.error("API Error (Flujo Mensual RPC):", error.message);
    } else {
        console.log("[informesApi] Datos informe flujo mensual:", data);
    }
    // La RPC ya devuelve el array de objetos {mes, total_ingresos, total_egresos, flujo_neto}
    return { data, error };
};
