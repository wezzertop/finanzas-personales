import { supabase } from './supabaseClient';

// --- Funciones CRUD (sin cambios) ---
export const obtenerRecurringTransactions = async () => { /* ... */
    const { data, error } = await supabase.from('recurring_transactions').select(`*,categoria:categorias(id,nombre,tipo),cartera:carteras(id,nombre)`).order('proxima_fecha', { ascending: true });
    if (error) { console.error("API Error (Recurring): Get:", error.message); } return { data, error };
 };
export const agregarRecurringTransaction = async (nuevaRecurrente, userId) => { /* ... */
    if (!userId) { return { data: null, error: { message: 'ID usuario no proporcionado.' } }; }
    if (new Date(nuevaRecurrente.proxima_fecha) < new Date(nuevaRecurrente.fecha_inicio)) { nuevaRecurrente.proxima_fecha = nuevaRecurrente.fecha_inicio; }
    const recurrenteConUserId = { ...nuevaRecurrente, user_id: userId, fecha_inicio: formatYMD(nuevaRecurrente.fecha_inicio), proxima_fecha: formatYMD(nuevaRecurrente.proxima_fecha), fecha_fin: nuevaRecurrente.fecha_fin ? formatYMD(nuevaRecurrente.fecha_fin) : null, intervalo: parseInt(nuevaRecurrente.intervalo, 10) || 1 };
    const { data, error } = await supabase.from('recurring_transactions').insert([recurrenteConUserId]).select(`*, categoria:categorias(id, nombre), cartera:carteras(id, nombre)`).single();
    if (error) { console.error("API Error (Recurring): Add:", error.message); } return { data, error };
 };
export const editarRecurringTransaction = async (id, datosActualizados) => { /* ... */
    if (datosActualizados.fecha_inicio) { datosActualizados.fecha_inicio = formatYMD(datosActualizados.fecha_inicio); }
    if (datosActualizados.proxima_fecha) { datosActualizados.proxima_fecha = formatYMD(datosActualizados.proxima_fecha); }
    if (datosActualizados.hasOwnProperty('fecha_fin')) { datosActualizados.fecha_fin = datosActualizados.fecha_fin ? formatYMD(datosActualizados.fecha_fin) : null; }
    if (datosActualizados.intervalo) { datosActualizados.intervalo = parseInt(datosActualizados.intervalo, 10) || 1; }
    const { data, error } = await supabase.from('recurring_transactions').update(datosActualizados).eq('id', id).select(`*, categoria:categorias(id, nombre), cartera:carteras(id, nombre)`).single();
    if (error) { console.error("API Error (Recurring): Edit:", error.message); } return { data, error };
 };
export const eliminarRecurringTransaction = async (id) => { /* ... */
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
    if (error) { console.error("API Error (Recurring): Delete:", error.message); } return { data: null, error };
 };

// --- NUEVA Función para generar transacciones vencidas ---
/**
 * Llama a la función RPC para generar transacciones reales a partir de definiciones vencidas.
 * @returns {Promise<{count: number|null, error: Object|null}>} Objeto con el conteo de transacciones generadas o error.
 */
export const generarTransaccionesVencidas = async () => {
  console.log("[recurringApi] Llamando a RPC 'generar_transacciones_vencidas'...");
  const { data, error } = await supabase
    .rpc('generar_transacciones_vencidas'); // Llama a la función

  if (error) {
    console.error("API Error (Recurring Generate RPC):", error.message);
    return { count: null, error };
  } else {
    // La RPC devuelve directamente el número (count)
    console.log(`[recurringApi] RPC completada. Transacciones generadas: ${data}`);
    return { count: data, error: null };
  }
};

// Función auxiliar de formato (si no la tienes global)
const formatYMD = (date) => {
    if (!date) return '';
    try {
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; }
        return new Date(date).toISOString().split('T')[0];
    } catch (e) { return ''; }
};
