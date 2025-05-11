// Archivo: src/lib/debtsApi.js
import { supabase } from './supabaseClient';

// Helper para obtener el ID del usuario actual (si es necesario explícitamente)
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

/**
 * Obtiene todas las deudas del usuario.
 * Incluye saldo_actual (calculado por la vista o RPC en la DB) y la cartera de pago asociada.
 * También incluye los nuevos campos tipo_deuda y frecuencia_pago.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerDebts = async () => {
  // RLS filtra por usuario implícitamente
  const { data, error } = await supabase
    .from('debts') // La tabla 'debts' ya debería tener saldo_actual gracias a la vista/RPC
    .select(`
      *,
      saldo_actual, 
      tipo_deuda, 
      frecuencia_pago,
      cartera:carteras (id, nombre)
    `)
    .order('nombre', { ascending: true });

  if (error) {
    console.error("API Error (Debts Get):", error.message);
  } else {
    console.log("[debtsApi] Deudas obtenidas (con saldo_actual, tipo, frecuencia):", data);
  }
  return { data, error };
};

/**
 * Agrega una nueva deuda.
 * @param {object} nuevaDeuda - Objeto con los detalles de la deuda.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const agregarDebt = async (nuevaDeuda, userId) => {
  if (!userId) {
    return { data: null, error: { message: 'ID de usuario no proporcionado.' } };
  }
  if (!nuevaDeuda.nombre || !nuevaDeuda.monto_inicial || nuevaDeuda.monto_inicial <= 0) {
    return { data: null, error: { message: 'Nombre y monto inicial positivo son requeridos.' } };
  }

  const montoInicialNum = parseFloat(nuevaDeuda.monto_inicial) || 0;

  const deudaConUserId = {
    user_id: userId,
    nombre: nuevaDeuda.nombre.trim(),
    monto_inicial: montoInicialNum,
    saldo_actual: montoInicialNum, // Saldo actual se inicializa con el monto inicial
    tasa_interes_anual: parseFloat(nuevaDeuda.tasa_interes_anual) || 0,
    pago_minimo_mensual: parseFloat(nuevaDeuda.pago_minimo_mensual) || 0,
    cartera_pago_id: nuevaDeuda.cartera_pago_id || null,
    fecha_inicio: nuevaDeuda.fecha_inicio || null,
    notas: nuevaDeuda.notas ? nuevaDeuda.notas.trim() : null,
    tipo_deuda: nuevaDeuda.tipo_deuda || 'Personal', // Nuevo campo
    frecuencia_pago: nuevaDeuda.frecuencia_pago || 'mensual', // Nuevo campo
  };

  console.log("[debtsApi] Agregando deuda:", deudaConUserId);

  const { data, error } = await supabase
    .from('debts')
    .insert([deudaConUserId])
    .select(`*, saldo_actual, tipo_deuda, frecuencia_pago, cartera:carteras (id, nombre)`)
    .single();

  if (error) {
    console.error("API Error (Debts Add):", error.message);
  }
  return { data, error };
};

/**
 * Edita una deuda existente.
 * @param {bigint} id - ID de la deuda a editar.
 * @param {object} datosActualizados - Campos a actualizar.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const editarDebt = async (id, datosActualizados) => {
  // Validaciones y limpieza de datos
  if (datosActualizados.nombre !== undefined) {
    datosActualizados.nombre = datosActualizados.nombre.trim();
    if (datosActualizados.nombre === '') return { data: null, error: { message: 'El nombre no puede estar vacío.'}};
  }
  if (datosActualizados.monto_inicial !== undefined && (isNaN(parseFloat(datosActualizados.monto_inicial)) || parseFloat(datosActualizados.monto_inicial) <= 0)) {
    return { data: null, error: { message: 'Monto inicial debe ser un número positivo.' } };
  }
  if (datosActualizados.tasa_interes_anual !== undefined) {
    datosActualizados.tasa_interes_anual = parseFloat(datosActualizados.tasa_interes_anual) || 0;
  }
  if (datosActualizados.pago_minimo_mensual !== undefined) {
    datosActualizados.pago_minimo_mensual = parseFloat(datosActualizados.pago_minimo_mensual) || 0;
  }
  if (datosActualizados.hasOwnProperty('cartera_pago_id')) {
    datosActualizados.cartera_pago_id = datosActualizados.cartera_pago_id || null;
  }
  if (datosActualizados.hasOwnProperty('fecha_inicio')) {
    datosActualizados.fecha_inicio = datosActualizados.fecha_inicio || null;
  }
  if (datosActualizados.hasOwnProperty('notas')) {
    datosActualizados.notas = datosActualizados.notas ? datosActualizados.notas.trim() : null;
  }
  // Manejo de nuevos campos
  if (datosActualizados.hasOwnProperty('tipo_deuda')) {
    datosActualizados.tipo_deuda = datosActualizados.tipo_deuda || 'Personal';
  }
  if (datosActualizados.hasOwnProperty('frecuencia_pago')) {
    datosActualizados.frecuencia_pago = datosActualizados.frecuencia_pago || 'mensual';
  }
  // No permitir modificar saldo_actual directamente aquí, se maneja con pagos o RPCs específicas.
  delete datosActualizados.saldo_actual;


  console.log("[debtsApi] Editando deuda ID:", id, "con datos:", datosActualizados);

  const { data, error } = await supabase
    .from('debts')
    .update(datosActualizados)
    .eq('id', id)
    .select(`*, saldo_actual, tipo_deuda, frecuencia_pago, cartera:carteras (id, nombre)`)
    .single();

  if (error) {
    console.error("API Error (Debts Edit):", error.message);
  }
  return { data, error };
};

/**
 * Elimina una deuda.
 * @param {bigint} id - ID de la deuda a eliminar.
 * @returns {Promise<{data: null, error: Object|null}>}
 */
