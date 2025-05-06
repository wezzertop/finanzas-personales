import { supabase } from './supabaseClient';

/**
 * Llama a la función RPC para obtener los egresos agrupados por categoría del mes actual.
 * @returns {Promise<{data: Array<{nombre_categoria: string, total_egresos: number}>|null, error: Object|null}>}
 */
export const obtenerDatosGraficoEgresos = async () => {
  console.log("[graficosApi] Llamando a RPC 'obtener_egresos_categoria_mes'...");
  const { data, error } = await supabase
    .rpc('obtener_egresos_categoria_mes'); // Llama a la función

  if (error) {
    console.error("API Error (Graficos RPC):", error.message);
  } else {
    console.log("[graficosApi] Datos para gráfico recibidos:", data);
  }
  // La RPC ya devuelve un array de objetos {nombre_categoria, total_egresos}
  return { data, error };
};
