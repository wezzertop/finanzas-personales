import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// 1. Crear el Contexto
const SettingsContext = createContext();

// Lista de monedas soportadas (puedes expandir)
// Código ISO 4217
export const supportedCurrencies = ['MXN', 'USD', 'EUR', 'COP', 'ARS', 'PEN'];

// 2. Crear el Proveedor del Contexto
export const SettingsProvider = ({ children }) => {
  const [currency, setCurrency] = useState('MXN'); // Moneda por defecto
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Cargar configuración del usuario al inicio
  const loadUserSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.preferred_currency) {
        // Verifica si la moneda guardada es válida, si no, usa MXN
        const savedCurrency = user.user_metadata.preferred_currency;
        if (supportedCurrencies.includes(savedCurrency)) {
            setCurrency(savedCurrency);
            console.log("[SettingsContext] Moneda cargada:", savedCurrency);
        } else {
            console.warn("[SettingsContext] Moneda guardada no soportada:", savedCurrency, "Usando MXN.");
            setCurrency('MXN');
            // Opcional: Actualizar metadata con la moneda por defecto si era inválida
            // await updatePreferredCurrency('MXN');
        }
      } else {
         console.log("[SettingsContext] No hay moneda guardada, usando MXN por defecto.");
         setCurrency('MXN'); // Valor por defecto si no hay nada guardado
      }
    } catch (error) {
      console.error("[SettingsContext] Error cargando configuración:", error);
      setCurrency('MXN'); // Fallback a MXN en caso de error
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // Carga inicial al montar
  useEffect(() => {
    loadUserSettings();

    // Escuchar cambios de sesión para recargar si cambia el usuario
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => { // Removed _session
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            console.log("[SettingsContext] Sesión cambió, recargando configuración...");
            loadUserSettings();
        } else if (event === 'SIGNED_OUT') {
             console.log("[SettingsContext] Sesión cerrada, reseteando a MXN.");
            setCurrency('MXN'); // Resetear al cerrar sesión
            setLoadingSettings(false);
        }
    });

    return () => subscription?.unsubscribe();

  }, [loadUserSettings]);

  // Función para actualizar la moneda preferida en Supabase y en el estado
  const updatePreferredCurrency = async (newCurrency) => {
     if (!supportedCurrencies.includes(newCurrency)) {
         console.error("Moneda no soportada:", newCurrency);
         return; // No hacer nada si no es válida
     }
    console.log("[SettingsContext] Actualizando moneda a:", newCurrency);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { preferred_currency: newCurrency }
      });
      if (error) throw error;
      setCurrency(newCurrency); // Actualiza estado local si Supabase tuvo éxito
    } catch (error) {
      console.error("[SettingsContext] Error guardando configuración:", error);
      // Podríamos mostrar un error al usuario aquí
    }
  };

  // Valor que proveerá el contexto
  const value = {
    currency,
    updatePreferredCurrency,
    loadingSettings,
    supportedCurrencies // Exporta la lista para usarla en el select
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// 3. Crear un Hook personalizado para usar el contexto fácilmente
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings debe ser usado dentro de un SettingsProvider');
  }
  return context;
};
