import { supabase } from './supabaseClient';

// Obtener deudas (incluyendo saldo actual y cartera de pago)
export const obtenerDebts = async () => {
  // RLS filtra por usuario implícitamente
  const { data, error } = await supabase
    .from('debts')
    .select(`
      *,
      saldo_actual,
      cartera:carteras (id, nombre)
    `)
    .order('nombre', { ascending: true });

  if (error) { console.error("API Error (Debts Get):", error.message); }
  return { data, error };
};

// Agregar deuda (inicializa saldo_actual)
export const agregarDebt = async (nuevaDeuda, userId) => {
  if (!userId) { return { data: null, error: { message: 'No ID usuario.' } }; }
  if (!nuevaDeuda.nombre || !nuevaDeuda.monto_inicial || nuevaDeuda.monto_inicial <= 0) {
      return { data: null, error: { message: 'Nombre y monto inicial positivo requeridos.'}};
  }

  const montoInicialNum = parseFloat(nuevaDeuda.monto_inicial) || 0;

  const deudaConUserId = {
    ...nuevaDeuda,
    user_id: userId,
    nombre: nuevaDeuda.nombre.trim(),
    monto_inicial: montoInicialNum,
    saldo_actual: montoInicialNum, // Inicializar saldo actual con el monto inicial
    tasa_interes_anual: parseFloat(nuevaDeuda.tasa_interes_anual) || 0,
    pago_minimo_mensual: parseFloat(nuevaDeuda.pago_minimo_mensual) || 0,
    cartera_pago_id: nuevaDeuda.cartera_pago_id || null,
    fecha_inicio: nuevaDeuda.fecha_inicio || null,
    notas: nuevaDeuda.notas ? nuevaDeuda.notas.trim() : null,
  };

  const { data, error } = await supabase
    .from('debts')
    .insert([deudaConUserId])
    .select(`*, saldo_actual, cartera:carteras (id, nombre)`) // Devolver con saldo y cartera
    .single();

  if (error) { console.error("API Error (Debts Add):", error.message); }
  return { data, error };
};

// Editar deuda (puede incluir saldo_actual para ajustes manuales)
export const editarDebt = async (id, datosActualizados) => {
   // RLS protege la edición no autorizada
   // Validar/limpiar datos
   if (datosActualizados.monto_inicial !== undefined && datosActualizados.monto_inicial <= 0) { return { data: null, error: { message: 'Monto inicial debe ser positivo.'}}; }
   if (datosActualizados.saldo_actual !== undefined && (typeof datosActualizados.saldo_actual !== 'number' || isNaN(datosActualizados.saldo_actual))) { return { data: null, error: { message: 'Saldo actual inválido.'}}; }
   if (datosActualizados.tasa_interes_anual !== undefined && datosActualizados.tasa_interes_anual < 0) { datosActualizados.tasa_interes_anual = 0; }
   if (datosActualizados.pago_minimo_mensual !== undefined && datosActualizados.pago_minimo_mensual < 0) { datosActualizados.pago_minimo_mensual = 0; }
   if (datosActualizados.hasOwnProperty('cartera_pago_id')) { datosActualizados.cartera_pago_id = datosActualizados.cartera_pago_id || null; }
   if (datosActualizados.hasOwnProperty('fecha_inicio')) { datosActualizados.fecha_inicio = datosActualizados.fecha_inicio || null; }
   if (datosActualizados.hasOwnProperty('notas')) { datosActualizados.notas = datosActualizados.notas ? datosActualizados.notas.trim() : null; }
   if (datosActualizados.nombre !== undefined) { datosActualizados.nombre = datosActualizados.nombre.trim(); }


  const { data, error } = await supabase
    .from('debts')
    .update(datosActualizados)
    .eq('id', id)
    .select(`*, saldo_actual, cartera:carteras (id, nombre)`) // Devolver con saldo y cartera
    .single();

  if (error) { console.error("API Error (Debts Edit):", error.message); }
  return { data, error };
};

// Eliminar deuda
export const eliminarDebt = async (id) => {
  // RLS protege el borrado no autorizado
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id);

  if (error) { console.error("API Error (Debts Delete):", error.message); }
  return { data: null, error };
};

/**
 * Registra un pago para una deuda específica llamando a la RPC.
 * @param {object} pagoData - Datos del pago.
 * @param {bigint} pagoData.debtId - ID de la deuda.
 * @param {number} pagoData.monto - Monto del pago (positivo).
 * @param {string} pagoData.fecha - Fecha del pago (YYYY-MM-DD).
 * @param {bigint} pagoData.carteraId - ID de la cartera desde donde se paga.
 * @param {bigint} pagoData.categoriaId - ID de la categoría "Ajuste/Pago Deuda (Egreso)".
 * @param {string|null} [pagoData.descripcion] - Descripción opcional.
 * @returns {Promise<{data: {transaccion_creada_id: bigint, nuevo_saldo_deuda: numeric}|null, error: Object|null}>}
 */
export const registrarPagoDeuda = async (pagoData) => {
    console.log("[debtsApi] Llamando a RPC 'registrar_pago_deuda' con:", pagoData);
    const { debtId, monto, fecha, carteraId, categoriaId, descripcion } = pagoData;

    // Validaciones básicas de entrada
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
    // La RPC devuelve un objeto { transaccion_creada_id, nuevo_saldo_deuda }
    return { data, error };
};
