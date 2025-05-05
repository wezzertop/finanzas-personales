// Archivo: src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// Obtener las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas.");
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Explicación:
// 1. Importamos la función `createClient` de la librería.
// 2. Accedemos a nuestras variables de entorno usando `import.meta.env.NOMBRE_VARIABLE`.
//    Esta es la forma en que Vite nos da acceso a las variables que empiezan con VITE_.
// 3. Hacemos una pequeña validación para asegurarnos de que las variables sí existen.
// 4. Llamamos a `createClient` con la URL y la clave anónima.
// 5. Exportamos el cliente (`supabase`) para poder usarlo en otros archivos.