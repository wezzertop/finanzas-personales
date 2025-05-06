import { supabase } from './supabaseClient';

// Obtener el estado de los presupuestos para un mes específico (YYYY-MM-DD)
// Llama a la nueva función RPC
export const obtenerPresupuestosPorMes = async (fechaMes) => {
  if (!fechaMes) {
    return { data: null, error: { message: 'Fecha del mes no proporcionada.' } };
  }
  console.log(`[presupuestosApi] Llamando a RPC 'obtener_estado_presupuestos' para mes: ${fechaMes}`);
  // RLS ya filtra por usuario dentro de la RPC
  const { data, error } = await supabase
    .rpc('obtener_estado_presupuestos', {
      mes_param: fechaMes // Pasa el parámetro a la función RPC
    });

  if (error) {
    console.error("API Error (Presupuestos RPC): No se pudo obtener estado:", error.message);
  } else {
     console.log("[presupuestosApi] Estado de presupuestos recibido:", data);
  }
  // La data ya incluye: presupuesto, gasto_real_mes, restante, progreso, etc.
  return { data, error };
};

// --- Funciones agregar, editar, eliminar (sin cambios) ---
// Siguen operando sobre la tabla directamente.
// Después de una operación, la UI deberá recargar los datos con obtenerPresupuestosPorMes.

const getCurrentUserId = async () => { /* ... (igual que antes) ... */
   const { data: { session } } = await supabase.auth.getSession(); return session?.user?.id ?? null;
};

export const agregarPresupuesto = async (nuevoPresupuesto, userId) => {
  if (!userId) { return { data: null, error: { message: 'ID usuario no proporcionado.' } }; }
  if (typeof nuevoPresupuesto.monto !== 'number' || isNaN(nuevoPresupuesto.monto) || nuevoPresupuesto.monto < 0) { return { data: null, error: { message: 'Monto inválido.' } }; }
  if (!nuevoPresupuesto.mes || isNaN(new Date(nuevoPresupuesto.mes).getTime())) { return { data: null, error: { message: 'Fecha mes inválida.' } }; }
  const presupuestoConUserId = { ...nuevoPresupuesto, user_id: userId, mes: new Date(nuevoPresupuesto.mes).toISOString().split('T')[0] };
  // Al agregar, solo insertamos. No necesitamos devolver el gasto/progreso aquí.
  const { data, error } = await supabase.from('presupuestos').insert([presupuestoConUserId]).select('id, categoria_id, monto, mes').single(); // Seleccionar solo lo básico
  if (error) { console.error("API Error (Presupuestos Add):", error.message); }
  return { data, error }; // Devolvemos solo el presupuesto creado
};

export const editarPresupuesto = async (id, datosActualizados) => {
   if (datosActualizados.monto !== undefined && (typeof datosActualizados.monto !== 'number' || isNaN(datosActualizados.monto) || datosActualizados.monto < 0)) { return { data: null, error: { message: 'Monto inválido.' } }; }
   // Al editar, solo actualizamos. No necesitamos devolver el gasto/progreso aquí.
  const { data, error } = await supabase.from('presupuestos').update(datosActualizados).eq('id', id).select('id, categoria_id, monto, mes').single(); // Seleccionar solo lo básico
  if (error) { console.error("API Error (Presupuestos Edit):", error.message); }
  return { data, error }; // Devolvemos solo el presupuesto editado
};

export const eliminarPresupuesto = async (id) => {
  const { error } = await supabase.from('presupuestos').delete().eq('id', id);
  if (error) { console.error("API Error (Presupuestos Delete):", error.message); }
  return { data: null, error };
};
