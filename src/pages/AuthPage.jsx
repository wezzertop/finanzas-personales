// Archivo: src/pages/AuthPage.jsx
import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabaseClient'; // Importa tu cliente supabase

// Icono de la aplicación (opcional, puedes crear uno más elaborado)
const AppLogoIcon = () => (
  <svg className="w-16 h-16 mx-auto text-brand-accent-primary mb-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


function AuthPage() {
  // Colores basados en la paleta de tailwind.config.js y index.css
  // brand-accent-primary (sky-500: #0EA5E9) o un indigo (indigo-600: #4F46E5)
  const accentColor = '#0EA5E9'; // Sky-500 (nuestro brand-accent-primary)
  const accentColorDark = '#0284C7'; // Sky-600 (para hover/active)

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Título de la App */}
        <div className="text-center mb-8">
          <AppLogoIcon />
          <h1 className="text-3xl font-bold text-slate-100">Finanzas Personales</h1>
          <p className="text-slate-400 mt-1">Gestiona tus finanzas de forma inteligente.</p>
        </div>

        {/* Contenedor del Formulario de Autenticación */}
        <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700">
          {/* <h2 className="text-xl font-semibold text-center text-slate-200 mb-6">
            Iniciar Sesión / Registrarse
          </h2> */}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: accentColor,
                    brandAccent: accentColorDark,
                    brandButtonText: 'white', // Texto para botones con fondo 'brand'

                    defaultButtonBackground: '#334155',          // slate-700
                    defaultButtonBackgroundHover: '#475569',     // slate-600
                    defaultButtonBorder: 'transparent',          // Sin borde para botones por defecto
                    defaultButtonText: '#E2E8F0',                // slate-200

                    dividerBackground: '#334155',                // slate-700

                    inputBackground: '#1E293B',                  // slate-800 (un poco más oscuro que el fondo de la tarjeta)
                    inputBorder: '#334155',                      // slate-700
                    inputBorderHover: '#475569',                 // slate-600
                    inputBorderFocus: accentColor,               // Color de acento para el foco
                    inputText: '#E2E8F0',                        // slate-200
                    inputLabelText: '#94A3B8',                   // slate-400
                    inputPlaceholder: '#64748B',                 // slate-500

                    messageText: '#CBD5E1',                      // slate-300
                    messageTextDanger: '#F43F5E',                // rose-500 (nuestro brand-accent-danger)
                    
                    anchorTextColor: accentColor,                // Color de acento para enlaces
                    anchorTextHoverColor: accentColorDark,
                  },
                  space: {
                    spaceSmall: '6px',  // Ajustar espaciado si es necesario
                    spaceMedium: '12px',
                    spaceLarge: '20px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '8px',
                    buttonPadding: '10px 18px',
                    inputPadding: '10px 14px'
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  fonts: {
                    bodyFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    buttonFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    inputFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    labelFontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  },
                  radii: { // Bordes redondeados
                    borderRadiusButton: '0.5rem', // rounded-lg
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                  // borders: { // Si quieres bordes más explícitos
                  //   buttonBorder: `1px solid ${accentColorDark}`,
                  //   inputBorder: `1px solid #334155`, // slate-700
                  // }
                },
              },
            }}
            providers={['google', 'github']} // Opcional: Habilita login con Google, GitHub, etc.
            localization={{
              variables: {
                sign_in: { email_label: 'Correo Electrónico', password_label: 'Contraseña', button_label: "Iniciar Sesión", social_provider_text: "Continuar con {{provider}}", link_text: "¿Ya tienes cuenta? Inicia Sesión" },
                sign_up: { email_label: 'Correo Electrónico', password_label: 'Contraseña', button_label: "Registrarse", social_provider_text: "Continuar con {{provider}}", link_text: "¿No tienes cuenta? Regístrate" },
                forgotten_password: { email_label: 'Correo Electrónico', password_label: 'Contraseña', button_label: "Enviar instrucciones", link_text: "¿Olvidaste tu contraseña?" },
                update_password: { password_label: 'Nueva contraseña', button_label: 'Actualizar contraseña' }
              }
            }}
            theme="dark" // Mantenemos el tema base oscuro de Supabase Auth UI
            // showLinks={false} // Opcional: para ocultar "Olvidaste tu contraseña?" si no lo quieres
          />
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Finanzas Personales. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
