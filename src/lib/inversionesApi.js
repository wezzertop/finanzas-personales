// Archivo: src/lib/inversionesApi.js
import { supabase } from './supabaseClient';

// Helper para obtener el ID del usuario actual
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

// --- API para Tipos de Activo ---

/**
 * Obtiene todos los tipos de activo (globales y del usuario).
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerTiposActivo = async () => {
  const userId = await getCurrentUserId();
  // RLS se encarga de permitir ver los user_id IS NULL (globales) y los propios del usuario.
  const { data, error } = await supabase
    .from('tipos_activo')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`) // Asegura que solo traiga los del usuario o los globales
    .order('nombre', { ascending: true });

  if (error) {
    console.error("API Error (Tipos Activo Get):", error.message);
  }
  return { data, error };
};

/**
 * Agrega un nuevo tipo de activo para el usuario.
 * @param {object} nuevoTipo - { nombre: string, descripcion?: string }
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const agregarTipoActivo = async (nuevoTipo) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };
  if (!nuevoTipo.nombre || typeof nuevoTipo.nombre !== 'string' || nuevoTipo.nombre.trim() === '') {
    return { data: null, error: { message: 'El nombre del tipo de activo es requerido.' } };
  }

  const tipoConUserId = {
    ...nuevoTipo,
    nombre: nuevoTipo.nombre.trim(),
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('tipos_activo')
    .insert([tipoConUserId])
    .select()
    .single();

  if (error) {
    console.error("API Error (Tipos Activo Add):", error.message);
  }
  return { data, error };
};

/**
 * Edita un tipo de activo existente del usuario.
 * @param {bigint} id - ID del tipo de activo a editar.
 * @param {object} datosActualizados - { nombre?: string, descripcion?: string }
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const editarTipoActivo = async (id, datosActualizados) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };
  if (datosActualizados.nombre !== undefined && (typeof datosActualizados.nombre !== 'string' || datosActualizados.nombre.trim() === '')) {
    return { data: null, error: { message: 'El nombre del tipo de activo no puede estar vacío.' } };
  }
  if (datosActualizados.nombre) {
    datosActualizados.nombre = datosActualizados.nombre.trim();
  }

  // RLS asegura que solo el propietario pueda editar
  const { data, error } = await supabase
    .from('tipos_activo')
    .update(datosActualizados)
    .eq('id', id)
    .eq('user_id', userId) // Doble check por si RLS falla o no está configurada exactamente
    .select()
    .single();

  if (error) {
    console.error("API Error (Tipos Activo Edit):", error.message);
  }
  return { data, error };
};

/**
 * Elimina un tipo de activo del usuario.
 * @param {bigint} id - ID del tipo de activo a eliminar.
 * @returns {Promise<{data: null, error: Object|null}>}
 */
export const eliminarTipoActivo = async (id) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };

  // RLS asegura que solo el propietario pueda eliminar
  const { error } = await supabase
    .from('tipos_activo')
    .delete()
    .eq('id', id)
    .eq('user_id', userId); // Doble check

  if (error) {
    console.error("API Error (Tipos Activo Delete):", error.message);
  }
  return { data: null, error };
};


// --- API para Activos de Inversión ---

