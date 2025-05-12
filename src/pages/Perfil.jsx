// Archivo: src/pages/Perfil.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- Iconos SVG Inline ---
const UserCircleIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
// --- Fin Iconos SVG Inline ---

function Perfil({ session }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Clases de Tailwind reutilizables
  const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const baseButtonClasses = (color = 'indigo', size = 'md') =>
    `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed
    ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''}
    `;

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });
    if (!newPassword || !confirmPassword) { setMessage({ type: 'error', text: 'Por favor, ingresa y confirma la nueva contraseña.' }); return; }
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' }); return; }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' }); return; }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
      setNewPassword(''); setConfirmPassword('');
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      setMessage({ type: 'error', text: `Error al actualizar: ${error.message || 'Intenta de nuevo.'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="page-title"> <UserCircleIcon /> Mi Perfil </h1>

      <section className="card-base">
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Información de Cuenta</h2>
        <p className="text-sm text-slate-400 mb-6">Tu información básica de usuario.</p>
        <div className="space-y-3">
          <div>
            <p className={baseLabelClasses}>Correo Electrónico:</p>
            <p className="text-slate-300 bg-slate-700/50 px-3.5 py-2.5 rounded-lg text-sm">{session?.user?.email || 'No disponible'}</p>
          </div>
          {/* Aquí podrían ir otros datos del perfil en el futuro */}
        </div>
      </section>

      <section className="card-base">
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Cambiar Contraseña</h2>
        <p className="text-sm text-slate-400 mb-6">Actualiza tu contraseña de acceso.</p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className={baseLabelClasses}>Nueva Contraseña</label>
            <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={baseInputClasses} placeholder="Nueva contraseña (mín. 6 caracteres)"/>
          </div>
          <div>
            <label htmlFor="confirmPassword" className={baseLabelClasses}>Confirmar Nueva Contraseña</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={baseInputClasses} placeholder="Repite la nueva contraseña"/>
          </div>
          {message.text && ( <p className={`text-sm p-3 rounded-md ${message.type === 'error' ? 'text-red-300 bg-red-500/20' : 'text-green-300 bg-green-500/20'}`}>{message.text}</p> )}
          <div className="pt-2">
            <button type="submit" className={`${baseButtonClasses('indigo')} w-full sm:w-auto`} disabled={isUpdating}>
              {isUpdating ? 'Actualizando...' : <><SaveIcon className="mr-2"/> Guardar Nueva Contraseña</>}
            </button>
          </div>
        </form>
      </section>

      {/* <section className="card-base border-red-600/50">
           <h2 className="text-xl font-semibold mb-1 text-red-400">Zona de Peligro</h2>
           <p className="text-sm text-slate-400 mb-6">Eliminar tu cuenta es una acción permanente e irreversible.</p>
           <button className={`${baseButtonClasses('red')} disabled:bg-red-700/50`} disabled>
               <Trash2Icon className="mr-2"/> Eliminar Mi Cuenta
           </button>
       </section>
       */}
    </div>
  );
}

export default Perfil;
