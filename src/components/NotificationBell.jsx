// Archivo: src/components/NotificationBell.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';
import {
  obtenerNotificaciones,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas
} from '../lib/notificacionesApi';

// Icono de campana SVG simple
const BellIcon = ({ hasUnread }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M11.498 2.536a1.5 1.5 0 0 1 1.004 0l7.502 4.219c.52.292.848.84.848 1.441v3.962a4.5 4.5 0 0 1-2.216 3.912l-.962.481a1.5 1.5 0 0 0-.69 1.335V19.5a1.5 1.5 0 0 1-1.5 1.5H8.25a1.5 1.5 0 0 1-1.5-1.5v-1.544a1.5 1.5 0 0 0-.69-1.335l-.962-.481A4.5 4.5 0 0 1 3 12.158V8.196c0-.6.327-1.15.848-1.441l7.502-4.22ZM13.5 21a1.5 1.5 0 0 1-3 0h3Z" clipRule="evenodd" />
    {hasUnread && <circle cx="18" cy="6" r="3" fill="red" />}
  </svg>
);

function NotificationBell({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Estado para errores de carga de notificaciones
  const bellRef = useRef(null);

  const cargarNotificaciones = useCallback(async () => {
    if (!session?.user?.id) {
      setNotificaciones([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null); // Limpiar error antes de cargar
    try {
      const { data, error: fetchError } = await obtenerNotificaciones({ limite: 15 });
      if (fetchError) throw fetchError;
      
      const fetchedNotificaciones = data || [];
      setNotificaciones(fetchedNotificaciones);
      setUnreadCount(fetchedNotificaciones.filter(n => !n.leida).length);
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      setError(err.message || 'Error al cargar notificaciones'); // Guardar mensaje de error
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    cargarNotificaciones();
    // const intervalId = setInterval(cargarNotificaciones, 60000);
    // return () => clearInterval(intervalId);
  }, [cargarNotificaciones]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarcarComoLeida = async (notificacionId) => {
    // setLoading(true); // Considerar un loader más específico si es necesario
    try {
      const { error: markError } = await marcarNotificacionComoLeida(notificacionId);
      if (markError) throw markError;
      setNotificaciones(prev => prev.map(n => n.id === notificacionId ? { ...n, leida: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marcando como leída:", err);
      // Podrías setear un error específico para esta acción si quieres
    } finally {
      // setLoading(false);
    }
  };

  const handleMarcarTodasComoLeidas = async () => {
    // setLoading(true);
    try {
      const { error: markAllError } = await marcarTodasComoLeidas();
      if (markAllError) throw markAllError;
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marcando todas como leídas:", err);
    } finally {
      // setLoading(false);
    }
  };
  
  const handleVerTodas = () => {
    console.log("Navegar a la página de todas las notificaciones (TODO)");
    // if (navigateTo) navigateTo('TodasNotificaciones'); // Implementar si tienes esta página
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        id="notifications-button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white relative"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="notifications-menu"
        disabled={loading && notificaciones.length === 0 && !error} // Deshabilitar solo si carga inicial y no hay error ni datos
      >
        <span className="sr-only">Ver notificaciones</span>
        <BellIcon hasUnread={unreadCount > 0 && !loading} /> {/* Mostrar punto solo si no está cargando y hay no leídas */}
        {unreadCount > 0 && !loading && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-2 ring-gray-900">
            <span className="sr-only">{unreadCount} notificaciones no leídas</span>
          </span>
        )}
         {loading && !error && ( // Indicador de carga sutil solo si no hay error
            <span className="absolute top-1 right-1 block h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notificaciones={notificaciones}
          onMarcarComoLeida={handleMarcarComoLeida}
          onMarcarTodasComoLeidas={handleMarcarTodasComoLeidas}
          onVerTodas={handleVerTodas}
          loading={loading} // Pasa el estado de carga al dropdown
          error={error} // Pasa el estado de error al dropdown
        />
      )}
    </div>
  );
}

export default NotificationBell;
