import React, { useState, useEffect, useCallback } from 'react';
// Importar APIs
import {
    obtenerResumenFinanciero,
    obtenerResumenMensual,
    obtenerResumenPresupuestos, // API para resumen presupuestos
    obtenerResumenObjetivos     // API para resumen objetivos
} from '../lib/dashboardApi';
import { obtenerUltimasTransacciones } from '../lib/transaccionesApi';
import { obtenerProximasRecurrencias } from '../lib/recurringTransactionsApi';
import { useSettings } from '../context/SettingsContext';
// Importar componentes de gráficos
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Componente SummaryCard (Tarjeta de Resumen) ---
function SummaryCard({ title, value, colorClass = 'text-indigo-400', isLoading }) {
  const { currency, loadingSettings } = useSettings();
  // Formateador de moneda local que usa el contexto
  const formatearMoneda = useCallback((monto) => {
    if (loadingSettings || isLoading || typeof monto !== 'number') return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings, isLoading]); // Depende de estos valores

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">{title}</h3>
      {/* Muestra placeholder si carga datos O configuración */}
      {isLoading || loadingSettings ? (
        <div className="h-8 bg-gray-700 rounded animate-pulse w-3/4"></div>
      ) : (
        <p className={`text-3xl font-semibold ${colorClass} truncate`}>
          {formatearMoneda(value)}
        </p>
      )}
    </div>
  );
}
// --- Fin Componente SummaryCard ---

// Formateador de fecha corta
const formatFechaCorta = (fechaIso) => { if (!fechaIso) return 'N/A'; try { return new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); } catch (e) { return 'Inv.'; } };

