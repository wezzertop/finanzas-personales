import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { obtenerTransacciones } from '../lib/transaccionesApi';
import './CalendarioStyles.css';
import { useSettings } from '../context/SettingsContext'; // Importar hook

function Calendario({ session }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [transaccionesDelMes, setTransaccionesDelMes] = useState([]);
  const [transaccionesDelDia, setTransaccionesDelDia] = useState([]);
  const [diasConActividad, setDiasConActividad] = useState({});
  const [cargandoMes, setCargandoMes] = useState(false);
  const [errorMes, setErrorMes] = useState(null);
  const [vistaActual, setVistaActual] = useState('month');

  // Obtener moneda y estado de carga del contexto
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
         (data || []).forEach(t => { const dia = formatYMD(new Date(t.fecha)); if (!actividad[dia] || actividad[dia] === 'Ingreso') { actividad[dia] = t.tipo; } else if (t.tipo === 'Egreso'){ actividad[dia] = 'Egreso'; } });
         setDiasConActividad(actividad);
       } catch (err) { setErrorMes(`Error cargando: ${err.message}`); setTransaccionesDelMes([]); setDiasConActividad({}); }
       finally { setCargandoMes(false); }
   }, [session]);

  useEffect(() => {
       const activeStartDate = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
       let firstDay, lastDay;
       if (vistaActual === 'month') { firstDay = new Date(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1); lastDay = new Date(activeStartDate.getFullYear(), activeStartDate.getMonth() + 1, 0); }
       else { firstDay = new Date(activeStartDate.getFullYear(), 0, 1); lastDay = new Date(activeStartDate.getFullYear(), 11, 31); }
       cargarTransaccionesVisibles(firstDay, lastDay);
   }, [fechaSeleccionada, vistaActual, cargarTransaccionesVisibles]);

  const handleDateClick = (value) => {
       const clickedDateStr = formatYMD(value);
       setFechaSeleccionada(value);
       const txDelDia = transaccionesDelMes.filter(t => formatYMD(new Date(t.fecha)) === clickedDateStr);
       setTransaccionesDelDia(txDelDia);
   };

  const handleActiveStartDateChange = ({ activeStartDate, view }) => {
       setFechaSeleccionada(activeStartDate || new Date());
       setVistaActual(view || 'month');
       setTransaccionesDelDia([]);
   };

  const tileContent = ({ date, view }) => {
       if (view === 'month') { const dateStr = formatYMD(date); const tipoActividad = diasConActividad[dateStr]; if (tipoActividad) { const colorClass = tipoActividad === 'Ingreso' ? 'bg-green-500' : 'bg-red-500'; return <div className={`h-1.5 w-1.5 ${colorClass} rounded-full mx-auto mt-1`}></div>; } } return null;
   };

  // Función formatearMoneda usa el contexto
  const formatearMoneda = useCallback((monto) => {
    if (loadingSettings || (typeof monto !== 'number' && typeof monto !== 'string')) return '---';
     const num = parseFloat(monto);
     if (isNaN(num)) return '---';
    return num.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center text-white"> <span className="mr-3 text-2xl">🗓️</span> <h1 className="text-2xl font-semibold">Calendario</h1> </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 xl:w-3/4">
          <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg calendar-container">
             {errorMes && <p className="text-red-400 mb-4">{errorMes}</p>}
             <Calendar onChange={handleDateClick} value={fechaSeleccionada} onActiveStartDateChange={handleActiveStartDateChange} tileContent={tileContent} locale="es-ES" className="react-calendar-custom" />
             {cargandoMes && <p className="text-blue-400 text-center mt-2 text-sm">Cargando...</p>}
          </section>
        </div>

        <div className="w-full lg:w-1/3 xl:w-1/4">
           <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg lg:sticky lg:top-6">
               <h2 className="text-lg font-semibold mb-4 text-white border-b border-gray-700 pb-2">
                   Transacciones del {fechaSeleccionada.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
               </h2>
               {transaccionesDelDia.length === 0 && ( <p className="text-gray-500 text-sm">No hay transacciones.</p> )}
               {transaccionesDelDia.length > 0 && (
                   <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 text-xs sm:text-sm">
                       {transaccionesDelDia.map(tx => (
                           <li key={tx.id} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-b-0 gap-2">
                               <span className="flex-shrink min-w-0 mr-2 truncate" title={tx.descripcion}>{tx.descripcion || 'S/D'}</span>
                               <span className={`font-medium whitespace-nowrap ${tx.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                                   {tx.tipo === 'Ingreso' ? '+' : '-'} {formatearMoneda(Math.abs(tx.monto))} {/* Usa formateador */}
                               </span>
                           </li>
                       ))}
                   </ul>
               )}
           </section>
        </div>
      </div>
    </div>
  );
}

export default Calendario;
