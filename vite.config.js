import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // registerType: 'autoUpdate', // Descomenta si quieres auto-actualización
      // devOptions: { enabled: true }, // Descomenta para probar PWA en desarrollo
      manifest: {
        name: 'Finanzas Personales',
        short_name: 'Finanzas',
        description: 'Aplicación para gestionar tus finanzas personales.',
        theme_color: '#111827', // Color oscuro principal
        background_color: '#1F2937', // Color de fondo secundario
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            // Asegúrate que la ruta inicia con '/' y el archivo existe en public/icons/
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // 'maskable' es importante
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
          // Puedes añadir más íconos aquí si los tienes
        ]
      },
      // Configuración de Workbox (Service Worker) - Opcional avanzado
      // workbox: {
      //   globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      // }
    })
  ],
})
