// Archivo: src/pages/Calendario.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Estilos base de react-calendar
import './CalendarioStyles.css'; // Nuestros estilos personalizados encima
import { obtenerTransacciones } from '../lib/transaccionesApi';
import { useSettings } from '../context/SettingsContext';

// --- Icono SVG Inline ---
const CalendarDaysIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
  </svg>
);
// --- Fin Icono SVG Inline ---

function Calendario({ session }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [transaccionesDelMes, setTransaccionesDelMes] = useState([]);
  const [transaccionesDelDia, setTransaccionesDelDia] = useState([]);
  const [diasConActividad, setDiasConActividad] = useState({});
  const [cargandoMes, setCargandoMes] = useState(false);
  const [errorMes, setErrorMes] = useState(null);
  const [vistaActual, setVistaActual] = useState('month'); // 'month', 'year', 'decade', 'century'

  const { currency, loadingSettings } = useSettings();

  const formatYMD = (date) => date.toISOString().split('T')[0];

  const cargarTransaccionesVisibles = useCallback(async (startDate, endDate) => {
    if (!session?.user?.id) return;
    setCargandoMes(true); setErrorMes(null);
    try {
      const { data, error } = await obtenerTransacciones({ fechaDesde: formatYMD(startDate), fechaHasta: formatYMD(endDate) });
      if (error) throw error;
      setTransaccionesDelMes(data || []);
      const actividad = {};
      (data || []).forEach(t => {
        const dia = formatYMD(new Date(t.fecha)); // Asegurar que la fecha de la transacción se formatea correctamente
        if (!actividad[dia] || actividad[dia] === 'Ingreso') { actividad[dia] = t.tipo; }
        else if (t.tipo === 'Egreso'){ actividad[dia] = 'Egreso'; }
        // Podríamos añadir lógica para 'Transferencia' si queremos un color diferente
      });
      setDiasConActividad(actividad);
    } catch (err) { setErrorMes(`Error cargando transacciones: ${err.message}`); setTransaccionesDelMes([]); setDiasConActividad({}); }
    finally { setCargandoMes(false); }
  }, [session]);

  useEffect(() => {
    const currentMonthDate = fechaSeleccionada || new Date();
    let firstDay, lastDay;

    if (vistaActual === 'month') {
      firstDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
      lastDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
    } else if (vistaActual === 'year') {
      firstDay = new Date(currentMonthDate.getFullYear(), 0, 1);
      lastDay = new Date(currentMonthDate.getFullYear(), 11, 31);
    } else { // decade, century - podríamos ampliar el rango o simplemente no cargar para estas vistas
      setTransaccionesDelMes([]);
      setDiasConActividad({});
      return;
    }
    cargarTransaccionesVisibles(firstDay, lastDay);
  }, [fechaSeleccionada, vistaActual, cargarTransaccionesVisibles]);

  const handleDateClick = (value) => {
    const clickedDateStr = formatYMD(value);
    setFechaSeleccionada(value);
    const txDelDia = transaccionesDelMes.filter(t => formatYMD(new Date(t.fecha)) === clickedDateStr);
    setTransaccionesDelDia(txDelDia);
  };

  const handleActiveStartDateChange = ({ activeStartDate, view }) => {
    setFechaSeleccionada(activeStartDate || new Date()); // Actualizar fecha seleccionada también
    setVistaActual(view || 'month');
    setTransaccionesDelDia([]); // Limpiar transacciones del día al cambiar vista/mes
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatYMD(date);
      const tipoActividad = diasConActividad[dateStr];
      if (tipoActividad) {
        let colorClass = 'bg-slate-500'; // Default para transferencia o mixto no manejado
        if (tipoActividad === 'Ingreso') colorClass = 'bg-green-500';
        else if (tipoActividad === 'Egreso') colorClass = 'bg-red-500';
        return <div className={`h-1.5 w-1.5 ${colorClass} rounded-full mx-auto mt-1.5`}></div>;
      }
    }
    return null;
  };

  const formatearMoneda = useCallback((monto) => {
    if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  return (
    <div className="space-y-8">
      <h1 className="page-title"> <CalendarDaysIcon /> Calendario de Transacciones </h1>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="lg:w-2/3 xl:w-3/4">
          <section className="card-base calendar-container"> {/* Aplicar card-base y mantener calendar-container */}
            {errorMes && <p className="text-red-400 mb-4 bg-red-900/20 p-3 rounded-md">{errorMes}</p>}
            <Calendar
              onChange={handleDateClick}
              value={fechaSeleccionada}
              onActiveStartDateChange={handleActiveStartDateChange}
              onViewChange={({ view }) => setVistaActual(view)} // Actualizar vista en el estado
              tileContent={tileContent}
              locale="es-ES" // Para nombres de meses y días en español
              className="react-calendar-custom" // Clase para estilos personalizados
              next2Label={null} // Ocultar botones de navegación rápida de año
              prev2Label={null}
            />
            {cargandoMes && <p className="text-slate-400 text-center mt-3 text-sm">Actualizando calendario...</p>}
          </section>
        </div>

        <div className="lg:w-1/3 xl:w-1/4">
          <section className="card-base lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-100 border-b border-slate-700 pb-3">
              Transacciones del {fechaSeleccionada.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            {transaccionesDelDia.length === 0 && !cargandoMes && (<p className="text-slate-500 text-sm py-4">No hay transacciones para este día.</p>)}
            {transaccionesDelDia.length > 0 && !cargandoMes && (
              <ul className="space-y-3 max-h-[60vh] lg:max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 text-sm">
                {transaccionesDelDia.map(tx => (
                  <li key={tx.id} className="flex justify-between items-center border-b border-slate-700 pb-2.5 last:border-b-0 gap-2">
                    <span className="flex-1 min-w-0 text-slate-200 truncate" title={tx.descripcion}>{tx.descripcion || 'S/D'}</span>
                    <span className={`font-medium whitespace-nowrap ${tx.tipo === 'Ingreso' ? 'text-green-400' : tx.tipo === 'Egreso' ? 'text-red-400' : 'text-blue-400'}`}>
                      {tx.tipo === 'Ingreso' ? '+' : tx.tipo === 'Egreso' ? '-' : ''} {formatearMoneda(Math.abs(tx.monto))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {cargandoMes && transaccionesDelDia.length === 0 && <p className="text-slate-400 text-sm py-4">Cargando...</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Calendario;
