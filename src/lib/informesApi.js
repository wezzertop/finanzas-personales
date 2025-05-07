import { supabase } from './supabaseClient';

/**
 * Obtiene las transacciones de EGRESO filtradas por fecha, categoría y/o cartera.
 * @param {string} fechaInicio - Fecha inicio YYYY-MM-DD.
 * @param {string} fechaFin - Fecha fin YYYY-MM-DD.
 * @param {number|null} [categoriaId=null] - ID categoría opcional.
 * @param {number|null} [carteraId=null] - ID cartera opcional.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerEgresosFiltrados = async (fechaInicio, fechaFin, categoriaId = null, carteraId = null) => {
  if (!fechaInicio || !fechaFin) { return { data: null, error: { message: 'Fechas requeridas.' } }; }
  const catIdParam = categoriaId ? parseInt(categoriaId, 10) : null;
  const cartIdParam = carteraId ? parseInt(carteraId, 10) : null;
  console.log(`[informesApi] RPC 'obtener_egresos_filtrados'`, { fechaInicio, fechaFin, catIdParam, cartIdParam });
  const { data, error } = await supabase.rpc('obtener_egresos_filtrados', { fecha_inicio: fechaInicio, fecha_fin: fechaFin, categoria_id_param: catIdParam, cartera_id_param: cartIdParam });
  if (error) { console.error("API Error (Egresos Filtrados RPC):", error.message); }
  else { console.log("[informesApi] Egresos filtrados:", data); }
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
