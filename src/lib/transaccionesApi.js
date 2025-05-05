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

export const obtenerTransacciones = async (filtros = {}) => {
  // RLS filtrará por usuario
  let query = supabase
    .from('transacciones')
    .select(`
      *,
      categoria:categorias ( id, nombre ),
      cartera:carteras ( id, nombre )
    `);

  if (filtros.fechaDesde) {
    query = query.gte('fecha', filtros.fechaDesde);
  }
  if (filtros.fechaHasta) {
    query = query.lte('fecha', filtros.fechaHasta);
  }
  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo);
  }
  if (filtros.categoria_id) {
    query = query.eq('categoria_id', filtros.categoria_id);
  }
  if (filtros.cartera_id) {
    query = query.eq('cartera_id', filtros.cartera_id);
  }
  if (filtros.descripcion && filtros.descripcion.trim() !== '') {
    query = query.ilike('descripcion', `%${filtros.descripcion.trim()}%`);
  }

  query = query.order('fecha', { ascending: false })
               .order('fecha_creacion', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("API Error (Transacciones): No se pudieron obtener:", error.message);
  }

  return { data, error };
};

export const agregarTransaccion = async (nuevaTransaccion) => {
   const userId = await getCurrentUserId();
   if (!userId) {
       const error = { message: 'Usuario no autenticado. No se puede agregar transacción.' };
       console.error(error.message);
       return { data: null, error };
   }

   const transaccionConUserId = {
       ...nuevaTransaccion,
       user_id: userId
   };

  const { data, error } = await supabase
    .from('transacciones')
    .insert([transaccionConUserId])
    .select()
    .single();

  if (error) {
    console.error("API Error (Transacciones): No se pudo agregar:", error.message);
  } else {
     console.log("API Éxito (Transacciones): Agregada con user_id:", userId);
  }
  return { data, error };
};

export const editarTransaccion = async (id, datosActualizados) => {
  // RLS protegerá la edición no autorizada
  const { data, error } = await supabase
    .from('transacciones')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("API Error (Transacciones): No se pudo editar:", error.message);
  }
  return { data, error };
};

export const eliminarTransaccion = async (id) => {
  // RLS protegerá el borrado no autorizado
  const { error } = await supabase
    .from('transacciones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Transacciones): No se pudo eliminar:", error.message);
  }
  return { data: null, error };
};