/**
 * Obtiene todos los activos de inversión del usuario.
 * Incluye el nombre del tipo de activo.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerActivosInversion = async () => {
  // RLS filtra por usuario
  const { data, error } = await supabase
    .from('activos_inversion')
    .select(`
      *,
      tipo_activo:tipos_activo (id, nombre)
    `)
    .order('nombre_activo', { ascending: true });

  if (error) {
    console.error("API Error (Activos Inversión Get):", error.message);
  }
  return { data, error };
};

/**
 * Agrega un nuevo activo de inversión.
 * @param {object} nuevoActivo - { nombre_activo, ticker?, tipo_activo_id?, descripcion?, moneda_principal_activo, precio_mercado_actual_manual?, fecha_precio_mercado_actual? }
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const agregarActivoInversion = async (nuevoActivo) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };
  if (!nuevoActivo.nombre_activo || !nuevoActivo.moneda_principal_activo) {
    return { data: null, error: { message: 'Nombre del activo y moneda son requeridos.' } };
  }

  const activoConUserId = {
    ...nuevoActivo,
    user_id: userId,
    nombre_activo: nuevoActivo.nombre_activo.trim(),
    ticker: nuevoActivo.ticker ? nuevoActivo.ticker.trim().toUpperCase() : null,
    tipo_activo_id: nuevoActivo.tipo_activo_id || null,
    precio_mercado_actual_manual: parseFloat(nuevoActivo.precio_mercado_actual_manual) || 0,
    fecha_precio_mercado_actual: nuevoActivo.fecha_precio_mercado_actual || null,
  };

  const { data, error } = await supabase
    .from('activos_inversion')
    .insert([activoConUserId])
    .select('*, tipo_activo:tipos_activo (id, nombre)')
    .single();

  if (error) {
    console.error("API Error (Activos Inversión Add):", error.message);
  }
  return { data, error };
};

/**
 * Edita un activo de inversión existente.
 * @param {bigint} id - ID del activo a editar.
 * @param {object} datosActualizados - Campos a actualizar.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const editarActivoInversion = async (id, datosActualizados) => {
  // RLS protege la edición
  if (datosActualizados.nombre_activo !== undefined && datosActualizados.nombre_activo.trim() === '') {
    return { data: null, error: { message: 'El nombre del activo no puede estar vacío.' } };
  }
  if (datosActualizados.nombre_activo) datosActualizados.nombre_activo = datosActualizados.nombre_activo.trim();
  if (datosActualizados.ticker) datosActualizados.ticker = datosActualizados.ticker.trim().toUpperCase();
  if (datosActualizados.precio_mercado_actual_manual !== undefined) {
    datosActualizados.precio_mercado_actual_manual = parseFloat(datosActualizados.precio_mercado_actual_manual) || 0;
  }
   if (datosActualizados.hasOwnProperty('fecha_precio_mercado_actual')) {
       datosActualizados.fecha_precio_mercado_actual = datosActualizados.fecha_precio_mercado_actual || null;
   }
   if (datosActualizados.hasOwnProperty('tipo_activo_id')) {
       datosActualizados.tipo_activo_id = datosActualizados.tipo_activo_id || null;
   }


  const { data, error } = await supabase
    .from('activos_inversion')
    .update(datosActualizados)
    .eq('id', id)
    .select('*, tipo_activo:tipos_activo (id, nombre)')
    .single();

  if (error) {
    console.error("API Error (Activos Inversión Edit):", error.message);
  }
  return { data, error };
};

/**
 * Elimina un activo de inversión.
 * @param {bigint} id - ID del activo a eliminar.
 * @returns {Promise<{data: null, error: Object|null}>}
 */
export const eliminarActivoInversion = async (id) => {
  // RLS protege la eliminación
  const { error } = await supabase
    .from('activos_inversion')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Activos Inversión Delete):", error.message);
  }
  return { data: null, error };
};


// --- API para Transacciones de Inversión ---

