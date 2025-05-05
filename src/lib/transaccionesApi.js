    // Archivo: src/lib/transaccionesApi.js (Con Filtros)

    import { supabase } from './supabaseClient';

    /**
     * Obtiene transacciones de la base de datos, opcionalmente filtradas.
     * @param {Object} [filtros={}] - Objeto opcional con los filtros a aplicar.
     * @param {string} [filtros.fechaDesde] - Fecha mínima (YYYY-MM-DD).
     * @param {string} [filtros.fechaHasta] - Fecha máxima (YYYY-MM-DD).
     * @param {string} [filtros.tipo] - 'Ingreso' o 'Egreso'.
     * @param {string} [filtros.categoria] - Nombre de la categoría.
     * @param {string} [filtros.cartera] - Nombre de la cartera.
     * @param {string} [filtros.descripcion] - Texto a buscar en la descripción (case-insensitive).
     * @returns {Promise<{data: Array|null, error: Object|null}>}
     */
    export const obtenerTransacciones = async (filtros = {}) => {
      console.log("API: Intentando obtener transacciones con filtros:", filtros);
      let query = supabase
        .from('transacciones')
        .select('*'); // Selecciona todas las columnas

      // Aplicar filtros si existen en el objeto 'filtros'
      if (filtros.fechaDesde) {
        // gte = Greater than or equal to (mayor o igual que)
        query = query.gte('fecha', filtros.fechaDesde);
        console.log("API: Aplicando filtro fecha >= ", filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
         // lte = Less than or equal to (menor o igual que)
        query = query.lte('fecha', filtros.fechaHasta);
        console.log("API: Aplicando filtro fecha <= ", filtros.fechaHasta);
      }
      if (filtros.tipo) {
        // eq = Equal to (igual a)
        query = query.eq('tipo', filtros.tipo);
        console.log("API: Aplicando filtro tipo = ", filtros.tipo);
      }
      if (filtros.categoria) {
        query = query.eq('categoria', filtros.categoria);
        console.log("API: Aplicando filtro categoria = ", filtros.categoria);
      }
      if (filtros.cartera) {
        query = query.eq('cartera', filtros.cartera);
        console.log("API: Aplicando filtro cartera = ", filtros.cartera);
      }
      if (filtros.descripcion && filtros.descripcion.trim() !== '') {
        // ilike = Case-insensitive LIKE (buscar texto dentro de otro, sin importar mayúsculas/minúsculas)
        // Usamos % para indicar que puede haber cualquier cosa antes o después del texto buscado
        query = query.ilike('descripcion', `%${filtros.descripcion.trim()}%`);
        console.log("API: Aplicando filtro descripción contiene (iLike) =", `%${filtros.descripcion.trim()}%`);
      }

      // Siempre ordenar por fecha descendente (más nuevas primero) al final
      query = query.order('fecha', { ascending: false })
                   .order('fecha_creacion', { ascending: false }); // Desempate por fecha_creacion

      // Ejecutar la consulta final
      const { data, error } = await query;

      if (error) {
        console.error("API Error: No se pudieron obtener las transacciones:", error.message);
      } else {
        console.log(`API Éxito: Transacciones obtenidas (${data ? data.length : 0} registros):`, data);
      }

      return { data, error };
    };

    // --- Las otras funciones (agregar, editar, eliminar) permanecen igual ---

    export const agregarTransaccion = async (nuevaTransaccion) => {
      console.log("API: Intentando agregar transacción:", nuevaTransaccion);
      const { data, error } = await supabase
        .from('transacciones')
        .insert([nuevaTransaccion])
        .select()
        .single();

      if (error) {
        console.error("API Error: No se pudo agregar la transacción:", error.message);
      } else {
        console.log("API Éxito: Transacción agregada:", data);
      }
      return { data, error };
    };

    export const editarTransaccion = async (id, datosActualizados) => {
      console.log(`API: Intentando editar transacción ID: ${id}`, datosActualizados);
      const { data, error } = await supabase
        .from('transacciones')
        .update(datosActualizados)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("API Error: No se pudo editar la transacción:", error.message);
      } else {
        console.log("API Éxito: Transacción editada:", data);
      }
      return { data, error };
    };

    export const eliminarTransaccion = async (id) => {
      console.log(`API: Intentando eliminar transacción ID: ${id}`);
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("API Error: No se pudo eliminar la transacción:", error.message);
      } else {
        console.log("API Éxito: Transacción eliminada (ID:", id, ")");
      }
      return { data: null, error };
    };
    