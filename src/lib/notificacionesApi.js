// Archivo: src/lib/notificacionesApi.js
import { supabase } from './supabaseClient';

// Helper para obtener el ID del usuario actual
const getCurrentUserId = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session in API:", error.message);
    return null;
  }
  return session?.user?.id ?? null;
};

// --- Configuración de Alertas del Usuario ---

/**
 * Obtiene la configuración de alertas para el usuario actual.
 * Si no existe, llama a la RPC para crear una configuración por defecto.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const obtenerConfiguracionAlertasUsuario = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };

  // Primero, intentar asegurar que el registro de configuración exista.
  const { error: ensureError } = await supabase.rpc('asegurar_configuracion_alertas_usuario');
  if (ensureError) {
    console.error("API Error (Asegurar Config Alertas):", ensureError.message);
    // No retornamos aquí, intentamos leer de todas formas, podría ya existir.
  }

  const { data, error } = await supabase
    .from('configuraciones_alertas_usuario')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: 'single' row not found
    console.error("API Error (Get Config Alertas):", error.message);
  } else if (error && error.code === 'PGRST116') {
    // Esto no debería pasar si asegurar_configuracion_alertas_usuario funciona,
    // pero es un fallback.
    console.warn("Configuración de alertas no encontrada para el usuario, se intentó crear una.");
    return { data: null, error: { message: "No se encontró configuración, intente de nuevo."}};
  }
  return { data, error: error && error.code !== 'PGRST116' ? error : null };
};

/**
 * Actualiza la configuración de alertas para el usuario actual.
 * @param {object} nuevasConfiguraciones - Objeto con los campos a actualizar.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const actualizarConfiguracionAlertasUsuario = async (nuevasConfiguraciones) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };

  // Validaciones básicas (se pueden expandir)
  if (nuevasConfiguraciones.alerta_presupuesto_umbral_porcentaje !== undefined) {
    const umbral = parseInt(nuevasConfiguraciones.alerta_presupuesto_umbral_porcentaje, 10);
    if (isNaN(umbral) || umbral < 1 || umbral > 100) {
      return { data: null, error: { message: 'Umbral de presupuesto debe estar entre 1 y 100.' } };
    }
  }
  if (nuevasConfiguraciones.alerta_recurrente_dias_anticipacion !== undefined) {
    const dias = parseInt(nuevasConfiguraciones.alerta_recurrente_dias_anticipacion, 10);
    if (isNaN(dias) || dias < 0 || dias > 30) {
      return { data: null, error: { message: 'Días de anticipación para recurrentes debe estar entre 0 y 30.' } };
    }
  }
  // Añadir más validaciones para otros campos si es necesario

  const { data, error } = await supabase
    .from('configuraciones_alertas_usuario')
    .update(nuevasConfiguraciones)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error("API Error (Update Config Alertas):", error.message);
  }
  return { data, error };
};


// --- Notificaciones ---

/**
 * Obtiene las notificaciones para el usuario actual.
 * @param {object} [options] - Opciones de filtrado.
 * @param {boolean} [options.soloNoLeidas=false] - Si es true, solo devuelve no leídas.
 * @param {number} [options.limite=20] - Número máximo de notificaciones a devolver.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerNotificaciones = async (options = {}) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: [], error: { message: 'Usuario no autenticado.' } };

  const { soloNoLeidas = false, limite = 20 } = options;

  let query = supabase
    .from('notificaciones')
    .select('*')
    .eq('user_id', userId);

  if (soloNoLeidas) {
    query = query.eq('leida', false);
  }

  query = query.order('fecha_creacion', { ascending: false }).limit(limite);

  const { data, error } = await query;

  if (error) {
    console.error("API Error (Get Notificaciones):", error.message);
  }
  return { data, error };
};

/**
 * Marca una notificación específica como leída.
 * @param {bigint} notificacionId - ID de la notificación.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const marcarNotificacionComoLeida = async (notificacionId) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };

  const { data, error } = await supabase
    .from('notificaciones')
    .update({ leida: true, fecha_leida: new Date().toISOString() })
    .eq('id', notificacionId)
    .eq('user_id', userId) // Asegurar que solo pueda marcar sus propias notificaciones
    .select()
    .single();

  if (error) {
    console.error("API Error (Marcar Leída):", error.message);
  }
  return { data, error };
};

/**
 * Marca todas las notificaciones no leídas del usuario como leídas.
 * @returns {Promise<{count: number|null, error: Object|null}>} El número de notificaciones actualizadas.
 */
export const marcarTodasComoLeidas = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return { count: null, error: { message: 'Usuario no autenticado.' } };

  const { count, error } = await supabase
    .from('notificaciones')
    .update({ leida: true, fecha_leida: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('leida', false); // Solo actualizar las no leídas

  if (error) {
    console.error("API Error (Marcar Todas Leídas):", error.message);
  }
  return { count, error };
};

/**
 * Elimina una notificación específica.
 * @param {bigint} notificacionId - ID de la notificación a eliminar.
 * @returns {Promise<{data: null, error: Object|null}>}
 */
export const eliminarNotificacion = async (notificacionId) => {
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };

    const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', notificacionId)
        .eq('user_id', userId); // Asegurar que solo pueda eliminar sus propias notificaciones

    if (error) {
        console.error("API Error (Eliminar Notificación):", error.message);
    }
    return { data: null, error };
};


// --- Generación de Alertas (Ejemplo para Presupuestos) ---

/**
 * Llama a la RPC para generar alertas de presupuesto para el usuario actual.
 * Idealmente, esto se llamaría desde un cron job, pero puede ser útil para pruebas.
 * @returns {Promise<{data: {notificaciones_generadas: number}|null, error: Object|null}>}
 */
export const generarAlertasPresupuestoUsuarioActual = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };

  console.log("[notificacionesApi] Llamando a RPC 'fn_generar_alertas_presupuesto' para usuario:", userId);
  const { data, error } = await supabase.rpc('fn_generar_alertas_presupuesto', {
    p_user_id: userId
  });

  if (error) {
    console.error("API Error (Generar Alertas Presupuesto RPC):", error.message);
    return { data: null, error };
  } else {
    console.log("[notificacionesApi] Notificaciones de presupuesto generadas:", data);
    return { data: { notificaciones_generadas: data }, error: null };
  }
};
