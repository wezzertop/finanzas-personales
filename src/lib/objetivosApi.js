import { supabase } from './supabaseClient';

// --- Main API Functions ---

/**
 * Fetches all savings goals for the current user, including calculated progress.
 * Calls the 'obtener_estado_objetivos' RPC.
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const obtenerObjetivos = async () => {
  console.log("[objetivosApi] Calling RPC 'obtener_estado_objetivos'...");
  // RLS filters by user inside the RPC
  const { data, error } = await supabase
    .rpc('obtener_estado_objetivos'); // Calls the RPC that calculates everything

  if (error) {
    console.error("API Error (Objetivos RPC): Could not fetch goal status:", error.message);
  } else {
    // Data already includes monto_actual, restante, progreso, and carteras_vinculadas (as JSON)
    // Parse the carteras_vinculadas JSON to ensure it's an array
    const processedData = data?.map(obj => ({
        ...obj,
        // Ensure carteras_vinculadas is an array, even if null or '[]' string
        carteras_vinculadas: Array.isArray(obj.carteras_vinculadas)
            ? obj.carteras_vinculadas
            // Attempt to parse only if it's a non-empty string
            : (obj.carteras_vinculadas && typeof obj.carteras_vinculadas === 'string' ? JSON.parse(obj.carteras_vinculadas) : [])
    }));
     console.log("[objetivosApi] Goal status received and processed:", processedData);
     return { data: processedData, error };
  }
  // Return original data if there was an error or no processing needed
  return { data, error };
};

/**
 * Adds a new savings goal for the user.
 * @param {object} nuevoObjetivo - Object with goal details (nombre, monto_objetivo, fecha_objetivo?, notas?).
 * @param {string} userId - The ID of the current user.
 * @returns {Promise<{data: object|null, error: Object|null}>} The basic goal data inserted.
 */
export const agregarObjetivo = async (nuevoObjetivo, userId) => {
  if (!userId) { return { data: null, error: { message: 'User ID not provided.' } }; }
  if (!nuevoObjetivo.nombre || !nuevoObjetivo.monto_objetivo || nuevoObjetivo.monto_objetivo <= 0) {
      return { data: null, error: { message: 'Invalid data. Name and positive target amount required.'}};
  }

  const objetivoConUserId = {
    ...nuevoObjetivo,
    user_id: userId,
    monto_actual: 0, // Starts at 0
    fecha_objetivo: nuevoObjetivo.fecha_objetivo || null, // Ensure null if empty
  };

  // Insert only the base goal data
  const { data, error } = await supabase
    .from('objetivos_ahorro')
    .insert([objetivoConUserId])
    .select('id, nombre, monto_objetivo, fecha_objetivo, notas') // Select minimal necessary fields
    .single();

  if (error) {
    console.error("API Error (Objetivos Add):", error.message);
  }
  // Return the basic goal data. UI will reload to get the full calculated state.
  return { data, error };
};

/**
 * Edits an existing savings goal.
 * @param {bigint} id - The ID of the goal to edit.
 * @param {object} datosActualizados - Object with fields to update (nombre?, monto_objetivo?, fecha_objetivo?, notas?).
 * @returns {Promise<{data: object|null, error: Object|null}>} The basic updated goal data.
 */
export const editarObjetivo = async (id, datosActualizados) => {
   // RLS protects unauthorized edits
   if (datosActualizados.monto_objetivo !== undefined && datosActualizados.monto_objetivo <= 0) {
       return { data: null, error: { message: 'Target amount must be positive.'}};
   }
   // Ensure fecha_objetivo is null if empty string is passed
   if (Object.prototype.hasOwnProperty.call(datosActualizados, 'fecha_objetivo')) {
       datosActualizados.fecha_objetivo = datosActualizados.fecha_objetivo || null;
   }

  // Update only the base goal data
  const { data, error } = await supabase
    .from('objetivos_ahorro')
    .update(datosActualizados)
    .eq('id', id)
    .select('id, nombre, monto_objetivo, fecha_objetivo, notas') // Select minimal necessary fields
    .single();

  if (error) {
    console.error("API Error (Objetivos Edit):", error.message);
  }
   // Return the basic goal data. UI will reload to get the full calculated state.
  return { data, error };
};

/**
 * Deletes a savings goal. Linked wallets are handled by ON DELETE CASCADE.
 * @param {bigint} id - The ID of the goal to delete.
 * @returns {Promise<{data: null, error: Object|null}>}
 */
export const eliminarObjetivo = async (id) => {
  // RLS protects unauthorized deletes
  const { error } = await supabase
    .from('objetivos_ahorro')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("API Error (Objetivos Delete):", error.message);
  }
  return { data: null, error };
};

/**
 * Updates the linked wallets for a specific goal.
 * Deletes existing links and creates new ones based on the provided array.
 * @param {bigint} objetivoId - ID of the goal to update links for.
 * @param {Array<bigint>} carteraIds - Array of wallet IDs to link.
 * @param {string} userId - ID of the current user.
 * @returns {Promise<{error: Object|null}>}
 */
export const actualizarCarterasVinculadasObjetivo = async (objetivoId, carteraIds = [], userId) => {
    if (!userId || !objetivoId) {
        return { error: { message: 'Missing data to update links.' } };
    }
    console.log(`API: Updating wallets for goal ${objetivoId} to IDs:`, carteraIds);

    try {
        // 1. Delete existing links for this goal and user
        const { error: deleteError } = await supabase
            .from('objetivos_carteras_link')
            .delete()
            .eq('objetivo_id', objetivoId)
            .eq('user_id', userId); // Ensure only user's links are deleted

        if (deleteError) {
            console.error("API Error (Link Objetivos): Error deleting old links:", deleteError);
            throw deleteError;
        }
         console.log(`API: Old links deleted for goal ${objetivoId}`);

        // 2. Insert new links (if any)
        if (carteraIds.length > 0) {
            const nuevosVinculos = carteraIds.map(carteraId => ({
                objetivo_id: objetivoId,
                cartera_id: carteraId,
                user_id: userId
            }));

            const { error: insertError } = await supabase
                .from('objetivos_carteras_link')
                .insert(nuevosVinculos);

            if (insertError) {
                console.error("API Error (Link Objetivos): Error inserting new links:", insertError);
                throw insertError;
            }
             console.log(`API: New links inserted for goal ${objetivoId}:`, nuevosVinculos);
        } else {
             console.log(`API: No new wallets to link for goal ${objetivoId}`);
        }

        // Success
        return { error: null };

    } catch (error) {
        // Return the first error encountered
        return { error };
    }
};
