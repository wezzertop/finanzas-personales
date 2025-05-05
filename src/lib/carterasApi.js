import { supabase } from './supabaseClient';

// Mantenemos la función auxiliar por si se necesita en otro lugar,
// pero agregarCartera ya no la usará directamente.
const getCurrentUserId = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error obteniendo sesión:", sessionError);
    return null;
  }
  return session?.user?.id ?? null;
};

export const obtenerCarteras = async () => {
  // RLS filtrará por usuario
  const { data, error } = await supabase
    .from('carteras')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error("API Error (Carteras): No se pudieron obtener:", error.message);
  }
  return { data, error };
};

// AHORA ACEPTA userId como segundo argumento
export const agregarCartera = async (nuevaCartera, userId) => {
  // Verificación básica del userId recibido
  if (!userId) {
      const error = { message: 'ID de usuario no proporcionado. No se puede agregar cartera.' };
      console.error(error.message);
      return { data: null, error };
  }

  // Añadimos el user_id recibido al objeto
  const carteraConUserId = {
      ...nuevaCartera,
      user_id: userId
  };
  console.log("[agregarCartera] Objeto a insertar:", carteraConUserId);

  const { data, error } = await supabase
    .from('carteras')
    .insert([carteraConUserId])
    .select()
    .single();

  if (error) {
    console.error("API Error (Carteras): No se pudo agregar:", error.message);
  } else {
     console.log("API Éxito (Carteras): Agregada correctamente. ID de usuario:", userId);
  }
  return { data, error };
};

export const editarCartera = async (id, datosActualizados) => {
   // RLS protegerá
  const { data, error } = await supabase
    .from('carteras')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("API Error (Carteras): No se pudo editar:", error.message);
  }
  return { data, error };
};

export const eliminarCartera = async (id) => {
  // RLS protegerá
  const { error } = await supabase
    .from('carteras')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Carteras): No se pudo eliminar:", error.message);
  }
  return { data: null, error };
};
