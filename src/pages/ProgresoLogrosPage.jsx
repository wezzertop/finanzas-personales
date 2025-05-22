// Archivo: src/pages/ProgresoLogrosPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useGamificacion } from '../context/GamificacionContext';
import { obtenerLogrosDesbloqueadosUsuario, obtenerDefinicionesLogros } from '../lib/gamificacionApi';
// Ya no importamos iconos de react-icons/lu

// Componente para un solo logro
const LogroItem = ({ definicion, desbloqueadoInfo, onClick }) => {
  const isDesbloqueado = !!desbloqueadoInfo;
  const fechaDesbloqueo = isDesbloqueado ? new Date(desbloqueadoInfo.fecha_desbloqueo).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  // Determinar el emoji basado en la clave o un emoji por defecto
  let emojiLogro = '🏆'; // Emoji por defecto
  if (definicion.clave_logro.includes('PRESUPUESTO')) emojiLogro = '🛡️'; // Escudo para presupuesto
  else if (definicion.clave_logro.includes('AHORRADOR') || definicion.clave_logro.includes('OBJETIVO')) emojiLogro = '⭐'; // Estrella para ahorro/objetivo
  else if (definicion.clave_logro.includes('INVERSOR')) emojiLogro = '⚡'; // Rayo para inversor
  else if (definicion.clave_logro.includes('DEUDA')) emojiLogro = '🎉'; // Fiesta para deuda liquidada (antes trofeo)
  else if (definicion.clave_logro.includes('PRIMER_PASO') || definicion.clave_logro.includes('REGISTRADOR')) emojiLogro = '✍️'; // Escritura para registro


  return (
    <div
      className={`p-4 rounded-lg shadow-md flex items-start space-x-4 transition-all duration-200 ease-in-out
                  ${isDesbloqueado ? 'bg-green-800/30 border border-green-700 hover:shadow-green-500/30' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700/70'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick && onClick()}
    >
      <div className={`p-2 rounded-full text-2xl ${isDesbloqueado ? 'bg-green-500/20' : 'bg-gray-700'}`}>
        {/* Usar el emoji directamente */}
        <span role="img" aria-label={definicion.nombre_logro}>{emojiLogro}</span>
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${isDesbloqueado ? 'text-green-300' : 'text-white'}`}>{definicion.nombre_logro}</h3>
        <p className={`text-sm ${isDesbloqueado ? 'text-green-400/80' : 'text-gray-400'}`}>{definicion.descripcion}</p>
        <div className="mt-2 flex justify-between items-center text-xs">
          <span className={`${isDesbloqueado ? 'text-green-400' : 'text-yellow-400'}`}>
            {definicion.xp_recompensa} XP
          </span>
          {isDesbloqueado && fechaDesbloqueo && (
            <span className="text-gray-500">Desbloqueado: {fechaDesbloqueo}</span>
          )}
          {!isDesbloqueado && (
            <span className="text-gray-600 italic">Bloqueado</span>
          )}
        </div>
      </div>
      {!isDesbloqueado && <span className="text-2xl text-gray-600 self-center" role="img" aria-label="chevron right">➡️</span>}
    </div>
  );
};

