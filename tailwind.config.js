/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Busca clases en el HTML principal
    "./src/**/*.{js,ts,jsx,tsx}", // Busca clases en todos los archivos JS/JSX dentro de src/
  ],
  theme: {
    extend: {}, // Aquí puedes personalizar colores, fuentes, etc. (lo veremos después si es necesario)
  },
  plugins: [], // Aquí puedes añadir plugins de Tailwind
}