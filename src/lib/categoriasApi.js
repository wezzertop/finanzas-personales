import { supabase } from './supabaseClient';

// Función auxiliar para obtener el ID del usuario actual
const getCurrentUserId = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error obteniendo sesión:", sessionError);
    return null;
  }
  return session?.user?.id ?? null;
};

// Obtener categorías, opcionalmente filtradas por tipo (Ingreso/Egreso)
export const obtenerCategorias = async (tipo = null) => {
  // RLS se encargará de filtrar por usuario
  let query = supabase
    .from('categorias')
    .select('*');

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  query = query.order('nombre', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("API Error (Categorías): No se pudieron obtener:", error.message);
  }
  return { data, error };
};

export const agregarCategoria = async (nuevaCategoria) => {
   if (!['Ingreso', 'Egreso'].includes(nuevaCategoria.tipo)) {
       const error = { message: "El tipo de categoría debe ser 'Ingreso' o 'Egreso'." };
       console.error("API Error (Categorías):", error.message);
       return { data: null, error };
   }

   // Obtenemos el ID del usuario logueado
   const userId = await getCurrentUserId();
   if (!userId) {
       const error = { message: 'Usuario no autenticado. No se puede agregar categoría.' };
       console.error(error.message);
       return { data: null, error };
   }

   // Añadimos el user_id al objeto que se va a insertar
   const categoriaConUserId = {
       ...nuevaCategoria,
       user_id: userId
   };

  const { data, error } = await supabase
    .from('categorias')
    .insert([categoriaConUserId]) // Insertamos el objeto completo
    .select()
    .single();

  if (error) {
    console.error("API Error (Categorías): No se pudo agregar:", error.message);
  } else {
     console.log("API Éxito (Categorías): Agregada con user_id:", userId);
  }
  return { data, error };
};

export const editarCategoria = async (id, datosActualizados) => {
   if (datosActualizados.tipo && !['Ingreso', 'Egreso'].includes(datosActualizados.tipo)) {
       const error = { message: "El tipo de categoría debe ser 'Ingreso' o 'Egreso'." };
       console.error("API Error (Categorías):", error.message);
       return { data: null, error };
   }
   // RLS protegerá la edición no autorizada

  const { data, error } = await supabase
    .from('categorias')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("API Error (Categorías): No se pudo editar:", error.message);
  }
  return { data, error };
};

export const eliminarCategoria = async (id) => {
  // RLS protegerá el borrado no autorizado
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Categorías): No se pudo eliminar:", error.message);
  }
  return { data: null, error };
};
