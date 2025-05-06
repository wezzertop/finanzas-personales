import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext'; // Importa el hook del contexto

function Configuracion({ session }) { // Recibe sesión por si se necesita en futuro
  const { currency, updatePreferredCurrency, loadingSettings, supportedCurrencies } = useSettings();
  const [selectedCurrency, setSelectedCurrency] = useState(currency); // Estado local para el select
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Actualiza el estado local cuando cambia la moneda global (cargada del contexto)
  React.useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updatePreferredCurrency(selectedCurrency);
      setSaveMessage('¡Moneda guardada con éxito!');
      setTimeout(() => setSaveMessage(''), 3000); // Borra mensaje después de 3s
    } catch (error) {
      setSaveMessage(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Clases reutilizables
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const selectClasses = `block w-full sm:w-auto min-w-[100px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`;
  const buttonClasses = `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition duration-150 disabled:opacity-50`;


  return (
    <div className="space-y-8">
      <div className="flex items-center text-white">
        <span className="mr-3 text-2xl" aria-hidden="true">⚙️</span>
        <h1 className="text-2xl font-semibold">Configuración</h1>
      </div>

      <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Preferencias Generales</h2>

        {loadingSettings ? (
          <p className="text-blue-400">Cargando configuración...</p>
        ) : (
          <div className="space-y-4">
            {/* Configuración de Moneda */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-700 pb-4">
               <div>
                   <label htmlFor="currencySelect" className={labelClasses}>Moneda Principal</label>
                   <p className="text-xs text-gray-500">Selecciona la moneda para mostrar los valores.</p>
               </div>
               <div className="flex items-center gap-3">
                   <select
                     id="currencySelect"
                     value={selectedCurrency}
                     onChange={(e) => setSelectedCurrency(e.target.value)}
                     className={selectClasses}
                     aria-label="Seleccionar moneda principal"
                   >
                     {supportedCurrencies.map(curr => (
                       <option key={curr} value={curr}>{curr}</option>
                     ))}
                   </select>
                   <button
                     onClick={handleSave}
                     disabled={isSaving || selectedCurrency === currency} // Deshabilitado si está guardando o no hay cambios
                     className={buttonClasses}
                   >
                     {isSaving ? 'Guardando...' : 'Guardar'}
                   </button>
               </div>
            </div>
            {saveMessage && <p className={`text-sm ${saveMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveMessage}</p>}

            {/* Aquí puedes añadir más configuraciones en el futuro */}
            {/* Ejemplo:
            <div className="flex items-center justify-between gap-4 border-b border-gray-700 pb-4">
               <div>
                   <label htmlFor="themeSelect" className={labelClasses}>Tema</label>
                   <p className="text-xs text-gray-500">Elige el tema visual de la aplicación.</p>
               </div>
               <select id="themeSelect" className={selectClasses} disabled>
                   <option>Oscuro</option>
               </select>
            </div>
            */}

          </div>
        )}
      </section>
    </div>
  );
}

export default Configuracion;
