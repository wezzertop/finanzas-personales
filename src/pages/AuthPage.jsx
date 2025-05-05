import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabaseClient'; // Importa tu cliente supabase

function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          Iniciar Sesión / Registrarse
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#10B981', // Verde esmeralda (puedes cambiarlo)
                  brandAccent: '#059669',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#374151', // Gris oscuro para botones
                  defaultButtonBackgroundHover: '#4B5563',
                  defaultButtonBorder: '#4B5563',
                  defaultButtonText: 'white',
                  dividerBackground: '#4B5563',
                  inputBackground: '#374151', // Fondo input gris oscuro
                  inputBorder: '#4B5563',
                  inputBorderHover: '#6B7280',
                  inputBorderFocus: '#10B981', // Borde input focus verde
                  inputText: 'white', // Texto input blanco
                  inputLabelText: '#D1D5DB', // Gris claro para labels
                  inputPlaceholder: '#6B7280', // Gris medio para placeholder
                  messageText: '#D1D5DB',
                  messageTextDanger: '#F87171', // Rojo claro para errores
                  anchorTextColor: '#6EE7B7', // Verde claro para enlaces
                  anchorTextHoverColor: '#34D399',
                },
                space: {
                  spaceSmall: '4px',
                  spaceMedium: '8px',
                  spaceLarge: '16px',
                },
                fontSizes: {
                  baseBodySize: '14px', // Tamaño base texto
                  baseInputSize: '14px',
                  baseLabelSize: '14px',
                  baseButtonSize: '14px',
                },
                fonts: {
                  bodyFontFamily: `Inter, sans-serif`, // Usa la fuente que prefieras
                  buttonFontFamily: `Inter, sans-serif`,
                  inputFontFamily: `Inter, sans-serif`,
                  labelFontFamily: `Inter, sans-serif`,
                },
                // ... otras variables si necesitas
              },
            },
          }}
          providers={['google', 'github']} // Opcional: Habilita login con Google, GitHub, etc. (requiere config en Supabase)
          localization={{
              variables: {
                  sign_in: { email_label: 'Correo Electrónico', password_label: 'Contraseña', button_label: "Iniciar Sesión", social_provider_text: "Continuar con {{provider}}", link_text: "¿Ya tienes cuenta? Inicia Sesión" },
                  sign_up: { email_label: 'Correo Electrónico', password_label: 'Contraseña', button_label: "Registrarse", social_provider_text: "Continuar con {{provider}}", link_text: "¿No tienes cuenta? Regístrate" },
                  forgotten_password: { email_label: 'Correo Electrónico', password_label: 'Contraseña', button_label: "Enviar instrucciones", link_text: "¿Olvidaste tu contraseña?" },
                  update_password: { password_label: 'Nueva contraseña', button_label: 'Actualizar contraseña' }
              }
          }}
          theme="dark" // Usa el tema oscuro predefinido
        />
      </div>
    </div>
  );
}

export default AuthPage;
