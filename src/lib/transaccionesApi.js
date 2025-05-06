import { supabase } from './supabaseClient';

// Función auxiliar para obtener ID de usuario
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

// Obtener transacciones con filtros y datos relacionados
export const obtenerTransacciones = async (filtros = {}) => {
  let query = supabase
    .from('transacciones')
    // Seleccionar todas las columnas de transacciones, tags, y nombres de relaciones
    .select(`
      *,
      tags,
      categoria:categorias ( id, nombre ),
      cartera:carteras!transacciones_cartera_id_fkey ( id, nombre ),
      cartera_origen:carteras!transacciones_cartera_origen_id_fkey ( id, nombre ),
      cartera_destino:carteras!transacciones_cartera_destino_id_fkey ( id, nombre )
    `);

  // Aplicar filtros
  if (filtros.fechaDesde) { query = query.gte('fecha', filtros.fechaDesde); }
  if (filtros.fechaHasta) { query = query.lte('fecha', filtros.fechaHasta); }
  if (filtros.tipo) { query = query.eq('tipo', filtros.tipo); }
  if (filtros.categoria_id) { query = query.eq('categoria_id', filtros.categoria_id); }
  // Filtro de cartera busca en las 3 columnas posibles
  if (filtros.cartera_id) {
      query = query.or(`cartera_id.eq.${filtros.cartera_id},cartera_origen_id.eq.${filtros.cartera_id},cartera_destino_id.eq.${filtros.cartera_id}`);
  }
  if (filtros.descripcion && filtros.descripcion.trim() !== '') { query = query.ilike('descripcion', `%${filtros.descripcion.trim()}%`); }

  // Ordenar
  query = query.order('fecha', { ascending: false }).order('fecha_creacion', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error("API Error (Transacciones Get):", error.message);
    console.error("Error completo:", error); // Log detallado
   }
  return { data, error };
};

// Agregar una nueva transacción (Ingreso, Egreso o Transferencia)
export const agregarTransaccion = async (nuevaTransaccion) => {
   const userId = await getCurrentUserId();
   if (!userId) { return { data: null, error: { message: 'Usuario no autenticado.' } }; }

   // Asegurar que 'tags' sea un array válido
   const tagsArray = Array.isArray(nuevaTransaccion.tags)
        ? nuevaTransaccion.tags.filter(tag => typeof tag === 'string' && tag.trim() !== '')
        : [];

   // Preparar objeto base para insertar
   let transaccionParaInsertar = {
       ...nuevaTransaccion,
       user_id: userId,
       tags: tagsArray,
       // Limpiar campos según el tipo
       categoria_id: nuevaTransaccion.tipo !== 'Transferencia' ? nuevaTransaccion.categoria_id : null,
       cartera_id: nuevaTransaccion.tipo !== 'Transferencia' ? nuevaTransaccion.cartera_id : null,
       cartera_origen_id: nuevaTransaccion.tipo === 'Transferencia' ? nuevaTransaccion.cartera_origen_id : null,
       cartera_destino_id: nuevaTransaccion.tipo === 'Transferencia' ? nuevaTransaccion.cartera_destino_id : null,
   };

   // Validaciones específicas por tipo
   if (transaccionParaInsertar.tipo === 'Transferencia') {
       if (!transaccionParaInsertar.cartera_origen_id || !transaccionParaInsertar.cartera_destino_id) { return { data: null, error: { message: 'Transferencia requiere origen y destino.' } }; }
       if (transaccionParaInsertar.cartera_origen_id === transaccionParaInsertar.cartera_destino_id) { return { data: null, error: { message: 'Carteras deben ser diferentes.' } }; }
       if (transaccionParaInsertar.monto <= 0) { return { data: null, error: { message: 'Monto transferencia debe ser positivo.' } }; }
   } else { // Ingreso o Egreso
        if (!transaccionParaInsertar.cartera_id) { return { data: null, error: { message: 'Ingreso/Egreso requiere cartera.' } }; }
        if (!transaccionParaInsertar.categoria_id) { return { data: null, error: { message: 'Ingreso/Egreso requiere categoría.' } }; }
        if (transaccionParaInsertar.monto <= 0) { return { data: null, error: { message: 'Monto Ingreso/Egreso debe ser positivo.' } }; }
   }

   console.log("[agregarTransaccion] Objeto a insertar:", transaccionParaInsertar);

  const { data, error } = await supabase
    .from('transacciones')
    .insert([transaccionParaInsertar])
    .select() // Seleccionar la transacción insertada
    .single();

  if (error) { console.error("API Error (Transacciones Add):", error.message); }
  else { console.log("API Éxito (Transacciones): Agregada con user_id:", userId); }
  return { data, error };
 };

// Editar una transacción existente
export const editarTransaccion = async (id, datosActualizados) => {
    // Asegurar que 'tags' sea un array si se actualiza
    if (datosActualizados.hasOwnProperty('tags')) {
         datosActualizados.tags = Array.isArray(datosActualizados.tags)
            ? datosActualizados.tags.filter(tag => typeof tag === 'string' && tag.trim() !== '')
            : [];
    }

    // Limpiar campos no relevantes si el tipo cambia (simplificado)
    if (datosActualizados.tipo && datosActualizados.tipo !== 'Transferencia') {
        datosActualizados.cartera_origen_id = null;
        datosActualizados.cartera_destino_id = null;
    } else if (datosActualizados.tipo && datosActualizados.tipo === 'Transferencia') {
        datosActualizados.categoria_id = null;
        datosActualizados.cartera_id = null;
        // Aquí faltarían validaciones si se cambian origen/destino en la edición
    }

    // RLS protege la edición no autorizada
    const { data, error } = await supabase
        .from('transacciones')
        .update(datosActualizados)
        .eq('id', id)
        .select() // Seleccionar la transacción actualizada completa
        .single();

    if (error) { console.error("API Error (Transacciones Edit):", error.message); }
    return { data, error };
 };

// Eliminar una transacción
export const eliminarTransaccion = async (id) => {
  // RLS protege el borrado no autorizado
  const { error } = await supabase
    .from('transacciones')
    .delete()
    .eq('id', id);

  if (error) { console.error("API Error (Transacciones Delete):", error.message); }
  return { data: null, error };
 };

// Obtener las últimas N transacciones
export const obtenerUltimasTransacciones = async (limite = 5) => {
    // RLS filtra por usuario
    const { data, error } = await supabase
        .from('transacciones')
        // Asegurarse que el select incluya tags y las relaciones de cartera correctas
        .select(`
            *,
            tags,
            categoria:categorias ( id, nombre ),
            cartera:carteras!transacciones_cartera_id_fkey ( id, nombre ),
            cartera_origen:carteras!transacciones_cartera_origen_id_fkey ( id, nombre ),
            cartera_destino:carteras!transacciones_cartera_destino_id_fkey ( id, nombre )
        `)
        .order('fecha', { ascending: false })
        .order('fecha_creacion', { ascending: false })
        .limit(limite);

    if (error) { console.error("API Error (Ultimas Tx):", error.message); }
    return { data, error };
 };
