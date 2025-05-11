// Archivo: src/components/NotificationDropdown.jsx
import React from 'react';

const getNotificationIcon = (tipo) => {
  switch (tipo) {
    case 'PRESUPUESTO_UMBRAL': return '📊';
    case 'PRESUPUESTO_EXCEDIDO': return '🚫';
    case 'RECURRENTE_PROXIMA': return '🔁';
    case 'OBJETIVO_LOGRADO': return '🏆';
    default: return '🔔';
  }
};

function NotificationDropdown({
  notificaciones,
  onMarcarComoLeida,
  onMarcarTodasComoLeidas,
  onVerTodas,
  loading,
  error // Esta es la prop que recibe el error
}) {
  const tieneNotificacionesNoLeidas = notificaciones.some(n => !n.leida);

  const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.round((now - date) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `hace ${diffSeconds}s`;
    if (diffMinutes < 60) return `hace ${diffMinutes}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return `ayer`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      className="absolute left-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="notifications-button"
    >
      <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-md font-semibold text-white">Notificaciones</h3>
        {notificaciones.length > 0 && tieneNotificacionesNoLeidas && (
          <button
            onClick={onMarcarTodasComoLeidas}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
            disabled={loading}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Cargando...</p>}
      {/* Usar la variable 'error' que se pasa como prop */}
      {error && <p className="text-center text-red-400 py-4 px-2 text-sm">Error: {typeof error === 'object' ? error.message : error}</p>}


      {!loading && !error && notificaciones.length === 0 && (
        <p className="text-center text-gray-500 py-8 px-4 text-sm">No tienes notificaciones nuevas.</p>
      )}

      {!loading && !error && notificaciones.length > 0 && (
        <ul className="max-h-80 overflow-y-auto divide-y divide-gray-700">
          {notificaciones.map((notif) => (
            <li
              key={notif.id}
              className={`p-3 hover:bg-gray-700/50 transition-colors duration-150 ${!notif.leida ? 'bg-gray-700' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl mt-0.5" aria-hidden="true">{getNotificationIcon(notif.tipo_notificacion)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.leida ? 'text-white font-medium' : 'text-gray-300'}`}>
                    {notif.mensaje}
                  </p>
                  <p className={`text-xs mt-1 ${!notif.leida ? 'text-indigo-300' : 'text-gray-500'}`}>
                    {formatRelativeDate(notif.fecha_creacion)}
                  </p>
                </div>
                {!notif.leida && (
                  <button
                    onClick={() => onMarcarComoLeida(notif.id)}
                    title="Marcar como leída"
                    className="p-1 text-gray-400 hover:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    disabled={loading}
                  >
                    <span className="block h-2 w-2 bg-indigo-500 rounded-full" aria-hidden="true"></span>
                    <span className="sr-only">Marcar como leída</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {onVerTodas && !loading && !error && (
        <div className="px-4 py-3 border-t border-gray-700">
          <button
            onClick={onVerTodas}
            className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 font-medium py-1.5 rounded-md hover:bg-gray-700/50 transition-colors"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