/**
 * Obtiene todas las transacciones para un activo específico.
 * @param {bigint} activoId - ID del activo.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerTransaccionesInversionPorActivo = async (activoId) => {
  if (!activoId) return { data: [], error: null };
  // RLS filtra por usuario
  const { data, error } = await supabase
    .from('transacciones_inversion')
    .select('*')
    .eq('activo_id', activoId)
    .order('fecha_transaccion', { ascending: false })
    .order('fecha_creacion', { ascending: false });

  if (error) {
    console.error("API Error (Transacciones Inversión Get por Activo):", error.message);
  }
  return { data, error };
};

/**
 * Agrega una nueva transacción de inversión.
 * @param {object} nuevaTransaccion - { activo_id, tipo_transaccion, fecha_transaccion, cantidad, precio_por_unidad, comisiones?, notas? }
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const agregarTransaccionInversion = async (nuevaTransaccion) => {
  const userId = await getCurrentUserId();
  if (!userId) return { data: null, error: { message: 'Usuario no autenticado.' } };
  if (!nuevaTransaccion.activo_id || !nuevaTransaccion.tipo_transaccion || !nuevaTransaccion.fecha_transaccion || !nuevaTransaccion.cantidad || !nuevaTransaccion.precio_por_unidad) {
    return { data: null, error: { message: 'Faltan campos requeridos para la transacción.' } };
  }
  if (parseFloat(nuevaTransaccion.cantidad) <= 0 || parseFloat(nuevaTransaccion.precio_por_unidad) <= 0) {
      return { data: null, error: { message: 'Cantidad y precio deben ser positivos.'}};
  }

  const transaccionConUserId = {
    ...nuevaTransaccion,
    user_id: userId,
    cantidad: parseFloat(nuevaTransaccion.cantidad),
    precio_por_unidad: parseFloat(nuevaTransaccion.precio_por_unidad),
    comisiones: parseFloat(nuevaTransaccion.comisiones) || 0,
  };

  const { data, error } = await supabase
    .from('transacciones_inversion')
    .insert([transaccionConUserId])
    .select()
    .single();

  if (error) {
    console.error("API Error (Transacciones Inversión Add):", error.message);
  }
  return { data, error };
};

/**
 * Edita una transacción de inversión existente.
 * @param {bigint} id - ID de la transacción a editar.
 * @param {object} datosActualizados - Campos a actualizar.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const editarTransaccionInversion = async (id, datosActualizados) => {
  // RLS protege la edición
  if (datosActualizados.cantidad !== undefined && parseFloat(datosActualizados.cantidad) <= 0) {
      return { data: null, error: { message: 'Cantidad debe ser positiva.'}};
  }
  if (datosActualizados.precio_por_unidad !== undefined && parseFloat(datosActualizados.precio_por_unidad) <= 0) {
      return { data: null, error: { message: 'Precio debe ser positivo.'}};
  }
  if (datosActualizados.comisiones !== undefined) {
      datosActualizados.comisiones = parseFloat(datosActualizados.comisiones) || 0;
  }


  const { data, error } = await supabase
    .from('transacciones_inversion')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("API Error (Transacciones Inversión Edit):", error.message);
  }
  return { data, error };
};

/**
 * Elimina una transacción de inversión.
 * @param {bigint} id - ID de la transacción a eliminar.
 * @returns {Promise<{data: null, error: Object|null}>}
 */
export const eliminarTransaccionInversion = async (id) => {
  // RLS protege la eliminación
  const { error } = await supabase
    .from('transacciones_inversion')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Transacciones Inversión Delete):", error.message);
  }
  return { data: null, error };
};


// --- API para RPCs de Portafolio ---

/**
 * Obtiene el resumen del portafolio del usuario.
 * Llama a la RPC 'obtener_portafolio_con_precios_manuales'.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerPortafolio = async () => {
  console.log("[inversionesApi] Llamando a RPC 'obtener_portafolio_con_precios_manuales'...");
  const { data, error } = await supabase.rpc('obtener_portafolio_con_precios_manuales');

  if (error) {
    console.error("API Error (Portafolio RPC):", error.message);
  } else {
    console.log("[inversionesApi] Datos del portafolio recibidos:", data);
  }
  return { data, error };
};

/**
 * Obtiene el estado calculado para un activo específico.
 * Llama a la RPC 'calcular_estado_activo'.
 * @param {bigint} activoId - ID del activo.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const obtenerEstadoActivo = async (activoId) => {
    if (!activoId) return { data: null, error: { message: "ID de activo requerido."}};
    console.log(`[inversionesApi] Llamando a RPC 'calcular_estado_activo' para activo ID: ${activoId}...`);
    const { data, error } = await supabase.rpc('calcular_estado_activo', { p_activo_id: activoId });

    if (error) {
        console.error("API Error (Estado Activo RPC):", error.message);
        return { data: null, error };
    } else {
        // La RPC devuelve un array con un único objeto o un array vacío si no hay transacciones.
        const estado = data && data.length > 0 ? data[0] : {
            cantidad_actual: 0,
            costo_total_neto_compras: 0,
            cantidad_total_comprada: 0,
            costo_promedio_compra: 0,
            valor_total_neto_ventas: 0,
            cantidad_total_vendida: 0,
            costo_total_actual_ponderado: 0
        };
        console.log("[inversionesApi] Estado del activo recibido:", estado);
        return { data: estado, error: null };
    }
};
