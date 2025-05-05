import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Importa el plugin PWA
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Configuración del plugin PWA
    VitePWA({
      // registerType: 'autoUpdate', // Opcional: Actualiza el SW automáticamente
      // devOptions: { // Opcional: Habilita PWA en desarrollo (útil para probar)
      //   enabled: true
      // },
      manifest: {
        // --- Información básica de la App ---
        name: 'Finanzas Personales', // Nombre completo de la app
        short_name: 'Finanzas', // Nombre corto (para ícono en pantalla inicio)
        description: 'Aplicación para gestionar tus finanzas personales.', // Descripción
        theme_color: '#111827', // Color de la barra de título (bg-gray-900)
        background_color: '#1F2937', // Color de fondo al cargar (bg-gray-800)
        display: 'standalone', // Abre como app independiente, no en navegador
        scope: '/', // Alcance de la PWA
        start_url: '/', // Página que se abre al iniciar
        orientation: 'portrait', // Orientación preferida

        // --- Íconos de la App ---
        // ¡IMPORTANTE! Debes crear estos íconos y ponerlos en la carpeta 'public/'
        // Puedes usar generadores online como https://www.pwabuilder.com/imageGenerator
        icons: [
          {
            src: '/icons/icon-192x192.png', // Ruta relativa a la carpeta 'public'
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // 'maskable' ayuda a que se vea bien en diferentes formas de ícono
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          // Puedes añadir más tamaños si quieres (ej: 72x72, 96x96, 128x128, 144x144, 152x152, 256x256)
        ]
      },
      // --- Configuración del Service Worker (Opcional - Estrategia por defecto suele ser buena) ---
      // workbox: {
      //   globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'], // Archivos a cachear
      //   runtimeCaching: [ // Cachear llamadas a API (ej: Supabase) - ¡Requiere cuidado!
      //     {
      //       urlPattern: ({ url }) => url.origin === 'TU_URL_SUPABASE', // Cambia esto
      //       handler: 'NetworkFirst', // Intenta red, si falla, usa caché
      //       options: {
      //         cacheName: 'api-cache',
      //         expiration: {
      //           maxEntries: 10,
      //           maxAgeSeconds: 60 * 60 * 24 // 1 día
      //         },
      //         cacheableResponse: {
      //           statuses: [0, 200] // Cachear respuestas OK
      //         }
      //       }
      //     }
      //   ]
      // }
    })
  ],
})
