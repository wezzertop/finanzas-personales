/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Busca clases en el HTML principal
    "./src/**/*.{js,ts,jsx,tsx}", // Busca clases en todos los archivos JS/JSX/TSX dentro de src/
  ],
  theme: {
    extend: {
      // Aquí es donde extendemos el tema por defecto de Tailwind
      colors: {
        // Paleta de colores personalizada para un tema oscuro y profesional
        // Puedes nombrar estos colores como quieras.
        // Ejemplo: 'primary', 'secondary', 'accent', 'neutral', etc.

        // Tonos de fondo principal y para tarjetas/elementos
        'brand-dark-primary': '#0F172A',    // Un azul muy oscuro, casi negro (slate-900 es similar)
        'brand-dark-secondary': '#1E293B', // Un azul oscuro grisáceo (slate-800 es similar)
        'brand-dark-tertiary': '#334155',  // Un gris azulado más claro (slate-700 es similar)

        // Colores de acento
        'brand-accent-primary': '#38BDF8', // Un azul cielo vibrante (sky-500)
        'brand-accent-secondary': '#A3E635',// Un verde lima brillante (lime-500)
        'brand-accent-danger': '#F43F5E',  // Un rosa/rojo para errores o alertas (rose-500)
        'brand-accent-success': '#22C55E', // Un verde para éxito (green-500)
        'brand-accent-warning': '#F59E0B', // Un ámbar para advertencias (amber-500)

        // Colores para texto
        'brand-text-primary': '#E2E8F0',    // Un gris muy claro, casi blanco (slate-200)
        'brand-text-secondary': '#94A3B8',  // Un gris más suave (slate-400)
        'brand-text-placeholder': '#64748B',// Un gris para placeholders (slate-500)
      },
      fontFamily: {
        // Aseguramos que 'Inter' sea la fuente principal.
        // Tailwind ya incluye 'sans' como una pila de fuentes sans-serif por defecto,
        // pero si quieres ser explícito o añadir fallbacks:
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      // Aquí podrías extender otros aspectos como espaciado, breakpoints, etc.
      // borderRadius: {
      //   'xl': '0.75rem', // Ejemplo si quisieras un borde más redondeado por defecto para 'xl'
      //   '2xl': '1rem',
      //   '3xl': '1.5rem',
      //   '4xl': '2rem', // Para tarjetas muy redondeadas
      // },
      // boxShadow: {
      //   'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      //   'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      // }
    },
  },
  plugins: [
    // Aquí puedes añadir plugins de Tailwind si los necesitas en el futuro.
    // Por ejemplo, para mejorar los estilos de los formularios:
    // require('@tailwindcss/forms'),
    // O para tipografía avanzada si tuvieras mucho contenido de texto largo:
    // require('@tailwindcss/typography'),
  ],
}
