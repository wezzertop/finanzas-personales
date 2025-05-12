// Archivo: src/pages/Configuracion.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  obtenerConfiguracionAlertasUsuario,
  actualizarConfiguracionAlertasUsuario
} from '../lib/notificacionesApi';

// --- Iconos SVG Inline ---
const SettingsIconPageTitle = ({ className = "page-title-icon" }) => ( // Icono para el título de la página
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
// --- Fin Iconos SVG Inline ---

function Configuracion({ session }) {
  const { currency, updatePreferredCurrency, loadingSettings: loadingCurrencySettings, supportedCurrencies } = useSettings();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [saveCurrencyMessage, setSaveCurrencyMessage] = useState('');

  const initialAlertSettings = {
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
  };
  const [alertSettings, setAlertSettings] = useState(initialAlertSettings);
  const [loadingAlertSettings, setLoadingAlertSettings] = useState(true);
  const [isSavingAlerts, setIsSavingAlerts] = useState(false);
  const [saveAlertsMessage, setSaveAlertsMessage] = useState('');
  const [loadAlertSettingsError, setLoadAlertSettingsError] = useState('');

  // Clases de Tailwind reutilizables
  const baseLabelClasses = "block text-sm font-medium text-slate-300"; // mb-1.5 se aplicará en el div contenedor
  const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
  const baseCheckboxClasses = "h-4 w-4 text-brand-accent-primary bg-slate-600 border-slate-500 rounded focus:ring-2 focus:ring-offset-slate-800 focus:ring-brand-accent-primary";
  const baseButtonClasses = (color = 'indigo', size = 'md') =>
    `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed
    ${color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}
    ${color === 'indigo' ? 'bg-brand-accent-primary hover:opacity-90 focus:ring-brand-accent-primary' : ''}
    `;
  const fieldsetClasses = "border border-slate-700 p-4 rounded-lg";
  const legendClasses = "text-md font-semibold text-brand-accent-primary px-1";


  useEffect(() => {
    if (!loadingCurrencySettings) {
      setSelectedCurrency(currency);
    }
  }, [currency, loadingCurrencySettings]);

  const cargarConfigAlertas = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingAlertSettings(true); setSaveAlertsMessage(''); setLoadAlertSettingsError('');
    try {
      const { data, error: fetchError } = await obtenerConfiguracionAlertasUsuario();
      if (fetchError) throw fetchError;
      setAlertSettings(data || initialAlertSettings); // Usar defaults si data es null
    } catch (errorCaught) {
      console.error("Error cargando config. alertas:", errorCaught);
      setLoadAlertSettingsError(`Error al cargar: ${errorCaught.message}`);
      setAlertSettings(initialAlertSettings); // Usar defaults en caso de error de carga
    } finally {
      setLoadingAlertSettings(false);
    }
  }, [session]); // initialAlertSettings no necesita ser dependencia si es constante

  useEffect(() => { cargarConfigAlertas(); }, [cargarConfigAlertas]);

  const handleSaveCurrency = async () => {
    setIsSavingCurrency(true); setSaveCurrencyMessage('');
    try {
      await updatePreferredCurrency(selectedCurrency);
      setSaveCurrencyMessage('¡Moneda guardada!');
      setTimeout(() => setSaveCurrencyMessage(''), 3000);
    } catch (error) { setSaveCurrencyMessage(`Error: ${error.message}`); }
    finally { setIsSavingCurrency(false); }
  };

  const handleAlertSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAlertSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value) }));
  };

  const handleSaveAlertSettings = async () => {
    if (!alertSettings) return;
    setIsSavingAlerts(true); setSaveAlertsMessage(''); setLoadAlertSettingsError('');
    try {
      const { user_id, id, fecha_creacion, fecha_actualizacion, ...settingsToUpdate } = alertSettings;
      await actualizarConfiguracionAlertasUsuario(settingsToUpdate);
      setSaveAlertsMessage('¡Alertas guardadas!');
      setTimeout(() => setSaveAlertsMessage(''), 3000);
      // No es necesario recargar aquí ya que el estado local 'alertSettings' ya está actualizado por handleAlertSettingsChange
    } catch (error) { console.error("Error guardando alertas:", error); setSaveAlertsMessage(`Error: ${error.message}`); }
    finally { setIsSavingAlerts(false); }
  };

  return (
    <div className="space-y-8">
      <h1 className="page-title"> <SettingsIconPageTitle /> Configuración General </h1>

      <section className="card-base">
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Preferencias de Moneda</h2>
        <p className="text-sm text-slate-400 mb-6">Define la moneda principal para la visualización de montos.</p>
        {loadingCurrencySettings ? ( <p className="text-slate-400">Cargando...</p> ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <label htmlFor="currencySelect" className={baseLabelClasses}>Moneda Principal</label>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select id="currencySelect" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className={`${baseSelectClasses} flex-grow sm:flex-grow-0 sm:w-auto min-w-[120px]`} aria-label="Seleccionar moneda principal">
                  {supportedCurrencies.map(curr => (<option key={curr} value={curr}>{curr}</option>))}
                </select>
                <button onClick={handleSaveCurrency} disabled={isSavingCurrency || selectedCurrency === currency} className={baseButtonClasses('indigo', 'md')}>
                  {isSavingCurrency ? 'Guardando...' : <><SaveIcon className="mr-2"/> Guardar</>}
                </button>
              </div>
            </div>
            {saveCurrencyMessage && <p className={`text-sm mt-2 ${saveCurrencyMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveCurrencyMessage}</p>}
          </div>
        )}
      </section>

      <section className="card-base">
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Notificaciones y Alertas</h2>
        <p className="text-sm text-slate-400 mb-6">Personaliza las alertas que deseas recibir.</p>
        {loadingAlertSettings && <p className="text-slate-400">Cargando configuración de alertas...</p>}
        {loadAlertSettingsError && !loadingAlertSettings && <p className="text-red-400 bg-red-900/20 p-3 rounded-md">{loadAlertSettingsError}</p>}
        {!loadingAlertSettings && !loadAlertSettingsError && alertSettings && (
          <div className="space-y-6">
            {/* Alertas de Presupuestos */}
            <fieldset className={fieldsetClasses}>
              <legend className={legendClasses}>Alertas de Presupuestos</legend>
              <div className="space-y-4 mt-3">
                <div className="flex items-start"><div className="flex items-center h-5"><input id="alerta_presupuesto_activa" name="alerta_presupuesto_activa" type="checkbox" checked={alertSettings.alerta_presupuesto_activa} onChange={handleAlertSettingsChange} className={baseCheckboxClasses} /></div><div className="ml-3 text-sm"><label htmlFor="alerta_presupuesto_activa" className={baseLabelClasses}>Activar alertas de presupuesto</label></div></div>
                {alertSettings.alerta_presupuesto_activa && (
                  <>
                    <div className="sm:ml-7"><label htmlFor="alerta_presupuesto_umbral_porcentaje" className={`${baseLabelClasses} mb-1`}>Notificar al alcanzar (% del presupuesto)</label><input type="number" name="alerta_presupuesto_umbral_porcentaje" id="alerta_presupuesto_umbral_porcentaje" value={alertSettings.alerta_presupuesto_umbral_porcentaje} onChange={handleAlertSettingsChange} min="1" max="100" className={`${baseInputClasses} w-28`} /></div>
                    <div className="flex items-start sm:ml-7"><div className="flex items-center h-5"><input id="notificar_presupuesto_excedido" name="notificar_presupuesto_excedido" type="checkbox" checked={alertSettings.notificar_presupuesto_excedido} onChange={handleAlertSettingsChange} className={baseCheckboxClasses} /></div><div className="ml-3 text-sm"><label htmlFor="notificar_presupuesto_excedido" className={baseLabelClasses}>Notificar al exceder presupuesto</label></div></div>
                  </>
                )}
              </div>
            </fieldset>

            {/* Alertas de Recurrentes */}
            <fieldset className={fieldsetClasses}>
              <legend className={legendClasses}>Alertas de Recurrentes</legend>
              <div className="space-y-4 mt-3">
                <div className="flex items-start"><div className="flex items-center h-5"><input id="alerta_recurrente_activa" name="alerta_recurrente_activa" type="checkbox" checked={alertSettings.alerta_recurrente_activa} onChange={handleAlertSettingsChange} className={baseCheckboxClasses} /></div><div className="ml-3 text-sm"><label htmlFor="alerta_recurrente_activa" className={baseLabelClasses}>Activar recordatorios de transacciones recurrentes</label></div></div>
                {alertSettings.alerta_recurrente_activa && (
                  <div className="sm:ml-7"><label htmlFor="alerta_recurrente_dias_anticipacion" className={`${baseLabelClasses} mb-1`}>Días de anticipación para recordatorio</label><input type="number" name="alerta_recurrente_dias_anticipacion" id="alerta_recurrente_dias_anticipacion" value={alertSettings.alerta_recurrente_dias_anticipacion} onChange={handleAlertSettingsChange} min="0" max="30" className={`${baseInputClasses} w-28`} /></div>
                )}
              </div>
            </fieldset>
            
            {/* Aquí podrías añadir más fieldsets para otros tipos de alertas (objetivos, deudas, saldo bajo) siguiendo el mismo patrón */}

            <div className="pt-4">
              <button onClick={handleSaveAlertSettings} disabled={isSavingAlerts} className={baseButtonClasses('green')}>
                {isSavingAlerts ? 'Guardando...' : <><SaveIcon className="mr-2"/> Guardar Alertas</>}
              </button>
              {saveAlertsMessage && <p className={`text-sm mt-3 ${saveAlertsMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveAlertsMessage}</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Configuracion;
