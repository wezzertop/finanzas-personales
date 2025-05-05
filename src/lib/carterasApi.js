import { supabase } from './supabaseClient';

// Ya no necesitamos getCurrentUserId aquí si RLS y la RPC funcionan correctamente

export const obtenerCarteras = async () => {
  // Llamamos a la función RPC creada en la base de datos
  console.log("[obtenerCarteras] Llamando a RPC 'calcular_saldos_carteras'...");
  const { data, error } = await supabase
    .rpc('calcular_saldos_carteras'); // Llama a la función por su nombre

  // La función RPC ya debería filtrar por el usuario autenticado (auth.uid())
  // y devolver las carteras con la columna 'saldo_actual' calculada.

  if (error) {
    console.error("API Error (Carteras RPC): No se pudieron obtener saldos:", error.message);
  } else {
    console.log("[obtenerCarteras] Datos recibidos de RPC:", data);
  }
  // Devuelve directamente la data (que incluye saldo_actual) y el error
  return { data, error };
};

// --- Las funciones agregar, editar, eliminar no necesitan cambiar ---
// Siguen operando sobre la tabla directamente, RLS se encarga de la seguridad.

export const agregarCartera = async (nuevaCartera, userId) => {
  if (!userId) {
      const error = { message: 'ID de usuario no proporcionado.' };
      return { data: null, error };
  }
  const carteraConUserId = { ...nuevaCartera, user_id: userId };
  console.log("[agregarCartera] Objeto a insertar:", carteraConUserId);
  const { data, error } = await supabase
    .from('carteras')
    .insert([carteraConUserId])
    .select()
    .single();
  if (error) { console.error("API Error (Carteras): No se pudo agregar:", error.message); }
  return { data, error };
};

export const editarCartera = async (id, datosActualizados) => {
  const { data, error } = await supabase
    .from('carteras')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error("API Error (Carteras): No se pudo editar:", error.message); }
  return { data, error };
};

export const eliminarCartera = async (id) => {
  const { error } = await supabase
    .from('carteras')
    .delete()
    .eq('id', id);
  if (error) { console.error("API Error (Carteras): No se pudo eliminar:", error.message); }
  return { data: null, error };
};
