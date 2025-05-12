// Archivo: src/lib/gamificacionApi.js
import { supabase } from './supabaseClient';

// Helper para obtener el ID del usuario actual (ya lo tienes en otros archivos API, pero es bueno tenerlo aquí también por claridad)
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

/**
 * Asegura que el usuario tenga un registro de progreso en la gamificación.
 * Llama a la RPC fn_asegurar_progreso_gamificacion_usuario.
 * @returns {Promise<{error: Object|null}>}
 */
export const asegurarProgresoGamificacion = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return { error: { message: 'Usuario no autenticado para asegurar progreso.' } };

  // console.log("[gamificacionApi] Asegurando progreso para usuario:", userId);
  const { error } = await supabase.rpc('fn_asegurar_progreso_gamificacion_usuario', {
    user_id_param: userId
  });

  if (error) {
    console.error("API Error (Asegurar Progreso Gamificación RPC):", error.message);
  }
  return { error };
};

/**
 * Otorga XP a un usuario.
 * Llama a la RPC fn_otorgar_xp.
 * @param {number} cantidadXp - La cantidad de XP a otorgar.
 * @param {string} [claveEvento] - Una clave opcional para registrar por qué se otorgó el XP.
 * @returns {Promise<{nuevoXpTotal: number|null, error: Object|null}>}
 */
export const otorgarXP = async (cantidadXp, claveEvento = null) => {
  const userId = await getCurrentUserId();
  if (!userId) return { nuevoXpTotal: null, error: { message: 'Usuario no autenticado para otorgar XP.' } };

  if (typeof cantidadXp !== 'number' || cantidadXp <= 0) {
    // console.log("[gamificacionApi] No se otorga XP porque la cantidad es 0 o negativa.");
    return { nuevoXpTotal: null, error: null }; // No es un error, simplemente no se hace nada.
  }

  // console.log(`[gamificacionApi] Otorgando ${cantidadXp} XP al usuario ${userId} por evento: ${claveEvento}`);
  const { data, error } = await supabase.rpc('fn_otorgar_xp', {
    user_id_param: userId,
    cantidad_xp_param: cantidadXp,
    clave_evento_param: claveEvento
  });

  if (error) {
    console.error("API Error (Otorgar XP RPC):", error.message);
    return { nuevoXpTotal: null, error };
  }
  // console.log("[gamificacionApi] XP otorgado. Nuevo XP total:", data);
  return { nuevoXpTotal: data, error: null };
};

/**
 * Verifica si un logro se ha cumplido y, si es así, lo otorga.
 * Llama a la RPC fn_verificar_y_otorgar_logro.
 * @param {string} claveLogro - La clave única del logro a verificar.
 * @param {object} [detallesExtras] - Datos JSONB opcionales para el contexto del logro.
 * @returns {Promise<{otorgado: boolean, error: Object|null}>}
 */
export const verificarYOtorgarLogro = async (claveLogro, detallesExtras = null) => {
  const userId = await getCurrentUserId();
  if (!userId) return { otorgado: false, error: { message: 'Usuario no autenticado para verificar logro.' } };

  if (!claveLogro) {
    return { otorgado: false, error: { message: 'Clave de logro no proporcionada.' } };
  }

  // console.log(`[gamificacionApi] Verificando logro '${claveLogro}' para usuario ${userId}`);
  const { data, error } = await supabase.rpc('fn_verificar_y_otorgar_logro', {
    user_id_param: userId,
    clave_logro_param: claveLogro,
    detalles_extras_param: detallesExtras
  });

  if (error) {
    console.error(`API Error (Verificar Logro '${claveLogro}' RPC):`, error.message);
    return { otorgado: false, error };
  }
  // console.log(`[gamificacionApi] Logro '${claveLogro}' verificado. Otorgado/Existente:`, data);
  return { otorgado: data, error: null }; // data es TRUE si se otorgó o ya existía, FALSE si no.
};

/**
 * Obtiene el estado de gamificación del usuario actual (XP, nivel, etc.).
 * Llama a la RPC fn_obtener_estado_gamificacion_usuario.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const obtenerEstadoGamificacion = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado para obtener estado de gamificación.' } };

  // console.log("[gamificacionApi] Obteniendo estado de gamificación para usuario:", userId);
  const { data, error } = await supabase.rpc('fn_obtener_estado_gamificacion_usuario', {
    user_id_param: userId
  });

  if (error) {
    console.error("API Error (Obtener Estado Gamificación RPC):", error.message);
    return { data: null, error };
  }
  // La RPC devuelve un array con un objeto, o un array vacío si es la primera vez y asegurar no se llamó.
  const estado = data && data.length > 0 ? data[0] : null;
  // console.log("[gamificacionApi] Estado de gamificación obtenido:", estado);
  return { data: estado, error: null };
};

/**
 * Obtiene todos los logros desbloqueados por el usuario actual.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerLogrosDesbloqueadosUsuario = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: [], error: { message: 'Usuario no autenticado.' } };

  const { data, error } = await supabase
    .from('gamificacion_logros_desbloqueados')
    .select(`
      *,
      definicion_logro:gamificacion_definiciones_logros(*)
    `)
    .eq('user_id', userId)
    .order('fecha_desbloqueo', { ascending: false });

  if (error) {
    console.error("API Error (Get Logros Desbloqueados):", error.message);
  }
  return { data, error };
};

/**
 * Obtiene todas las definiciones de logros disponibles en el sistema.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerDefinicionesLogros = async () => {
  const { data, error } = await supabase
    .from('gamificacion_definiciones_logros')
    .select('*')
    .eq('activo', true) // Solo logros activos
    .order('xp_recompensa', { ascending: true })
    .order('nombre_logro', { ascending: true });

  if (error) {
    console.error("API Error (Get Definiciones Logros):", error.message);
  }
  return { data, error };
};