// --- Componente Principal Dashboard ---
function Dashboard({ session }) {
  // Estados para cada sección de datos
  const [resumen, setResumen] = useState({ saldo_total_carteras: 0, ingresos_mes_actual: 0, egresos_mes_actual: 0 });
  const [datosMensuales, setDatosMensuales] = useState([]);
  const [ultimasTransacciones, setUltimasTransacciones] = useState([]);
  const [proximasRecurrencias, setProximasRecurrencias] = useState([]);
  const [resumenPresupuestos, setResumenPresupuestos] = useState([]);
  const [resumenObjetivos, setResumenObjetivos] = useState([]);

  // Estado general de carga y error
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Contexto para la moneda
  const { currency, loadingSettings } = useSettings();

  // Función para cargar todos los datos del dashboard
  const cargarDatosDashboard = useCallback(async () => {
    if (!session?.user?.id) return; // Salir si no hay sesión
    setCargando(true); setError(null);
    try {
      // Ejecutar todas las llamadas a la API en paralelo para eficiencia
      const [
          resumenData,
          resumenMensualData,
          ultimasTxData,
          proximasRecData,
          resPresupuestosData,
          resObjetivosData
        ] = await Promise.all([
        obtenerResumenFinanciero(),
        obtenerResumenMensual(6), // Últimos 6 meses
        obtenerUltimasTransacciones(5), // Últimas 5 transacciones
        obtenerProximasRecurrencias(5), // Próximas 5 recurrencias
        obtenerResumenPresupuestos(3), // Top 3 presupuestos
        obtenerResumenObjetivos(3)      // Top 3 objetivos
      ]);

      // Procesar cada resultado y actualizar el estado correspondiente
      if (resumenData.error) throw new Error(`Resumen: ${resumenData.error.message}`);
      setResumen(resumenData.data || { saldo_total_carteras: 0, ingresos_mes_actual: 0, egresos_mes_actual: 0 });

      if (resumenMensualData.error) throw new Error(`Mensual: ${resumenMensualData.error.message}`);
      const fM = (resumenMensualData.data || []).map(d => ({ ...d, total_ingresos: parseFloat(d.total_ingresos) || 0, total_egresos: parseFloat(d.total_egresos) || 0, }));
      setDatosMensuales(fM);

      if (ultimasTxData.error) throw new Error(`Ultimas Tx: ${ultimasTxData.error.message}`);
      setUltimasTransacciones(ultimasTxData.data || []);

      if (proximasRecData.error) throw new Error(`Prox Rec: ${proximasRecData.error.message}`);
      setProximasRecurrencias(proximasRecData.data || []);

      if (resPresupuestosData.error) throw new Error(`Res Presup: ${resPresupuestosData.error.message}`);
      setResumenPresupuestos(resPresupuestosData.data || []);

      if (resObjetivosData.error) throw new Error(`Res Obj: ${resObjetivosData.error.message}`);
      setResumenObjetivos(resObjetivosData.data || []);

    } catch (err) {
      console.error("Error cargando datos del dashboard:", err);
      setError(`Error al cargar datos: ${err.message || 'Desconocido'}`);
      // Resetear todos los estados en caso de error
      setResumen({ saldo_total_carteras: 0, ingresos_mes_actual: 0, egresos_mes_actual: 0 });
      setDatosMensuales([]); setUltimasTransacciones([]); setProximasRecurrencias([]);
      setResumenPresupuestos([]); setResumenObjetivos([]);
    } finally {
      setCargando(false); // Marcar carga como finalizada (con éxito o error)
    }
  }, [session]); // Depende de la sesión para ejecutarse

  // Cargar datos cuando el componente se monta o la sesión cambia
  useEffect(() => {
    cargarDatosDashboard();
  }, [cargarDatosDashboard]);

  // --- Formateadores y Cálculos ---
  // Formateador para Tooltip del gráfico (usa contexto)
  const tooltipFormatter = useCallback((value) => {
      if (loadingSettings || typeof value !== 'number') return '---';
      return value.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }, [currency, loadingSettings]);

  // Formateador general de moneda (usa contexto)
  const formatearMonedaLocal = useCallback((monto) => {
      if (loadingSettings || typeof monto !== 'number') return '---';
      return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  // Cálculo del balance mensual
  const balanceMes = resumen.ingresos_mes_actual - resumen.egresos_mes_actual;
  const balanceColor = balanceMes >= 0 ? 'text-green-400' : 'text-red-400';
  // --- Fin Formateadores y Cálculos ---

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div className="text-white">
         <h1 className="text-3xl font-bold mb-2">¡Hola! 👋</h1>
         <p className="text-lg text-gray-400">Resumen del mes en <span className='font-semibold'>{loadingSettings ? '...' : currency}</span>.</p>
      </div>

      {/* Mensaje de Error General */}
      {error && <p className="text-red-400 bg-gray-900 p-4 rounded-lg">{error}</p>}

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <SummaryCard title="Saldo Total" value={resumen.saldo_total_carteras} colorClass="text-blue-400" isLoading={cargando} />
         <SummaryCard title="Ingresos Mes" value={resumen.ingresos_mes_actual} colorClass="text-green-400" isLoading={cargando} />
         <SummaryCard title="Egresos Mes" value={resumen.egresos_mes_actual} colorClass="text-red-400" isLoading={cargando} />
         <SummaryCard title="Balance Mes" value={balanceMes} colorClass={balanceColor} isLoading={cargando} />
      </div>

      {/* Contenedor Principal: Gráfico y Resúmenes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Columna Izquierda (Gráfico y Actividad Reciente) */}
        <div className="space-y-8 lg:col-span-2">
            {/* Gráfico Mensual */}
            <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-white">Resumen Últimos Meses</h2>
               {cargando && <p className="text-blue-400 text-center py-10">Cargando...</p>}
               {!cargando && datosMensuales.length === 0 && !error && ( <p className="text-gray-500 text-center py-10">No hay datos.</p> )}
               {!cargando && datosMensuales.length > 0 && (
                   <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                          <BarChart data={datosMensuales} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={12} />
                              <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={tooltipFormatter} />
                              <Tooltip formatter={tooltipFormatter} cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} itemStyle={{ color: '#D1D5DB' }}/>
                              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                              <Bar dataKey="total_ingresos" name="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="total_egresos" name="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                   </div>
               )}
            </section>

            {/* Actividad Reciente */}
            <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Actividad Reciente</h2>
                {cargando && <p className="text-blue-400 text-sm">Cargando...</p>}
                {!cargando && ultimasTransacciones.length === 0 && !error && (<p className="text-gray-500 text-sm">No hay recientes.</p>)}
                {!cargando && ultimasTransacciones.length > 0 && ( <ul className="space-y-3"> {ultimasTransacciones.map(tx => ( <li key={tx.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-b-0 gap-2"> <div className='flex-1 min-w-0'> <p className="text-gray-300 truncate">{tx.descripcion || 'S/D'}</p> <p className="text-xs text-gray-500">{tx.categoria?.nombre || 'N/A'}</p> </div> <span className={`font-medium whitespace-nowrap ${tx.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}> {tx.tipo === 'Ingreso' ? '+' : '-'} {formatearMonedaLocal(Math.abs(tx.monto))} </span> </li> ))} </ul> )}
            </section>
        </div>

        {/* Columna Derecha (Recurrencias, Presupuestos, Objetivos) */}
        <div className="space-y-8 lg:col-span-1">
            {/* Próximas Recurrencias */}
            <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Próximas Recurrencias</h2>
                 {cargando && <p className="text-blue-400 text-sm">Cargando...</p>}
                 {!cargando && proximasRecurrencias.length === 0 && !error && (<p className="text-gray-500 text-sm">No hay próximas.</p>)}
                 {!cargando && proximasRecurrencias.length > 0 && ( <ul className="space-y-3"> {proximasRecurrencias.map(rec => ( <li key={rec.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-b-0 gap-2"> <div className='flex-1 min-w-0'> <p className="text-gray-300 truncate">{rec.descripcion || 'Recurrencia'}</p> <p className="text-xs text-gray-500">Próx: {formatFechaCorta(rec.proxima_fecha)}</p> </div> <span className={`font-medium whitespace-nowrap ${rec.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}> {rec.tipo === 'Ingreso' ? '+' : '-'} {formatearMonedaLocal(Math.abs(rec.monto))} </span> </li> ))} </ul> )}
            </section>

            {/* Resumen Presupuestos */}
            <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Presupuestos (Mes Actual)</h2>
                {cargando && <p className="text-blue-400 text-sm">Cargando...</p>}
                {!cargando && resumenPresupuestos.length === 0 && !error && (<p className="text-gray-500 text-sm">Sin presupuestos este mes.</p>)}
                {!cargando && resumenPresupuestos.length > 0 && (
                    <ul className="space-y-3">
                        {resumenPresupuestos.map((pres, index) => {
                            const progreso = Math.max(0, parseFloat(pres.progreso) || 0);
                            const progresoDisplay = Math.min(progreso, 100);
                            const progresoColor = progreso < 75 ? 'bg-green-500' : progreso < 95 ? 'bg-yellow-500' : 'bg-red-500';
                            return (
                                <li key={index} className="text-sm">
                                    <div className="flex justify-between mb-1"> <span className="text-gray-300 truncate">{pres.categoria_nombre}</span> <span className="text-gray-400">{progreso.toFixed(0)}%</span> </div>
                                    <div className="w-full bg-gray-600 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${progresoColor}`} style={{ width: `${progresoDisplay}%` }}></div></div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1"> <span>Gast: {formatearMonedaLocal(pres.gasto_real_mes)}</span> <span>Pres: {formatearMonedaLocal(pres.monto)}</span> </div>
                                </li> );
                        })}
                    </ul>
                )}
            </section>

            {/* Resumen Objetivos */}
             <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Progreso Objetivos</h2>
                 {cargando && <p className="text-blue-400 text-sm">Cargando...</p>}
                 {!cargando && resumenObjetivos.length === 0 && !error && (<p className="text-gray-500 text-sm">Sin objetivos activos.</p>)}
                 {!cargando && resumenObjetivos.length > 0 && (
                     <ul className="space-y-3">
                        {resumenObjetivos.map((obj, index) => {
                            const progreso = Math.max(0, parseFloat(obj.progreso) || 0);
                            const progresoDisplay = Math.min(progreso, 100);
                            const progresoColor = progreso < 75 ? 'bg-green-500' : progreso < 95 ? 'bg-yellow-500' : 'bg-red-500';
                            return(
                                <li key={index} className="text-sm">
                                    <div className="flex justify-between mb-1"> <span className="text-gray-300 truncate">{obj.nombre}</span> <span className="text-gray-400">{progreso.toFixed(0)}%</span> </div>
                                    <div className="w-full bg-gray-600 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${progresoColor}`} style={{ width: `${progresoDisplay}%` }}></div></div>
                                     <div className="flex justify-between text-xs text-gray-500 mt-1"> <span>Ahorrado: {formatearMonedaLocal(obj.monto_actual)}</span> <span>Meta: {formatearMonedaLocal(obj.monto_objetivo)}</span> </div>
                                </li> );
                        })}
                     </ul>
                 )}
            </section>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;
