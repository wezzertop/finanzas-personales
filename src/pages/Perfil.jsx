import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Importar cliente Supabase

function Perfil({ session }) { // Recibe la sesión para obtener el email
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // { type: 'success' | 'error', text: '...' }

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' }); // Limpiar mensajes previos

    // Validación básica
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Por favor, ingresa y confirma la nueva contraseña.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    if (newPassword.length < 6) {
        // Supabase requiere mínimo 6 caracteres por defecto
        setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
    }

    setIsUpdating(true);
    try {
      // Usar la función de Supabase para actualizar la contraseña del usuario logueado
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error; // Lanza el error para el catch
      }

      setMessage({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
      setNewPassword(''); // Limpiar campos
      setConfirmPassword('');

    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      setMessage({ type: 'error', text: `Error al actualizar: ${error.message || 'Intenta de nuevo.'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Clases CSS ---
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
  const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

  return (
    <div className="space-y-8 max-w-2xl mx-auto"> {/* Limitar ancho y centrar */}
      <div className="flex items-center text-white">
        <span className="mr-3 text-2xl" aria-hidden="true">👤</span>
        <h1 className="text-2xl font-semibold">Mi Perfil</h1>
      </div>

      {/* Sección Información Básica */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">Información de Cuenta</h2>
        <div className="mb-4">
          <p className={labelClasses}>Correo Electrónico:</p>
          {/* Muestra el email de la sesión (no editable) */}
          <p className="text-gray-400 bg-gray-800 px-3 py-2 rounded-md text-sm">{session?.user?.email || 'No disponible'}</p>
        </div>
        {/* Aquí podrían ir otros datos del perfil en el futuro */}
      </section>

      {/* Sección Cambio de Contraseña */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">Cambiar Contraseña</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className={labelClasses}>Nueva Contraseña</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className={inputClasses}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClasses}>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={inputClasses}
              placeholder="Repite la nueva contraseña"
            />
          </div>
          {/* Mensajes de éxito o error */}
          {message.text && (
              <p className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                  {message.text}
              </p>
          )}
          <div className="pt-2">
            <button
              type="submit"
              className={`${buttonClasses('indigo')} w-full sm:w-auto`}
              disabled={isUpdating}
            >
              {isUpdating ? 'Actualizando...' : '💾 Guardar Nueva Contraseña'}
            </button>
          </div>
        </form>
      </section>

       {/* Sección Eliminar Cuenta (Placeholder Futuro) */}
       {/*
       <section className="bg-gray-900 p-6 rounded-lg shadow-lg border border-red-700">
           <h2 className="text-xl font-semibold mb-4 text-red-400">Zona de Peligro</h2>
           <p className="text-sm text-gray-400 mb-4">Eliminar tu cuenta es una acción permanente e irreversible. Todos tus datos (transacciones, carteras, categorías, etc.) serán borrados.</p>
           <button className={`${buttonClasses('red')} disabled:bg-red-800`} disabled>
               🗑️ Eliminar Mi Cuenta Permanentemente
           </button>
       </section>
       */}

    </div>
  );
}

export default Perfil;
