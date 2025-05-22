import { supabase } from './supabaseClient';

const getCurrentUserId = async () => { const { data: { session } } = await supabase.auth.getSession(); return session?.user?.id ?? null; };

export const obtenerTransacciones = async (filtros = {}) => { /* ... (código igual que la última versión correcta) ... */ let query = supabase.from('transacciones').select(`*,tags,categoria:categorias(id,nombre),cartera:cartera_id(id,nombre),cartera_origen:cartera_origen_id(id,nombre),cartera_destino:cartera_destino_id(id,nombre),splits:transaction_splits(id,categoria_id,monto,notas,categoria:categorias(id,nombre))`); if (filtros.fechaDesde) query = query.gte('fecha', filtros.fechaDesde); if (filtros.fechaHasta) query = query.lte('fecha', filtros.fechaHasta); if (filtros.tipo) query = query.eq('tipo', filtros.tipo); if (filtros.categoria_id) query = query.eq('categoria_id', filtros.categoria_id); if (filtros.cartera_id) query = query.or(`cartera_id.eq.${filtros.cartera_id},cartera_origen_id.eq.${filtros.cartera_id},cartera_destino_id.eq.${filtros.cartera_id}`); if (filtros.descripcion && filtros.descripcion.trim() !== '') query = query.ilike('descripcion', `%${filtros.descripcion.trim()}%`); if (Array.isArray(filtros.tags) && filtros.tags.length > 0) { const tL = filtros.tags.map(t => String(t).trim()).filter(t => t !== ''); if (tL.length > 0) query = query.contains('tags', tL); } query = query.order('fecha', { ascending: false }).order('fecha_creacion', { ascending: false }); const { data, error } = await query; if (error) { console.error("API Get:", error.message); console.error("Full Get Err:", error); } return { data, error }; };