function ProgresoLogrosPage({ session }) {
  const {
    xp,
    nivel,
    nombreNivel,
    xpParaSiguienteNivel,
    nombreSiguienteNivel,
    // progresoXpNivelActual, // Removed as it's unused
    totalXpParaNivelActual,
    loadingGamificacion,
    fetchEstadoGamificacion
  } = useGamificacion();

  const [definicionesLogros, setDefinicionesLogros] = useState([]);
  const [logrosDesbloqueados, setLogrosDesbloqueados] = useState(new Map()); // Inicializar como Map
  const [loadingLogros, setLoadingLogros] = useState(true);
  const [errorLogros, setErrorLogros] = useState(null);

  const cargarLogros = useCallback(async () => {
    if (!session?.user?.id) {
      setLoadingLogros(false);
      return;
    }
    setLoadingLogros(true);
    setErrorLogros(null);
    try {
      const [resDefiniciones, resDesbloqueados] = await Promise.all([
        obtenerDefinicionesLogros(),
        obtenerLogrosDesbloqueadosUsuario()
      ]);

      if (resDefiniciones.error) throw new Error(`Definiciones: ${resDefiniciones.error.message}`);
      if (resDesbloqueados.error) throw new Error(`Desbloqueados: ${resDesbloqueados.error.message}`);

      setDefinicionesLogros(resDefiniciones.data || []);
      const desbloqueadosMap = new Map();
      (resDesbloqueados.data || []).forEach(logro => {
        desbloqueadosMap.set(logro.logro_id, logro);
      });
      setLogrosDesbloqueados(desbloqueadosMap);

    } catch (err) {
      console.error("Error cargando datos de logros:", err);
      setErrorLogros(err.message);
    } finally {
      setLoadingLogros(false);
    }
  }, [session]);

  useEffect(() => {
    fetchEstadoGamificacion();
    cargarLogros();
  }, [cargarLogros, fetchEstadoGamificacion]);

  const xpNecesarioParaEsteNivel = totalXpParaNivelActual || 0;
  const xpTotalParaSiguiente = xpParaSiguienteNivel || (xp + 100);
  const xpEnEsteNivel = xp - xpNecesarioParaEsteNivel;
  const rangoXpNivel = xpTotalParaSiguiente - xpNecesarioParaEsteNivel;
  const porcentajeProgresoNivel = rangoXpNivel > 0 ? Math.min(100, (xpEnEsteNivel / rangoXpNivel) * 100) : (xp >= xpTotalParaSiguiente ? 100 : 0);

  const totalLogros = definicionesLogros.length;
  const logrosConseguidos = logrosDesbloqueados.size;

  if (loadingGamificacion || loadingLogros) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        {/* Emoji de carga */}
        <span role="img" aria-label="Cargando" className="animate-spin text-3xl mr-3">🔄</span>
        Cargando progreso y logros...
      </div>
    );
  }

  if (errorLogros) {
    return <div className="text-red-400 bg-red-900/30 p-4 rounded-md">Error al cargar logros: {errorLogros}</div>;
  }

  return (
    <div className="space-y-8 text-white">
      <div className="flex items-center">
        {/* Emoji para el título de la página */}
        <span className="mr-3 text-3xl text-yellow-400" role="img" aria-label="Medalla">🏅</span>
        <h1 className="text-3xl font-bold">Mi Progreso y Logros</h1>
      </div>

      {/* Sección de Nivel y XP */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-xl border border-indigo-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-300">Nivel {nivel}: {nombreNivel}</h2>
            <p className="text-sm text-gray-400">XP Total: {xp.toLocaleString()}</p>
          </div>
          {nivel < 10 && (
            <p className="text-sm text-indigo-400 mt-2 sm:mt-0">
              Siguiente Nivel: {nombreSiguienteNivel} (en {Math.max(0, xpTotalParaSiguiente - xp).toLocaleString()} XP)
            </p>
          )}
        </div>
        {nivel < 10 && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progreso Nivel Actual</span>
              <span>{xpEnEsteNivel.toLocaleString()} / {rangoXpNivel.toLocaleString()} XP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 border border-gray-600">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out text-xs flex items-center justify-center text-white font-medium"
                style={{ width: `${porcentajeProgresoNivel}%` }}
              >
                {porcentajeProgresoNivel > 10 && `${porcentajeProgresoNivel.toFixed(0)}%`}
              </div>
            </div>
          </div>
        )}
         {nivel >= 10 && (
            <p className="text-center text-lg font-semibold text-yellow-400 mt-4">¡Has alcanzado el nivel máximo! ¡Felicidades!</p>
        )}
      </section>

      {/* Sección de Logros */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-yellow-300">Logros</h2>
          <span className="text-gray-400 text-sm">
            {logrosConseguidos} de {totalLogros} desbloqueados
          </span>
        </div>

        {definicionesLogros.length === 0 && (
          <p className="text-gray-500">No hay logros definidos en el sistema.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {definicionesLogros.map(def => (
            <LogroItem
              key={def.id}
              definicion={def}
              desbloqueadoInfo={logrosDesbloqueados.get(def.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProgresoLogrosPage;