export const eliminarDebt = async (id) => {
  console.log("[debtsApi] Eliminando deuda ID:", id);
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Debts Delete):", error.message);
  }
  return { data: null, error };
};

/**
 * Registra un pago para una deuda específica llamando a la RPC.
 * @param {object} pagoData - Datos del pago.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const registrarPagoDeuda = async (pagoData) => {
  console.log("[debtsApi] Llamando a RPC 'registrar_pago_deuda' con:", pagoData);
  const { debtId, monto, fecha, carteraId, categoriaId, descripcion } = pagoData;

  if (!debtId || !monto || !fecha || !carteraId || !categoriaId || monto <= 0) {
    return { data: null, error: { message: "Faltan datos requeridos o son inválidos para registrar el pago." } };
  }

  const { data, error } = await supabase.rpc('registrar_pago_deuda', {
    p_debt_id: debtId,
    p_monto_pago: monto,
    p_fecha_pago: fecha,
    p_cartera_pago_id: carteraId,
    p_categoria_pago_id: categoriaId,
    p_descripcion_pago: descripcion || null
  });

  if (error) {
    console.error("API Error (Registrar Pago RPC):", error.message);
  } else {
    console.log("[debtsApi] Pago registrado, resultado RPC:", data);
  }
  return { data, error };
};

/**
 * Llama a la función RPC para calcular la tabla de amortización.
 * @param {number} montoPrestamo - Monto total del préstamo/deuda.
 * @param {number} tasaInteresAnual - Tasa de interés anual (ej: 0.12 para 12%).
 * @param {number} numeroPagosMeses - Plazo total en meses.
 * @param {number|null} [pagoMensualFijo=null] - Pago mensual fijo si se conoce, sino se calcula.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerTablaAmortizacion = async (montoPrestamo, tasaInteresAnual, numeroPagosMeses, pagoMensualFijo = null) => {
  if (montoPrestamo <= 0 || tasaInteresAnual < 0 || numeroPagosMeses <= 0) {
    return { data: null, error: { message: "Parámetros inválidos para calcular amortización." } };
  }
  console.log(`[debtsApi] RPC 'fn_calcular_tabla_amortizacion' con:`, { montoPrestamo, tasaInteresAnual, numeroPagosMeses, pagoMensualFijo });

  const { data, error } = await supabase.rpc('fn_calcular_tabla_amortizacion', {
    p_monto_prestamo: montoPrestamo,
    p_tasa_interes_anual: tasaInteresAnual,
    p_numero_pagos_meses: numeroPagosMeses,
    p_pago_mensual_fijo: pagoMensualFijo
  });

  if (error) {
    console.error("API Error (Tabla Amortización RPC):", error.message);
  } else {
    console.log("[debtsApi] Tabla de amortización recibida:", data);
  }
  return { data, error };
};