export const agregarTransaccion = async (nuevaTransaccion) => {
   // --- VERIFICACIÓN INICIAL DEL ARGUMENTO ---
   if (!nuevaTransaccion || typeof nuevaTransaccion !== 'object') {
       console.error("[transaccionesApi.js] agregarTransaccion fue llamada con argumento inválido:", nuevaTransaccion);
       return { data: null, error: { message: 'Datos de transacción inválidos o no proporcionados a la API.' } };
   }
   // --- FIN VERIFICACIÓN ---

   const userId = await getCurrentUserId();
   if (!userId) { return { data: null, error: { message: 'Usuario no autenticado.' } }; }

   // Asegurar que 'tags' sea un array, incluso si nuevaTransaccion.tags es undefined
   const tagsArray = Array.isArray(nuevaTransaccion.tags)
        ? nuevaTransaccion.tags.filter(tag => typeof tag === 'string' && tag.trim() !== '')
        : [];

   const { splits, ...transaccionBase } = nuevaTransaccion; // Extraer splits
   const tieneSplits = Array.isArray(splits) && splits.length > 0;

   // Validar suma de splits vs monto total si hay splits
   if (tieneSplits) {
       const sumaSplits = splits.reduce((sum, split) => sum + (parseFloat(split.monto) || 0), 0);
       const montoTotal = parseFloat(transaccionBase.monto);
       if (Math.abs(sumaSplits - montoTotal) > 0.01) { return { data: null, error: { message: `Suma splits (${sumaSplits.toFixed(2)}) != monto total (${montoTotal.toFixed(2)}).` } }; }
       for (const split of splits) { if (!split.categoria_id || !split.monto || parseFloat(split.monto) <= 0) { return { data: null, error: { message: 'Cada división: categoría y monto > 0.'}}; } }
   }

   let transaccionParaInsertar = {
       ...transaccionBase,
       user_id: userId,
       tags: tagsArray,
       is_split: tieneSplits,
       categoria_id: tieneSplits ? null : (transaccionBase.tipo !== 'Transferencia' ? transaccionBase.categoria_id : null),
       cartera_id: transaccionBase.tipo !== 'Transferencia' ? transaccionBase.cartera_id : null,
       cartera_origen_id: transaccionBase.tipo === 'Transferencia' ? transaccionBase.cartera_origen_id : null,
       cartera_destino_id: transaccionBase.tipo === 'Transferencia' ? transaccionBase.cartera_destino_id : null,
   };

   // Validaciones específicas por tipo
   if (transaccionParaInsertar.tipo === 'Transferencia') { if (!transaccionParaInsertar.cartera_origen_id || !transaccionParaInsertar.cartera_destino_id) { return { data: null, error: { message: 'Transferencia requiere origen y destino.' } }; } if (transaccionParaInsertar.cartera_origen_id === transaccionParaInsertar.cartera_destino_id) { return { data: null, error: { message: 'Carteras deben ser diferentes.' } }; } if (transaccionParaInsertar.monto <= 0) { return { data: null, error: { message: 'Monto transferencia debe ser positivo.' } }; } }
   else if (!tieneSplits && transaccionParaInsertar.tipo !== 'Transferencia') { if (!transaccionParaInsertar.cartera_id) { return { data: null, error: { message: 'Ingreso/Egreso requiere cartera.' } }; } if (!transaccionParaInsertar.categoria_id) { return { data: null, error: { message: 'Ingreso/Egreso requiere categoría.' } }; } if (transaccionParaInsertar.monto <= 0) { return { data: null, error: { message: 'Monto Ingreso/Egreso debe ser positivo.' } }; } }


   console.log("[agregarTransaccion] Objeto a insertar (base):", transaccionParaInsertar);
   if (tieneSplits) console.log("[agregarTransaccion] Splits a insertar:", splits);

   try {
        const { data: mainTxData, error: mainTxError } = await supabase.from('transacciones').insert([transaccionParaInsertar]).select().single();
        if (mainTxError) throw mainTxError;
        console.log("Tx principal insertada:", mainTxData);

        if (tieneSplits && mainTxData) {
            const splitsParaInsertar = splits.map(split => ({ transaction_id: mainTxData.id, user_id: userId, categoria_id: parseInt(split.categoria_id, 10), monto: parseFloat(split.monto), notas: split.notas || null }));
            console.log("Insertando splits:", splitsParaInsertar);
            const { error: splitError } = await supabase.from('transaction_splits').insert(splitsParaInsertar);
            if (splitError) { throw new Error(`Tx creada (ID: ${mainTxData.id}), pero error en splits: ${splitError.message}`); }
            console.log("Splits insertados.");
            mainTxData.splits = splitsParaInsertar.map((s, i) => ({...s, id: `temp_${i}`}));
            return { data: mainTxData, error: null };
        } else {
             return { data: mainTxData, error: null };
        }
   } catch (error) { console.error("API Error (Transacciones Add Catch):", error.message); return { data: null, error }; }
};

export const editarTransaccion = async (id, datosActualizados) => { /* ... (código igual que la última versión correcta) ... */ const { ...datosBase } = datosActualizados; if (Object.prototype.hasOwnProperty.call(datosBase, 'tags')) { datosBase.tags = Array.isArray(datosBase.tags) ? datosBase.tags.filter(t=>t.trim()!=='') : []; } if (datosBase.tipo && datosBase.tipo !== 'Transferencia') { datosBase.cartera_origen_id = null; datosBase.cartera_destino_id = null; } else if (datosBase.tipo && datosBase.tipo === 'Transferencia') { datosBase.categoria_id = null; datosBase.cartera_id = null; } const { data, error } = await supabase.from('transacciones').update(datosBase).eq('id', id).select().single(); if (error) { console.error("API Edit:", error.message); } return { data, error }; };
export const eliminarTransaccion = async (id) => { /* ... (código igual que la última versión correcta) ... */ const { error } = await supabase.from('transacciones').delete().eq('id', id); if (error) { console.error("API Delete:", error.message); } return { data: null, error }; };
export const obtenerUltimasTransacciones = async (limite = 5) => { /* ... (código igual que la última versión correcta, con select limpio) ... */ const { data, error } = await supabase.from('transacciones').select(`*,tags,categoria:categorias(id,nombre),cartera:cartera_id(id,nombre),cartera_origen:cartera_origen_id(id,nombre),cartera_destino:cartera_destino_id(id,nombre),splits:transaction_splits(id,categoria_id,monto,notas,categoria:categorias(id,nombre))`).order('fecha', { ascending: false }).order('fecha_creacion', { ascending: false }).limit(limite); if (error) { console.error("API Ultimas Tx:", error.message); } return { data, error }; };
