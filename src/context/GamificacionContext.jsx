// Archivo: src/context/GamificacionContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { asegurarProgresoGamificacion, obtenerEstadoGamificacion, otorgarXP as apiOtorgarXP, verificarYOtorgarLogro as apiVerificarLogro } from '../lib/gamificacionApi';

const GamificacionContext = createContext();

export const useGamificacion = () => {
  const context = useContext(GamificacionContext);
  if (context === undefined) {
    throw new Error('useGamificacion debe ser usado dentro de un GamificacionProvider');
  }
  return context;
};

export const GamificacionProvider = ({ children }) => {
  const [xp, setXp] = useState(0);
  const [nivel, setNivel] = useState(1); // Este 'nivel' es el estado interno del contexto
  const [nombreNivel, setNombreNivel] = useState('Aprendiz Financiero');
  const [xpParaSiguienteNivel, setXpParaSiguienteNivel] = useState(100);
  const [nombreSiguienteNivel, setNombreSiguienteNivel] = useState('Explorador de Billetes');
  const [progresoXpNivelActual, setProgresoXpNivelActual] = useState(0);
  const [totalXpParaNivelActual, setTotalXpParaNivelActual] = useState(0);

  const [loadingGamificacion, setLoadingGamificacion] = useState(true);
  const [lastNotification, setLastNotification] = useState(null);

  const fetchEstadoGamificacion = useCallback(async () => {
    setLoadingGamificacion(true);
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth?.user) {
      setXp(0); setNivel(1); setNombreNivel('Aprendiz Financiero');
      setXpParaSiguienteNivel(100); setNombreSiguienteNivel('Explorador de Billetes');
      setProgresoXpNivelActual(0); setTotalXpParaNivelActual(0);
      setLoadingGamificacion(false);
      return;
    }

    await asegurarProgresoGamificacion();
    const { data, error } = await obtenerEstadoGamificacion();
    if (error) {
      console.error("Error al cargar estado de gamificación en Context:", error);
      // Mantener valores por defecto o anteriores en caso de error para no romper la UI
    } else if (data) {
      setXp(data.xp_total || 0);
      setNivel(data.nivel_usuario || 1); // <--- AJUSTE AQUÍ: usar data.nivel_usuario
      setNombreNivel(data.nombre_del_nivel || 'Aprendiz Financiero');
      setXpParaSiguienteNivel(data.xp_para_siguiente_nivel || (data.xp_total || 0) + 100);
      setNombreSiguienteNivel(data.nombre_siguiente_nivel || 'Siguiente Nivel');
      setProgresoXpNivelActual(data.progreso_xp_nivel_actual || 0);
      setTotalXpParaNivelActual(data.total_xp_para_nivel_actual || 0);
    }
    setLoadingGamificacion(false);
  }, []);

  useEffect(() => {
    fetchEstadoGamificacion();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => { // Removed _session
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchEstadoGamificacion();
      } else if (event === 'SIGNED_OUT') {
        setXp(0); setNivel(1); setNombreNivel('Aprendiz Financiero');
        setXpParaSiguienteNivel(100); setNombreSiguienteNivel('Explorador de Billetes');
        setProgresoXpNivelActual(0); setTotalXpParaNivelActual(0);
        setLoadingGamificacion(false);
      }
    });
    return () => authListener?.subscription.unsubscribe();
  }, [fetchEstadoGamificacion]);

  const otorgarXPConContexto = useCallback(async (cantidad, claveEvento = null) => {
    // const nivelAntes = nivel; // No es necesario si fn_otorgar_xp no devuelve el nivel
    const { nuevoXpTotal, error } = await apiOtorgarXP(cantidad, claveEvento);
    if (error) {
      console.error("Error al otorgar XP desde contexto:", error);
      return;
    }
    if (nuevoXpTotal !== null) {
      await fetchEstadoGamificacion(); // Recargar estado para reflejar cambios en XP y Nivel
    }
  }, [fetchEstadoGamificacion]);

  const verificarYOtorgarLogroConContexto = useCallback(async (claveLogro, detallesExtras = null) => {
    const { otorgado, error } = await apiVerificarLogro(claveLogro, detallesExtras);
    if (error) {
      console.error("Error al verificar logro desde contexto:", error);
      return false;
    }
    if (otorgado) {
      // Aquí se podría buscar la definición del logro para una notificación más específica
      // y verificar si el logro fue *recién* desbloqueado vs ya existente.
      // Por ahora, simplemente recargamos el estado si se otorgó algo (lo que implica XP).
      console.log(`[GamificacionContext] Logro ${claveLogro} verificado/otorgado: ${otorgado}`);
      await fetchEstadoGamificacion(); 
    }
    return otorgado;
  }, [fetchEstadoGamificacion]);


  const value = {
    xp,
    nivel, // El estado 'nivel' del contexto se actualiza con 'data.nivel_usuario'
    nombreNivel,
    xpParaSiguienteNivel,
    nombreSiguienteNivel,
    progresoXpNivelActual,
    totalXpParaNivelActual,
    loadingGamificacion,
    otorgarXP: otorgarXPConContexto,
    verificarYOtorgarLogro: verificarYOtorgarLogroConContexto,
    fetchEstadoGamificacion,
    lastNotification,
    clearLastNotification: () => setLastNotification(null)
  };

  return (
    <GamificacionContext.Provider value={value}>
      {children}
    </GamificacionContext.Provider>
  );
};
