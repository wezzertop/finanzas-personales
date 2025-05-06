import { supabase } from './supabaseClient';

/**
 * Llama a la función RPC para obtener el resumen financiero del usuario.
 * @returns {Promise<{data: {saldo_total_carteras: number, ingresos_mes_actual: number, egresos_mes_actual: number}|null, error: Object|null}>}
 */
export const obtenerResumenFinanciero = async () => {
  console.log("[dashboardApi] Llamando a RPC 'obtener_resumen_financiero'...");
  const { data, error } = await supabase
    .rpc('obtener_resumen_financiero'); // Llama a la función

  // La RPC devuelve un array con un solo objeto, lo extraemos.
  const resumen = data ? data[0] : null;

  if (error) {
    console.error("API Error (Dashboard RPC):", error.message);
    return { data: null, error };
  } else if (!resumen) {
     console.warn("API Warning (Dashboard RPC): La función no devolvió datos.");
     // Devolver valores por defecto o manejar como error según prefieras
     return { data: { saldo_total_carteras: 0, ingresos_mes_actual: 0, egresos_mes_actual: 0 }, error: null };
  } else {
    console.log("[dashboardApi] Resumen recibido:", resumen);
    return { data: resumen, error: null };
  }
};
