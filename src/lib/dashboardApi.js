import { supabase } from './supabaseClient';

/**
 * Obtiene el resumen financiero general para un rango de fechas.
 * Llama a RPC: obtener_resumen_financiero
 * @param {string} fechaInicio - Fecha inicio YYYY-MM-DD.
 * @param {string} fechaFin - Fecha fin YYYY-MM-DD.
 * @returns {Promise<{data: {saldo_total_carteras: number, ingresos_periodo: number, egresos_periodo: number}|null, error: Object|null}>}
 */
export const obtenerResumenFinanciero = async (fechaInicio, fechaFin) => {
  // Validar fechas mínimamente
  if (!fechaInicio || !fechaFin) {
      return { data: null, error: { message: "Fechas requeridas para resumen financiero." } };
  }
  console.log(`[dashboardApi] RPC 'obtener_resumen_financiero' (${fechaInicio} a ${fechaFin})...`);
  const { data, error } = await supabase.rpc('obtener_resumen_financiero', {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
  });
  // La RPC devuelve un array con un objeto, o un array vacío
  const resumen = data && data.length > 0 ? data[0] : null;
  if (error) {
    console.error("API Error (Financiero RPC):", error.message);
    return { data: null, error };
  } else if (!resumen) {
    // Si no hay datos (ej. sin carteras), devolver valores por defecto
    console.warn("API Warn (Financiero RPC): No data returned by RPC.");
    return { data: { saldo_total_carteras: 0, ingresos_periodo: 0, egresos_periodo: 0 }, error: null };
  } else {
    console.log("[dashboardApi] Resumen financiero:", resumen);
    // Asegurarse de que los campos numéricos existan y sean números
    return { data: {
        saldo_total_carteras: Number(resumen.saldo_total_carteras ?? 0),
        ingresos_periodo: Number(resumen.ingresos_periodo ?? 0),
        egresos_periodo: Number(resumen.egresos_periodo ?? 0)
    }, error: null };
  }
};

/**
 * Obtiene ingresos/egresos de los últimos meses para gráfico.
 * Llama a RPC: obtener_resumen_mensual
 * @param {number} [numMeses=6] - El número de meses a obtener.
 * @returns {Promise<{data: Array<{mes: string, total_ingresos: number, total_egresos: number}>|null, error: Object|null}>}
 */
export const obtenerResumenMensual = async (numMeses = 6) => {
    console.log(`[dashboardApi] RPC 'obtener_resumen_mensual' (${numMeses} m)...`);
    const { data, error } = await supabase.rpc('obtener_resumen_mensual', { num_meses: numMeses });
    if (error) { console.error("API Error (Mensual RPC):", error.message); }
    else { console.log("[dashboardApi] Resumen mensual:", data); }
    return { data, error };
};

/**
 * Obtiene un resumen de los presupuestos más avanzados para un rango de fechas.
 * Llama a RPC: obtener_estado_presupuestos_resumen
 * @param {string} fechaInicio - Fecha inicio YYYY-MM-DD.
 * @param {string} fechaFin - Fecha fin YYYY-MM-DD.
 * @param {number} [limite=3] - Número de presupuestos a obtener.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerResumenPresupuestos = async (fechaInicio, fechaFin, limite = 3) => {
    if (!fechaInicio || !fechaFin) {
        return { data: null, error: { message: "Fechas requeridas para resumen presupuestos." } };
    }
    console.log(`[dashboardApi] RPC 'obtener_estado_presupuestos_resumen' (${fechaInicio} a ${fechaFin}, limite ${limite})...`);
    const { data, error } = await supabase
        .rpc('obtener_estado_presupuestos_resumen', {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            limite: limite
        });
    if (error) { console.error("API Error (Presupuestos Resumen RPC):", error.message); }
    else { console.log("[dashboardApi] Resumen presupuestos:", data); }
    return { data, error };
};

/**
 * Obtiene un resumen de los objetivos de ahorro más avanzados.
 * Llama a RPC: obtener_estado_objetivos_resumen
 * @param {number} [limite=3] - Número de objetivos a obtener.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerResumenObjetivos = async (limite = 3) => {
    console.log(`[dashboardApi] RPC 'obtener_estado_objetivos_resumen' (${limite})...`);
    const { data, error } = await supabase
        .rpc('obtener_estado_objetivos_resumen', { limite: limite });
     if (error) { console.error("API Error (Objetivos Resumen RPC):", error.message); }
     else { console.log("[dashboardApi] Resumen obj:", data); }
    return { data, error };
};

/**
 * Obtiene patrimonio neto calculado.
 * Llama a RPC: calcular_patrimonio_neto
 * @returns {Promise<{data: number|null, error: Object|null}>}
 */
export const obtenerPatrimonioNeto = async () => {
    console.log("[dashboardApi] RPC 'calcular_patrimonio_neto'...");
    const { data, error } = await supabase.rpc('calcular_patrimonio_neto');
    if (error) { console.error("API Error (Patrimonio RPC):", error.message); return { data: null, error }; }
    else { const p = (typeof data === 'number') ? data : 0; console.log("Patrimonio Neto:", p); return { data: p, error: null }; }
};

/**
 * Llama a la función RPC para obtener el saldo total de las deudas pendientes.
 * Llama a RPC: obtener_saldo_total_deudas
 * @returns {Promise<{data: number|null, error: Object|null}>} Objeto con el valor numérico o error.
 */
export const obtenerTotalDeudas = async () => {
    console.log("[dashboardApi] Llamando a RPC 'obtener_saldo_total_deudas'...");
    const { data, error } = await supabase.rpc('obtener_saldo_total_deudas');
    if (error) { console.error("API Error (Total Deudas RPC):", error.message); return { data: null, error }; }
    else { const totalDeudas = (typeof data === 'number') ? data : 0; console.log("[dashboardApi] Total Deudas recibido:", totalDeudas); return { data: totalDeudas, error: null }; }
};
