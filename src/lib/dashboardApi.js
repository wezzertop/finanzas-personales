import { supabase } from './supabaseClient';

/**
 * Llama a la función RPC para obtener el resumen financiero general del usuario.
 * @returns {Promise<{data: {saldo_total_carteras: number, ingresos_mes_actual: number, egresos_mes_actual: number}|null, error: Object|null}>}
 */
export const obtenerResumenFinanciero = async () => {
  console.log("[dashboardApi] RPC 'obtener_resumen_financiero'...");
  const { data, error } = await supabase.rpc('obtener_resumen_financiero');
  const resumen = data ? data[0] : null;
  if (error) { console.error("API Error (Financiero RPC):", error.message); return { data: null, error }; }
  else if (!resumen) { console.warn("API Warn (Financiero RPC): No data."); return { data: { saldo_total_carteras: 0, ingresos_mes_actual: 0, egresos_mes_actual: 0 }, error: null }; }
  else { console.log("[dashboardApi] Resumen financiero:", resumen); return { data: resumen, error: null }; }
};

/**
 * Llama a la función RPC para obtener ingresos/egresos de los últimos meses.
 * @param {number} [numMeses=6] - El número de meses a obtener.
 * @returns {Promise<{data: Array<{mes: string, total_ingresos: number, total_egresos: number}>|null, error: Object|null}>}
 */
export const obtenerResumenMensual = async (numMeses = 6) => {
    console.log(`[dashboardApi] RPC 'obtener_resumen_mensual' (${numMeses} meses)...`);
    const { data, error } = await supabase.rpc('obtener_resumen_mensual', { num_meses: numMeses });
    if (error) { console.error("API Error (Mensual RPC):", error.message); }
    else { console.log("[dashboardApi] Resumen mensual:", data); }
    return { data, error };
};

/**
 * Obtiene un resumen de los presupuestos más avanzados del mes actual.
 * @param {number} [limite=3] - Número de presupuestos a obtener.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerResumenPresupuestos = async (limite = 3) => {
    console.log(`[dashboardApi] RPC 'obtener_estado_presupuestos_resumen' (limite ${limite})...`);
    const { data, error } = await supabase
        .rpc('obtener_estado_presupuestos_resumen', { limite: limite });
    if (error) { console.error("API Error (Presupuestos Resumen RPC):", error.message); }
    else { console.log("[dashboardApi] Resumen presupuestos:", data); }
    return { data, error };
};

/**
 * Obtiene un resumen de los objetivos de ahorro más avanzados.
 * @param {number} [limite=3] - Número de objetivos a obtener.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerResumenObjetivos = async (limite = 3) => {
    console.log(`[dashboardApi] RPC 'obtener_estado_objetivos_resumen' (limite ${limite})...`);
    const { data, error } = await supabase
        .rpc('obtener_estado_objetivos_resumen', { limite: limite });
     if (error) { console.error("API Error (Objetivos Resumen RPC):", error.message); }
     else { console.log("[dashboardApi] Resumen objetivos:", data); }
    return { data, error };
};
