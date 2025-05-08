import { supabase } from './supabaseClient';

/**
 * Llama a la función RPC para obtener las transacciones de EGRESO filtradas.
 * @param {string} fechaInicio - Fecha inicio YYYY-MM-DD.
 * @param {string} fechaFin - Fecha fin YYYY-MM-DD.
 * @param {number|null} [categoriaId=null] - ID categoría opcional.
 * @param {number|null} [carteraId=null] - ID cartera opcional.
 * @param {Array<string>|null} [tags=null] - Array de tags opcional (buscará overlap).
 * @returns {Promise<{data: Array|null, error: Object|null}>} Lista de transacciones filtradas.
 */
export const obtenerEgresosFiltrados = async (fechaInicio, fechaFin, categoriaId = null, carteraId = null, tags = null) => {
  if (!fechaInicio || !fechaFin) { return { data: null, error: { message: 'Fechas requeridas.' } }; }
  const categoriaIdParam = categoriaId ? parseInt(categoriaId, 10) : null;
  const carteraIdParam = carteraId ? parseInt(carteraId, 10) : null;
  const tagsParam = (Array.isArray(tags) && tags.length > 0) ? tags.map(t => String(t).trim()).filter(t => t !== '') : null;
  const finalTagsParam = (tagsParam && tagsParam.length > 0) ? tagsParam : null;

  console.log(`[informesApi] RPC 'obtener_egresos_filtrados'`, { fechaInicio, fechaFin, categoriaIdParam, carteraIdParam, tags_param: finalTagsParam });
  const { data, error } = await supabase.rpc('obtener_egresos_filtrados', { fecha_inicio: fechaInicio, fecha_fin: fechaFin, categoria_id_param: categoriaIdParam, cartera_id_param: carteraIdParam, tags_param: finalTagsParam });
  if (error) { console.error("API Error (Egresos Filtrados RPC):", error.message); }
  else { console.log("[informesApi] Egresos filtrados recibidos:", data); }
  return { data, error };
};

/**
 * Llama a la función RPC para obtener el informe de ingresos vs egresos mensuales.
 * @param {string} fechaInicio - Fecha de inicio en formato YYYY-MM-DD.
 * @param {string} fechaFin - Fecha de fin en formato YYYY-MM-DD.
 * @returns {Promise<{data: Array<{mes: string, total_ingresos: number, total_egresos: number, flujo_neto: number}>|null, error: Object|null}>}
 */
export const obtenerInformeFlujoMensual = async (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) { return { data: null, error: { message: 'Fechas requeridas.' } }; }
    console.log(`[informesApi] RPC 'informe_ingresos_egresos_mensual' de ${fechaInicio} a ${fechaFin}`);
    const { data, error } = await supabase.rpc('informe_ingresos_egresos_mensual', { fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    if (error) { console.error("API Error (Flujo Mensual RPC):", error.message); }
    else { console.log("[informesApi] Datos informe flujo mensual:", data); }
    return { data, error };
};

/**
 * Llama a la función RPC para obtener la comparación de ingresos/egresos entre dos meses.
 * @param {string} mes1Inicio - Primer día del mes 1 (YYYY-MM-DD).
 * @param {string} mes2Inicio - Primer día del mes 2 (YYYY-MM-DD).
 * @returns {Promise<{data: Array<{periodo: string, tipo: string, categoria_nombre: string, monto_total: number}>|null, error: Object|null}>}
 */
export const obtenerComparacionMensual = async (mes1Inicio, mes2Inicio) => {
    if (!mes1Inicio || !mes2Inicio) { return { data: null, error: { message: "Se requieren las fechas de inicio de ambos meses." } }; }
    console.log(`[informesApi] RPC 'comparar_meses' (${mes1Inicio} vs ${mes2Inicio})`);
    const { data, error } = await supabase.rpc('comparar_meses', { mes1_inicio: mes1Inicio, mes2_inicio: mes2Inicio });
    if (error) { console.error("API Error (Comparación Mensual RPC):", error.message); }
    else { console.log("[informesApi] Datos comparación mensual:", data); }
    return { data, error };
};
