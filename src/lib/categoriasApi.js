import { supabase } from './supabaseClient';

/**
 * Obtiene categorías, opcionalmente filtradas por tipo.
 * @param {'Ingreso' | 'Egreso' | null} [tipo=null] - Filtrar por tipo o null para todas.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerCategorias = async (tipo = null) => {
  // RLS filtra por usuario implícitamente
  let query = supabase
    .from('categorias')
    .select('*');

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  query = query.order('nombre', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("API Error (Categorías Get):", error.message);
  }
  return { data, error };
};

/**
 * Agrega una nueva categoría.
 * @param {object} nuevaCategoria - Objeto con { nombre, tipo }.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const agregarCategoria = async (nuevaCategoria, userId) => {
   if (!['Ingreso', 'Egreso'].includes(nuevaCategoria.tipo)) {
       return { data: null, error: { message: "Tipo de categoría inválido." } };
   }
   if (!userId) {
       return { data: null, error: { message: 'ID de usuario no proporcionado.' } };
   }
   if (!nuevaCategoria.nombre || typeof nuevaCategoria.nombre !== 'string' || nuevaCategoria.nombre.trim() === '') {
        return { data: null, error: { message: 'Nombre de categoría inválido.' } };
   }

  const categoriaConUserId = {
      ...nuevaCategoria,
      nombre: nuevaCategoria.nombre.trim(), // Limpiar nombre
      user_id: userId
  };

  const { data, error } = await supabase
    .from('categorias')
    .insert([categoriaConUserId])
    .select()
    .single();

  if (error) {
    console.error("API Error (Categorías Add):", error.message);
  }
  return { data, error };
};

/**
 * Edita una categoría existente.
 * @param {bigint} id - ID de la categoría a editar.
 * @param {object} datosActualizados - Objeto con { nombre?, tipo? }.
 * @returns {Promise<{data: object|null, error: Object|null}>}
 */
export const editarCategoria = async (id, datosActualizados) => {
   if (datosActualizados.tipo && !['Ingreso', 'Egreso'].includes(datosActualizados.tipo)) {
       return { data: null, error: { message: "Tipo de categoría inválido." } };
   }
   if (datosActualizados.nombre !== undefined && (typeof datosActualizados.nombre !== 'string' || datosActualizados.nombre.trim() === '')) {
       return { data: null, error: { message: "Nombre de categoría inválido." } };
   }
   // Limpiar nombre si se actualiza
   if (datosActualizados.nombre) {
       datosActualizados.nombre = datosActualizados.nombre.trim();
   }

  // RLS protege la edición
  const { data, error } = await supabase
    .from('categorias')
    .update(datosActualizados)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("API Error (Categorías Edit):", error.message);
  }
  return { data, error };
};

/**
 * Elimina una categoría.
 * @param {bigint} id - ID de la categoría a eliminar.
 * @returns {Promise<{data: null, error: Object|null}>}
 */
export const eliminarCategoria = async (id) => {
  // RLS protege el borrado
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Categorías Delete):", error.message);
  }
  return { data: null, error };
};

/**
 * Obtiene o crea una categoría específica para ajustes de saldo o pagos de deuda.
 * @param {'Ingreso' | 'Egreso'} tipoAjuste - El tipo de ajuste/pago.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<{id: bigint, nombre: string, tipo: string}|null>} El objeto de la categoría o null si hay error.
 */
export const obtenerOCrearCategoriaAjuste = async (tipoAjuste, userId) => {
    if (!userId) { console.error("Se requiere userId."); return null; }
    if (tipoAjuste !== 'Ingreso' && tipoAjuste !== 'Egreso') { console.error("Tipo inválido."); return null; }

    // Definir nombres estándar para estas categorías especiales
    const nombreCategoriaAjuste = tipoAjuste === 'Ingreso'
        ? 'Ajuste de Saldo (Ingreso)'
        : 'Ajuste/Pago Deuda (Egreso)'; // Un nombre más genérico para egresos

    console.log(`Buscando/Creando categoría: ${nombreCategoriaAjuste}`);

    // 1. Buscar si ya existe
    let { data: existente, error: findError } = await supabase
        .from('categorias')
        .select('id, nombre, tipo')
        .eq('user_id', userId)
        .eq('nombre', nombreCategoriaAjuste)
        .eq('tipo', tipoAjuste) // Asegurar que el tipo coincida
        .maybeSingle(); // Usa maybeSingle para no fallar si no existe

    if (findError) {
        console.error("Error buscando categoría ajuste:", findError);
        return null;
    }

    if (existente) {
        console.log("Categoría ajuste encontrada:", existente);
        return existente;
    }

    // 2. Si no existe, crearla
    console.log("Categoría ajuste no encontrada, creando...");
    const { data: nueva, error: createError } = await agregarCategoria({
        nombre: nombreCategoriaAjuste,
        tipo: tipoAjuste
    }, userId);

    if (createError) {
        console.error("Error creando categoría ajuste:", createError);
        return null;
    }

    console.log("Categoría ajuste creada:", nueva);
    return nueva;
};
