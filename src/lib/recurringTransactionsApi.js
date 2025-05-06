import { supabase } from './supabaseClient';

// --- Funciones CRUD (sin cambios) ---
export const obtenerRecurringTransactions = async () => { /* ... */ const { data, error } = await supabase.from('recurring_transactions').select(`*,categoria:categorias(id,nombre,tipo),cartera:carteras(id,nombre)`).order('proxima_fecha', { ascending: true }); if (error) { console.error("API Error (Recurring): Get:", error.message); } return { data, error }; };
export const agregarRecurringTransaction = async (nuevaRecurrente, userId) => { /* ... */ if (!userId) { return { data: null, error: { message: 'ID usuario.' } }; } if (new Date(nuevaRecurrente.proxima_fecha) < new Date(nuevaRecurrente.fecha_inicio)) { nuevaRecurrente.proxima_fecha = nuevaRecurrente.fecha_inicio; } const r = { ...nuevaRecurrente, user_id: userId, fecha_inicio: formatYMD(nuevaRecurrente.fecha_inicio), proxima_fecha: formatYMD(nuevaRecurrente.proxima_fecha), fecha_fin: nuevaRecurrente.fecha_fin ? formatYMD(nuevaRecurrente.fecha_fin) : null, intervalo: parseInt(nuevaRecurrente.intervalo, 10) || 1 }; const { data, error } = await supabase.from('recurring_transactions').insert([r]).select(`*, categoria:categorias(id, nombre), cartera:carteras(id, nombre)`).single(); if (error) { console.error("API Error (Recurring): Add:", error.message); } return { data, error }; };
export const editarRecurringTransaction = async (id, datos) => { /* ... */ if (datos.fecha_inicio) { datos.fecha_inicio = formatYMD(datos.fecha_inicio); } if (datos.proxima_fecha) { datos.proxima_fecha = formatYMD(datos.proxima_fecha); } if (datos.hasOwnProperty('fecha_fin')) { datos.fecha_fin = datos.fecha_fin ? formatYMD(datos.fecha_fin) : null; } if (datos.intervalo) { datos.intervalo = parseInt(datos.intervalo, 10) || 1; } const { data, error } = await supabase.from('recurring_transactions').update(datos).eq('id', id).select(`*, categoria:categorias(id, nombre), cartera:carteras(id, nombre)`).single(); if (error) { console.error("API Error (Recurring): Edit:", error.message); } return { data, error }; };
export const eliminarRecurringTransaction = async (id) => { /* ... */ const { error } = await supabase.from('recurring_transactions').delete().eq('id', id); if (error) { console.error("API Error (Recurring): Delete:", error.message); } return { data: null, error }; };
export const generarTransaccionesVencidas = async () => { /* ... */ console.log("RPC Call: generar_transacciones_vencidas"); const { data, error } = await supabase.rpc('generar_transacciones_vencidas'); if (error) { console.error("API Error (Recurring Generate RPC):", error.message); return { count: null, error }; } else { console.log(`RPC OK. Generadas: ${data}`); return { count: data, error: null }; } };

/**
 * Obtiene las próximas N definiciones recurrentes del usuario que aún no han terminado.
 * @param {number} limite - El número máximo de recurrencias a obtener.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerProximasRecurrencias = async (limite = 5) => {
    console.log(`[recurringApi] Obteniendo próximas ${limite} recurrencias...`);
    const fechaActual = formatYMD(new Date()); // Fecha de hoy en YYYY-MM-DD
    // RLS filtra por usuario
    const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
            *,
            categoria:categorias ( id, nombre ),
            cartera:carteras ( id, nombre )
        `)
        // Filtra las que su próxima fecha es hoy o futura
        .gte('proxima_fecha', fechaActual)
        // Y que no tengan fecha de fin o cuya fecha fin sea futura
        .or(`fecha_fin.is.null,fecha_fin.gte.${fechaActual}`)
        .order('proxima_fecha', { ascending: true }) // Ordena por la más cercana
        .limit(limite); // Limita resultados

    if (error) {
        console.error("API Error (Proximas Recurrencias):", error.message);
    } else {
        console.log("[recurringApi] Próximas recurrencias obtenidas:", data);
    }
    return { data, error };
};

// Función auxiliar de formato
const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };
