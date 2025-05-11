// Archivo: src/pages/Configuracion.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  obtenerConfiguracionAlertasUsuario,
  actualizarConfiguracionAlertasUsuario
} from '../lib/notificacionesApi'; // API de notificaciones

function Configuracion({ session }) {
  const { currency, updatePreferredCurrency, loadingSettings: loadingCurrencySettings, supportedCurrencies } = useSettings();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [saveCurrencyMessage, setSaveCurrencyMessage] = useState('');

  // Estados para la configuración de alertas
  const [alertSettings, setAlertSettings] = useState(null);
  const [loadingAlertSettings, setLoadingAlertSettings] = useState(true);
  const [isSavingAlerts, setIsSavingAlerts] = useState(false);
  const [saveAlertsMessage, setSaveAlertsMessage] = useState('');
  const [loadAlertSettingsError, setLoadAlertSettingsError] = useState(''); // Estado para error de carga

  // Cargar configuración de moneda
  useEffect(() => {
    if (!loadingCurrencySettings) {
      setSelectedCurrency(currency);
    }
  }, [currency, loadingCurrencySettings]);

  // Cargar configuración de alertas del usuario
  const cargarConfigAlertas = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingAlertSettings(true);
    setSaveAlertsMessage('');
    setLoadAlertSettingsError(''); // Limpiar error de carga anterior
    try {
      const { data, error: fetchError } = await obtenerConfiguracionAlertasUsuario(); // Renombrar error local
      if (fetchError) throw fetchError; // Lanzar para el catch
      if (data) {
        setAlertSettings(data);
      } else {
        console.warn("No se encontró configuración de alertas, usando valores por defecto para el formulario.");
        setAlertSettings({ // Valores por defecto para el formulario si no hay nada en la BD
          alerta_presupuesto_activa: true,
          alerta_presupuesto_umbral_porcentaje: 80,
          notificar_presupuesto_excedido: true,
          alerta_recurrente_activa: true,
          alerta_recurrente_dias_anticipacion: 2,
          alerta_objetivo_logrado_activa: true,
          alerta_objetivo_recordatorio_activa: false,
          alerta_vencimiento_deuda_activa: true,
          alerta_vencimiento_deuda_dias_anticipacion: 3,
          alerta_saldo_bajo_cartera_activa: false,
          alerta_saldo_bajo_cartera_umbral: 0,
        });
      }
    } catch (errorCaught) { // Usar un nombre diferente para la variable del catch
      console.error("Error cargando configuración de alertas:", errorCaught);
      setLoadAlertSettingsError(`Error cargando config. alertas: ${errorCaught.message}`); // Usar nuevo estado
    } finally {
      setLoadingAlertSettings(false);
    }
  }, [session]);

  useEffect(() => {
    cargarConfigAlertas();
  }, [cargarConfigAlertas]);


  const handleSaveCurrency = async () => {
    setIsSavingCurrency(true);
    setSaveCurrencyMessage('');
    try {
      await updatePreferredCurrency(selectedCurrency);
      setSaveCurrencyMessage('¡Moneda guardada con éxito!');
      setTimeout(() => setSaveCurrencyMessage(''), 3000);
    } catch (error) {
      setSaveCurrencyMessage(`Error al guardar moneda: ${error.message}`);
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const handleAlertSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAlertSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value)
    }));
  };

  const handleSaveAlertSettings = async () => {
    if (!alertSettings) return;
    setIsSavingAlerts(true);
    setSaveAlertsMessage('');
    setLoadAlertSettingsError('');
    try {
      const { user_id, id, fecha_creacion, fecha_actualizacion, ...settingsToUpdate } = alertSettings;
      await actualizarConfiguracionAlertasUsuario(settingsToUpdate);
      setSaveAlertsMessage('¡Configuración de alertas guardada!');
      setTimeout(() => setSaveAlertsMessage(''), 3000);
      cargarConfigAlertas(); 
    } catch (error) {
      console.error("Error guardando configuración de alertas:", error);
      setSaveAlertsMessage(`Error al guardar alertas: ${error.message}`);
    } finally {
      setIsSavingAlerts(false);
    }
  };

  const labelClasses = "block text-sm font-medium text-gray-300";
  const inputClasses = `mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
  const selectClasses = `${inputClasses} bg-gray-700`;
  const checkboxClasses = "h-4 w-4 text-indigo-600 border-gray-500 rounded focus:ring-indigo-500 bg-gray-700";
  const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;
  const sectionCardClasses = "bg-gray-900 p-6 rounded-lg shadow-lg";
  const sectionTitleClasses = "text-xl font-semibold text-white mb-1";
  const sectionSubtitleClasses = "text-sm text-gray-400 mb-6";

  return (
    <div className="space-y-8">
      <div className="flex items-center text-white">
        <span className="mr-3 text-2xl" aria-hidden="true">⚙️</span>
        <h1 className="text-2xl font-semibold">Configuración General</h1>
      </div>

      <section className={sectionCardClasses}>
        <h2 className={sectionTitleClasses}>Preferencias de Moneda</h2>
        <p className={sectionSubtitleClasses}>Define la moneda principal para la visualización de montos en la aplicación.</p>
        {loadingCurrencySettings ? (
          <p className="text-blue-400">Cargando configuración de moneda...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div><label htmlFor="currencySelect" className={labelClasses}>Moneda Principal</label></div>
              <div className="flex items-center gap-3">
                <select id="currencySelect" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className={selectClasses + " sm:w-auto min-w-[100px]"} aria-label="Seleccionar moneda principal">
                  {supportedCurrencies.map(curr => (<option key={curr} value={curr}>{curr}</option>))}
                </select>
                <button onClick={handleSaveCurrency} disabled={isSavingCurrency || selectedCurrency === currency} className={buttonClasses()}>
                  {isSavingCurrency ? 'Guardando...' : 'Guardar Moneda'}
                </button>
              </div>
            </div>
            {saveCurrencyMessage && <p className={`text-sm mt-2 ${saveCurrencyMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveCurrencyMessage}</p>}
          </div>
        )}
      </section>

      <section className={sectionCardClasses}>
        <h2 className={sectionTitleClasses}>Notificaciones y Alertas</h2>
        <p className={sectionSubtitleClasses}>Personaliza las alertas que deseas recibir para mantenerte informado.</p>

        {loadingAlertSettings && !alertSettings && <p className="text-blue-400">Cargando configuración de alertas...</p>}
        {/* CORRECCIÓN: Usar loadAlertSettingsError para mostrar error de carga */}
        {loadAlertSettingsError && !loadingAlertSettings && <p className="text-red-400">Error al cargar configuración: {loadAlertSettingsError}</p>}

        {/* CORRECCIÓN: Añadir !loadAlertSettingsError para no mostrar el form si hay error de carga */}
        {alertSettings && !loadingAlertSettings && !loadAlertSettingsError && (
          <div className="space-y-6">
            <fieldset className="border border-gray-700 p-4 rounded-md">
              <legend className="text-md font-semibold text-indigo-400 px-2">Alertas de Presupuestos</legend>
              <div className="space-y-4 mt-2">
                <div className="flex items-start">
                  <div className="flex items-center h-5"><input id="alerta_presupuesto_activa" name="alerta_presupuesto_activa" type="checkbox" checked={alertSettings.alerta_presupuesto_activa} onChange={handleAlertSettingsChange} className={checkboxClasses} /></div>
                  <div className="ml-3 text-sm"><label htmlFor="alerta_presupuesto_activa" className={labelClasses}>Activar alertas de presupuesto</label></div>
                </div>
                {alertSettings.alerta_presupuesto_activa && (
                  <>
                    <div>
                      <label htmlFor="alerta_presupuesto_umbral_porcentaje" className={labelClasses}>Notificar al alcanzar (% del presupuesto)</label>
                      <input type="number" name="alerta_presupuesto_umbral_porcentaje" id="alerta_presupuesto_umbral_porcentaje" value={alertSettings.alerta_presupuesto_umbral_porcentaje} onChange={handleAlertSettingsChange} min="1" max="100" className={inputClasses + " w-24"} />
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5"><input id="notificar_presupuesto_excedido" name="notificar_presupuesto_excedido" type="checkbox" checked={alertSettings.notificar_presupuesto_excedido} onChange={handleAlertSettingsChange} className={checkboxClasses} /></div>
                      <div className="ml-3 text-sm"><label htmlFor="notificar_presupuesto_excedido" className={labelClasses}>Notificar al exceder presupuesto</label></div>
                    </div>
                  </>
                )}
              </div>
            </fieldset>

            <fieldset className="border border-gray-700 p-4 rounded-md">
              <legend className="text-md font-semibold text-indigo-400 px-2">Alertas de Recurrentes</legend>
              <div className="space-y-4 mt-2">
                <div className="flex items-start">
                    <div className="flex items-center h-5"><input id="alerta_recurrente_activa" name="alerta_recurrente_activa" type="checkbox" checked={alertSettings.alerta_recurrente_activa} onChange={handleAlertSettingsChange} className={checkboxClasses} /></div>
                    <div className="ml-3 text-sm"><label htmlFor="alerta_recurrente_activa" className={labelClasses}>Activar recordatorios de transacciones recurrentes</label></div>
                </div>
                {alertSettings.alerta_recurrente_activa && (
                    <div>
                        <label htmlFor="alerta_recurrente_dias_anticipacion" className={labelClasses}>Días de anticipación para recordatorio</label>
                        <input type="number" name="alerta_recurrente_dias_anticipacion" id="alerta_recurrente_dias_anticipacion" value={alertSettings.alerta_recurrente_dias_anticipacion} onChange={handleAlertSettingsChange} min="0" max="30" className={inputClasses + " w-24"} />
                    </div>
                )}
              </div>
            </fieldset>
            
            <div className="pt-4">
              <button onClick={handleSaveAlertSettings} disabled={isSavingAlerts} className={buttonClasses('green')}>
                {isSavingAlerts ? 'Guardando Alertas...' : 'Guardar Configuración de Alertas'}
              </button>
              {saveAlertsMessage && <p className={`text-sm mt-2 ${saveAlertsMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveAlertsMessage}</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Configuracion;
