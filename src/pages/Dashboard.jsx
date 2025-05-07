import React, { useState, useEffect, useCallback } from 'react';
// APIs
import {
    obtenerResumenFinanciero, obtenerResumenMensual, obtenerResumenPresupuestos,
    obtenerResumenObjetivos, obtenerPatrimonioNeto, obtenerTotalDeudas
} from '../lib/dashboardApi';
import { obtenerUltimasTransacciones } from '../lib/transaccionesApi';
import { obtenerProximasRecurrencias } from '../lib/recurringTransactionsApi';
import { useSettings } from '../context/SettingsContext';
// Gráficos
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Componente SummaryCard y formateadores (sin cambios) ---
function SummaryCard({ title, value, colorClass = 'text-indigo-400', isLoading }) { const { currency, loadingSettings } = useSettings(); const fM = useCallback((m) => { if (loadingSettings || isLoading || typeof m !== 'number') return '---'; return m.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings, isLoading]); return ( <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 min-h-[110px]"> <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">{title}</h3> {isLoading || loadingSettings ? ( <div className="h-8 bg-gray-700 rounded animate-pulse w-3/4"></div> ) : ( <p className={`text-3xl font-semibold ${colorClass} truncate`}> {fM(value)} </p> )} </div> ); }
const formatFechaCorta = (f) => { if (!f) return 'N/A'; try { return new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); } catch (e) { return 'Inv.'; } };
const formatYMD = (date) => { if (!date) return ''; try { return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };
const getInicioMesActual = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('sv-SE');
const getFinMesActual = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('sv-SE');

// --- Componente Principal Dashboard ---
function Dashboard({ session }) {
  // Estados
  const [resumen, setResumen] = useState({ saldo_total_carteras: 0, ingresos_periodo: 0, egresos_periodo: 0 });
  const [datosMensuales, setDatosMensuales] = useState([]);
  const [ultimasTransacciones, setUltimasTransacciones] = useState([]);
  const [proximasRecurrencias, setProximasRecurrencias] = useState([]);
  const [resumenPresupuestos, setResumenPresupuestos] = useState([]);
  const [resumenObjetivos, setResumenObjetivos] = useState([]);
  const [patrimonioNeto, setPatrimonioNeto] = useState(0);
  const [totalDeudas, setTotalDeudas] = useState(0);
  const [datosPatrimonio, setDatosPatrimonio] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(getInicioMesActual());
  const [fechaFin, setFechaFin] = useState(getFinMesActual());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const { currency, loadingSettings } = useSettings();

  // Cargar datos
  const cargarDatosDashboard = useCallback(async () => {
    if (!session?.user?.id || !fechaInicio || !fechaFin) return;
    console.log("[Dashboard] Iniciando carga de datos...");
    setCargando(true); setError(null);
    const errors = [];
    const handlePromise = async (promise, name) => { try { const result = await promise; if (result.error) { errors.push(`Error ${name}: ${result.error.message}`); console.error(`API Err (${name}):`, result.error); return { data: null }; } return result; } catch (catchError) { errors.push(`Catch ${name}: ${catchError.message}`); console.error(`Catch Err (${name}):`, catchError); return { data: null }; } };

    try {
      const numMesesGraficoBarras = 6;
      const numMesesGraficoPatrimonio = 12;

      console.log("[Dashboard] Llamando a Promise.all...");
      const results = await Promise.all([
        handlePromise(obtenerResumenFinanciero(fechaInicio, fechaFin), 'Resumen Financiero'),
        handlePromise(obtenerResumenMensual(numMesesGraficoBarras), 'Resumen Mensual Barras'),
        handlePromise(obtenerUltimasTransacciones(5), 'Últimas Transacciones'),
        handlePromise(obtenerProximasRecurrencias(5), 'Próximas Recurrencias'),
        handlePromise(obtenerResumenPresupuestos(fechaInicio, fechaFin, 3), 'Resumen Presupuestos'),
        handlePromise(obtenerResumenObjetivos(3), 'Resumen Objetivos'),
        handlePromise(obtenerPatrimonioNeto(), 'Patrimonio Neto'),
        handlePromise(obtenerTotalDeudas(), 'Total Deudas'),
        handlePromise(obtenerResumenMensual(numMesesGraficoPatrimonio), 'Resumen Mensual Patrimonio')
      ]);
      console.log("[Dashboard] Promise.all completado. Resultados:", results);

      // Desestructurar resultados
      const [
          resumenData, resMensualBarrasData, ultimasTxData,
          proximasRecData, resPresupuestosData, resObjetivosData,
          resPatrimonioData, resTotalDeudasData, resMensualPatrimonioData
        ] = results;

      // Procesar resultados y actualizar estados
      console.log("[Dashboard] Procesando resumenData...");
      setResumen(resumenData.data || { saldo_total_carteras: 0, ingresos_periodo: 0, egresos_periodo: 0 });

      console.log("[Dashboard] Procesando resMensualBarrasData...");
      const fMB = (resMensualBarrasData.data || []).map(d => ({ ...d, total_ingresos: parseFloat(d.total_ingresos) || 0, total_egresos: parseFloat(d.total_egresos) || 0, })); setDatosMensuales(fMB);

      console.log("[Dashboard] Procesando ultimasTxData...");
      setUltimasTransacciones(ultimasTxData.data || []);

      console.log("[Dashboard] Procesando proximasRecData...");
      setProximasRecurrencias(proximasRecData.data || []);

      console.log("[Dashboard] Procesando resPresupuestosData...");
      setResumenPresupuestos(resPresupuestosData.data || []);

      console.log("[Dashboard] Procesando resObjetivosData...");
      setResumenObjetivos(resObjetivosData.data || []);

      console.log("[Dashboard] Procesando resPatrimonioData...");
      const currentNetWorth = resPatrimonioData.data ?? 0; setPatrimonioNeto(currentNetWorth);

      console.log("[Dashboard] Procesando resTotalDeudasData...");
      setTotalDeudas(resTotalDeudasData.data ?? 0);

      console.log("[Dashboard] Procesando resMensualPatrimonioData...");
      if (resMensualPatrimonioData.data) {
          const flujoMensualHistorial = (resMensualPatrimonioData.data).map(d => ({ mes: d.mes, flujoNeto: (parseFloat(d.total_ingresos) || 0) - (parseFloat(d.total_egresos) || 0) })).sort((a, b) => a.mes.localeCompare(b.mes));
          let patrimonioEstimado = currentNetWorth;
          const historialPatrimonio = flujoMensualHistorial.map((_, index) => {
              const indiceInverso = flujoMensualHistorial.length - 1 - index;
              const mesActual = flujoMensualHistorial[indiceInverso];
              if (index !== 0) { const mesSiguiente = flujoMensualHistorial[indiceInverso + 1]; patrimonioEstimado = patrimonioEstimado - mesSiguiente.flujoNeto; }
              return { mes: mesActual.mes, PatrimonioEstimado: patrimonioEstimado };
          }).reverse();
          setDatosPatrimonio(historialPatrimonio);
      } else {
          setDatosPatrimonio([]);
      }
      console.log("[Dashboard] Historial Patrimonio Calculado.");


      if (errors.length > 0) { setError(errors.join('; ')); }
      console.log("[Dashboard] Carga de datos finalizada (con posibles errores menores).");

    } catch (generalError) {
      console.error("Error general cargando datos del dashboard:", generalError);
      setError(`Error inesperado: ${generalError?.message || 'Desconocido'}`);
      // Resetear estados
      setResumen({ saldo_total_carteras: 0, ingresos_periodo: 0, egresos_periodo: 0 }); setDatosMensuales([]); setUltimasTransacciones([]); setProximasRecurrencias([]); setResumenPresupuestos([]); setResumenObjetivos([]); setPatrimonioNeto(0); setTotalDeudas(0); setDatosPatrimonio([]);
    } finally {
      setCargando(false);
    }
  }, [session, fechaInicio, fechaFin]);

  useEffect(() => { cargarDatosDashboard(); }, [cargarDatosDashboard]);

  // Formateadores y cálculos
  const tooltipFormatter = useCallback((v) => { /* ... */ if (loadingSettings || typeof v !== 'number') return '---'; return v.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }, [currency, loadingSettings]);
  const formatearMonedaLocal = useCallback((m) => { /* ... */ if (loadingSettings || typeof m !== 'number') return '---'; return m.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);
  const balancePeriodo = resumen.ingresos_periodo - resumen.egresos_periodo;
  const balanceColor = balancePeriodo >= 0 ? 'text-green-400' : 'text-red-400';
  const patrimonioNetoColor = patrimonioNeto >= 0 ? 'text-green-400' : 'text-red-400';
  const totalDeudasColor = totalDeudas > 0 ? 'text-red-400' : 'text-gray-400';
  const formatYAxis = (t) => { /* ... */ if (loadingSettings) return '...'; if (Math.abs(t) >= 1000000) return `${(t / 1000000).toFixed(1)}M`; if (Math.abs(t) >= 1000) return `${(t / 1000).toFixed(0)}K`; return t.toString(); };

  // Clases CSS
  const labelClasses = "block text-sm font-medium text-gray-400 mb-1";
  const inputClasses = `block w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;

  return (
    <div className="space-y-8">
      {/* Saludo y Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> <div className="text-white"> <h1 className="text-3xl font-bold mb-1">¡Hola! 👋</h1> <p className="text-lg text-gray-400">Viendo resumen para el período en <span className='font-semibold'>{loadingSettings ? '...' : currency}</span>.</p> </div> <div className="flex flex-col sm:flex-row gap-3 items-end w-full sm:w-auto"> <div> <label htmlFor="dashFechaInicio" className={labelClasses}>Desde:</label> <input type="date" id="dashFechaInicio" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputClasses} disabled={cargando}/> </div> <div> <label htmlFor="dashFechaFin" className={labelClasses}>Hasta:</label> <input type="date" id="dashFechaFin" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className={inputClasses} min={fechaInicio} disabled={cargando}/> </div> </div> </div>

      {/* Mensaje de Error General */}
      {error && <p className="text-red-400 bg-gray-900 p-4 rounded-lg">{error}</p>}

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6"> <SummaryCard title="Patrimonio Neto" value={patrimonioNeto} colorClass={patrimonioNetoColor} isLoading={cargando} /> <SummaryCard title="Total Deudas" value={totalDeudas} colorClass={totalDeudasColor} isLoading={cargando} /> <SummaryCard title="Saldo Carteras" value={resumen.saldo_total_carteras} colorClass="text-blue-400" isLoading={cargando} /> <SummaryCard title="Ingresos Periodo" value={resumen.ingresos_periodo} colorClass="text-green-400" isLoading={cargando} /> <SummaryCard title="Egresos Periodo" value={resumen.egresos_periodo} colorClass="text-red-400" isLoading={cargando} /> <SummaryCard title="Balance Periodo" value={balancePeriodo} colorClass={balanceColor} isLoading={cargando} /> </div>

      {/* Contenedor Gráficos y Resúmenes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda */}
        <div className="space-y-8 lg:col-span-2">
          {/* Gráfico Barras */}
           <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-6 text-white">Tendencia Ingresos/Egresos (Últimos Meses)</h2> {cargando && <p className="text-blue-400 text-center py-10">Cargando...</p>} {!cargando && datosMensuales.length === 0 && !error && ( <p className="text-gray-500 text-center py-10">No hay datos.</p> )} {!cargando && datosMensuales.length > 0 && ( <div style={{ width: '100%', height: 300 }}> <ResponsiveContainer> <BarChart data={datosMensuales} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}> <CartesianGrid strokeDasharray="3 3" stroke="#374151" /> <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={12} /> <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={tooltipFormatter} /> <Tooltip formatter={tooltipFormatter} cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} itemStyle={{ color: '#D1D5DB' }}/> <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/> <Bar dataKey="total_ingresos" name="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} /> <Bar dataKey="total_egresos" name="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} /> </BarChart> </ResponsiveContainer> </div> )} </section>
          {/* Actividad Reciente */}
           <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white">Actividad Reciente</h2> {cargando && <p className="text-blue-400 text-sm">Cargando...</p>} {!cargando && ultimasTransacciones.length === 0 && !error && (<p className="text-gray-500 text-sm">No hay recientes.</p>)} {!cargando && ultimasTransacciones.length > 0 && ( <ul className="space-y-3"> {ultimasTransacciones.map(tx => ( <li key={tx.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-b-0 gap-2"> <div className='flex-1 min-w-0'> <p className="text-gray-300 truncate">{tx.descripcion || 'S/D'}</p> <p className="text-xs text-gray-500">{tx.categoria?.nombre || 'N/A'}</p> </div> <span className={`font-medium whitespace-nowrap ${tx.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}> {tx.tipo === 'Ingreso' ? '+' : '-'} {formatearMonedaLocal(Math.abs(tx.monto))} </span> </li> ))} </ul> )} </section>
        </div>
        {/* Columna Derecha */}
        <div className="space-y-8 lg:col-span-1">
          {/* Gráfico Tendencia Patrimonio Neto */}
          <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-white">Tendencia Patrimonio Neto</h2>
              {cargando && <p className="text-blue-400 text-center py-10">Cargando...</p>}
              {!cargando && datosPatrimonio.length === 0 && !error && ( <p className="text-gray-500 text-center py-10">No hay datos suficientes.</p> )}
              {!cargando && datosPatrimonio.length > 0 && (
                  <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                          <LineChart data={datosPatrimonio} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={11} />
                              <YAxis stroke="#9CA3AF" fontSize={11} tickFormatter={formatYAxis} />
                              <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} itemStyle={{ color: '#D1D5DB' }}/>
                              <Line type="monotone" dataKey="PatrimonioEstimado" name="Patrimonio Neto" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              )}
          </section>
          {/* Próximas Recurrencias */}
           <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white">Próximas Recurrencias</h2> {cargando && <p>...</p>} {!cargando && proximasRecurrencias.length > 0 && ( <ul className="space-y-3"> {proximasRecurrencias.map(rec => ( <li key={rec.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-b-0 gap-2"> <div className='flex-1 min-w-0'> <p className="text-gray-300 truncate">{rec.descripcion || 'Rec'}</p> <p className="text-xs text-gray-500">Próx: {formatFechaCorta(rec.proxima_fecha)}</p> </div> <span className={`font-medium whitespace-nowrap ${rec.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}> {rec.tipo === 'Ingreso' ? '+' : '-'} {formatearMonedaLocal(Math.abs(rec.monto))} </span> </li> ))} </ul> )} {!cargando && proximasRecurrencias.length === 0 && !error && (<p className="text-gray-500 text-sm">No hay próximas.</p>)}</section>
          {/* Resumen Presupuestos */}
           <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white">Presupuestos ({formatFechaCorta(fechaInicio)} - {formatFechaCorta(fechaFin)})</h2> {cargando && <p>...</p>} {!cargando && resumenPresupuestos.length > 0 && ( <ul className="space-y-3"> {resumenPresupuestos.map((pres, index) => { const p = Math.max(0, parseFloat(pres.progreso) || 0); const pD = Math.min(p, 100); const pC = p < 75 ? 'bg-green-500' : p < 95 ? 'bg-yellow-500' : 'bg-red-500'; return ( <li key={index} className="text-sm"> <div className="flex justify-between mb-1"> <span className="text-gray-300 truncate">{pres.categoria_nombre}</span> <span className="text-gray-400">{p.toFixed(0)}%</span> </div> <div className="w-full bg-gray-600 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pC}`} style={{ width: `${pD}%` }}></div></div> <div className="flex justify-between text-xs text-gray-500 mt-1"> <span>Gast: {formatearMonedaLocal(pres.gasto_real_periodo)}</span> <span>Pres: {formatearMonedaLocal(pres.monto)}</span> </div> </li> ); })} </ul> )} {!cargando && resumenPresupuestos.length === 0 && !error && (<p className="text-gray-500 text-sm">Sin presupuestos activos.</p>)}</section>
          {/* Resumen Objetivos */}
          <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white">Progreso Objetivos</h2> {cargando && <p>...</p>} {!cargando && resumenObjetivos.length > 0 && ( <ul className="space-y-3"> {resumenObjetivos.map((obj, index) => { const p = Math.max(0, parseFloat(obj.progreso) || 0); const pD = Math.min(p, 100); const pC = p < 75 ? 'bg-green-500' : p < 95 ? 'bg-yellow-500' : 'bg-red-500'; return( <li key={index} className="text-sm"> <div className="flex justify-between mb-1"> <span className="text-gray-300 truncate">{obj.nombre}</span> <span className="text-gray-400">{p.toFixed(0)}%</span> </div> <div className="w-full bg-gray-600 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pC}`} style={{ width: `${pD}%` }}></div></div> <div className="flex justify-between text-xs text-gray-500 mt-1"> <span>Ahorrado: {formatearMonedaLocal(obj.monto_actual)}</span> <span>Meta: {formatearMonedaLocal(obj.monto_objetivo)}</span> </div> </li> ); })} </ul> )} {!cargando && resumenObjetivos.length === 0 && !error && (<p className="text-gray-500 text-sm">Sin objetivos activos.</p>)}</section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
