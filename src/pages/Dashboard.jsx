// Archivo: src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    obtenerResumenFinanciero, obtenerResumenMensual, obtenerResumenPresupuestos,
    obtenerResumenObjetivos, obtenerPatrimonioNeto, obtenerTotalDeudas
} from '../lib/dashboardApi';
import { obtenerUltimasTransacciones } from '../lib/transaccionesApi';
import { obtenerProximasRecurrencias } from '../lib/recurringTransactionsApi';
import { useSettings } from '../context/SettingsContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// --- Iconos SVG Inline ---
const LayoutDashboardIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
);
const LandmarkIcon = ({ className = "w-7 h-7" }) => ( // Para Patrimonio Neto
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
);
const AlertTriangleIcon = ({ className = "w-7 h-7" }) => ( // Para Total Deudas
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const WalletIcon = ({ className = "w-7 h-7" }) => ( // Para Saldo Carteras
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 7V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M3 5h18"/><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
);
const ArrowUpCircleIcon = ({ className = "w-7 h-7" }) => ( // Para Ingresos
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
);
const ArrowDownCircleIcon = ({ className = "w-7 h-7" }) => ( // Para Egresos
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
);
const ScaleIcon = ({ className = "w-7 h-7" }) => ( // Para Balance
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 16.5L12 12.5 8 16.5"/><path d="M12 3v9"/><path d="M21 12H3"/><path d="M12 21a9 9 0 0 0 0-18 9 9 0 0 0 0 18Z"/></svg>
);
const ActivityIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> );
const CalendarClockIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5c.621.872 1.5 1.5 2.5 1.5a2.5 2.5 0 0 0 2.5-2.5V15"/><path d="M22 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></svg> );
const ClipboardListIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg> );
const GoalIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 13V2l8 4-8 4"/><path d="M12 22v-8.5"/><path d="M20 12v8.5a2.5 2.5 0 0 1-5 0V12"/><path d="M4 12v8.5a2.5 2.5 0 0 0 5 0V12"/><path d="M12 13a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg> );
// --- Fin Iconos SVG Inline ---

// Componente SummaryCard Refactorizado
function SummaryCard({ title, value, icon, colorClass = 'text-brand-accent-primary', isLoading }) {
  const { currency, loadingSettings } = useSettings();
  const formatearMoneda = useCallback((monto) => {
    if (loadingSettings || isLoading || typeof monto !== 'number' || isNaN(monto)) return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings, isLoading]);

  return (
    <div className="card-base flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-slate-400 uppercase">{title}</h3>
        {icon && <span className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>{icon}</span>}
      </div>
      {isLoading || loadingSettings ? (
        <div className="mt-1 h-8 bg-slate-700 rounded animate-pulse w-3/4"></div>
      ) : (
        <p className={`text-3xl lg:text-4xl font-bold ${colorClass} truncate`}>
          {formatearMoneda(value)}
        </p>
      )}
    </div>
  );
}

const formatFechaCorta = (f) => { if (!f) return 'N/A'; try { return new Date(f + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); } catch { return 'Inv.'; } }; // Removed _e
const getInicioMesActual = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('sv-SE');
const getFinMesActual = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('sv-SE');

function Dashboard({ session }) {
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

  // Clases de Tailwind reutilizables
  const baseLabelClasses = "block text-xs font-medium text-slate-400 mb-1";
  const baseInputClasses = "block w-full px-3 py-2 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
  const sectionTitleClasses = "text-xl font-semibold text-slate-100 mb-1 flex items-center";


  const cargarDatosDashboard = useCallback(async () => {
    if (!session?.user?.id || !fechaInicio || !fechaFin) return;
    setCargando(true); setError(null); const errors = [];
    const handlePromise = async (promise, name) => { try { const result = await promise; if (result.error) { errors.push(`Error ${name}: ${result.error.message}`); return { data: null }; } return result; } catch (catchError) { errors.push(`Catch ${name}: ${catchError.message}`); return { data: null }; } };
    try {
      const numMesesGraficoBarras = 6; const numMesesGraficoPatrimonio = 12;
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
      const [resumenData, resMensualBarrasData, ultimasTxData, proximasRecData, resPresupuestosData, resObjetivosData, resPatrimonioData, resTotalDeudasData, resMensualPatrimonioData] = results;
      setResumen(resumenData.data || { saldo_total_carteras: 0, ingresos_periodo: 0, egresos_periodo: 0 });
      const fMB = (resMensualBarrasData.data || []).map(d => ({ ...d, total_ingresos: parseFloat(d.total_ingresos) || 0, total_egresos: parseFloat(d.total_egresos) || 0, })); setDatosMensuales(fMB);
      setUltimasTransacciones(ultimasTxData.data || []); setProximasRecurrencias(proximasRecData.data || []); setResumenPresupuestos(resPresupuestosData.data || []); setResumenObjetivos(resObjetivosData.data || []);
      const currentNetWorth = resPatrimonioData.data ?? 0; setPatrimonioNeto(currentNetWorth); setTotalDeudas(resTotalDeudasData.data ?? 0);
      if (resMensualPatrimonioData.data) {
        const flujoMensualHistorial = (resMensualPatrimonioData.data).map(d => ({ mes: d.mes, flujoNeto: (parseFloat(d.total_ingresos) || 0) - (parseFloat(d.total_egresos) || 0) })).sort((a, b) => a.mes.localeCompare(b.mes));
        let patrimonioEstimado = currentNetWorth;
        const historialPatrimonio = flujoMensualHistorial.map((_, index) => { const indiceInverso = flujoMensualHistorial.length - 1 - index; const mesActual = flujoMensualHistorial[indiceInverso]; if (index !== 0) { const mesSiguiente = flujoMensualHistorial[indiceInverso + 1]; patrimonioEstimado = patrimonioEstimado - mesSiguiente.flujoNeto; } return { mes: mesActual.mes, PatrimonioEstimado: patrimonioEstimado }; }).reverse();
        setDatosPatrimonio(historialPatrimonio);
      } else { setDatosPatrimonio([]); }
      if (errors.length > 0) { setError(errors.join('; ')); }
    } catch (generalError) { setError(`Error inesperado: ${generalError?.message || 'Desconocido'}`); setResumen({ saldo_total_carteras: 0, ingresos_periodo: 0, egresos_periodo: 0 }); setDatosMensuales([]); setUltimasTransacciones([]); setProximasRecurrencias([]); setResumenPresupuestos([]); setResumenObjetivos([]); setPatrimonioNeto(0); setTotalDeudas(0); setDatosPatrimonio([]); }
    finally { setCargando(false); }
  }, [session, fechaInicio, fechaFin]);

  useEffect(() => { cargarDatosDashboard(); }, [cargarDatosDashboard]);

  const tooltipFormatter = useCallback((value) => { if (loadingSettings || typeof value !== 'number') return '---'; return value.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }, [currency, loadingSettings]);
  const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---'; return monto.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);
  const balancePeriodo = resumen.ingresos_periodo - resumen.egresos_periodo;
  const balanceColor = balancePeriodo >= 0 ? 'text-green-400' : 'text-red-400';
  const patrimonioNetoColor = patrimonioNeto >= 0 ? 'text-green-400' : 'text-red-400';
  const totalDeudasColor = totalDeudas > 0 ? 'text-red-400' : 'text-slate-400'; // Gris si no hay deudas
  const formatYAxis = (tickItem) => { if (loadingSettings) return '...'; if (Math.abs(tickItem) >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`; if (Math.abs(tickItem) >= 1000) return `${(tickItem / 1000).toFixed(0)}K`; return tickItem.toString(); };

  // Colores para gráficos de barras
  const barColors = { ingresos: "#22C55E", egresos: "#EF4444" }; // green-500, red-500

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="page-title !mb-0"> <LayoutDashboardIcon /> Dashboard </h1>
        <div className="flex flex-col sm:flex-row gap-3 items-end w-full sm:w-auto">
          <div> <label htmlFor="dashFechaInicio" className={baseLabelClasses}>Desde:</label> <input type="date" id="dashFechaInicio" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={baseInputClasses} disabled={cargando}/> </div>
          <div> <label htmlFor="dashFechaFin" className={baseLabelClasses}>Hasta:</label> <input type="date" id="dashFechaFin" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className={baseInputClasses} min={fechaInicio} disabled={cargando}/> </div>
        </div>
      </div>
      <p className="text-base text-slate-400 -mt-4">Viendo resumen para el período en <span className='font-semibold text-slate-300'>{loadingSettings ? '...' : currency}</span>.</p>

      {error && <p className="card-base bg-red-900/20 border-red-700 text-red-300" role="alert">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5"> {/* Ajustado a 3 para mejor distribución */}
        <SummaryCard title="Patrimonio Neto" value={patrimonioNeto} icon={<LandmarkIcon />} colorClass={patrimonioNetoColor} isLoading={cargando} />
        <SummaryCard title="Saldo Carteras" value={resumen.saldo_total_carteras} icon={<WalletIcon />} colorClass="text-blue-400" isLoading={cargando} />
        <SummaryCard title="Total Deudas" value={totalDeudas} icon={<AlertTriangleIcon />} colorClass={totalDeudasColor} isLoading={cargando} />
        <SummaryCard title="Ingresos del Periodo" value={resumen.ingresos_periodo} icon={<ArrowUpCircleIcon />} colorClass="text-green-400" isLoading={cargando} />
        <SummaryCard title="Egresos del Periodo" value={resumen.egresos_periodo} icon={<ArrowDownCircleIcon />} colorClass="text-red-400" isLoading={cargando} />
        <SummaryCard title="Balance del Periodo" value={balancePeriodo} icon={<ScaleIcon />} colorClass={balanceColor} isLoading={cargando} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card-base lg:col-span-2">
          <h2 className={sectionTitleClasses + " mb-6"}>Tendencia Ingresos/Egresos (Últimos Meses)</h2>
          {cargando && <div className="h-72 flex items-center justify-center text-slate-400">Cargando gráfico...</div>}
          {!cargando && datosMensuales.length === 0 && !error && ( <p className="text-slate-500 text-center py-10">No hay datos suficientes para mostrar la tendencia.</p> )}
          {!cargando && datosMensuales.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosMensuales} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#475569" /> {/* slate-600 */}
                <XAxis dataKey="mes" stroke="#94A3B8" fontSize={12} tickMargin={5} /> {/* slate-400 */}
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={formatYAxis} tickMargin={5} />
                <Tooltip formatter={tooltipFormatter} cursor={{ fill: 'rgba(71, 85, 105, 0.3)' }} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }} itemStyle={{ color: '#E2E8F0' }} labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '4px' }}/>
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }} />
                <Bar dataKey="total_ingresos" name="Ingresos" fill={barColors.ingresos} radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="total_egresos" name="Egresos" fill={barColors.egresos} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="card-base lg:col-span-1">
          <h2 className={sectionTitleClasses + " mb-6"}>Tendencia Patrimonio Neto</h2>
          {cargando && <div className="h-72 flex items-center justify-center text-slate-400">Cargando gráfico...</div>}
          {!cargando && datosPatrimonio.length === 0 && !error && ( <p className="text-slate-500 text-center py-10">No hay datos suficientes.</p> )}
          {!cargando && datosPatrimonio.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosPatrimonio} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#475569" />
                <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} tickMargin={5}/>
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={formatYAxis} domain={['auto', 'auto']} tickMargin={5}/>
                <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '0.5rem' }} itemStyle={{ color: '#E2E8F0' }} labelStyle={{ color: '#94A3B8', fontWeight: '500', marginBottom: '4px' }}/>
                <Line type="monotone" dataKey="PatrimonioEstimado" name="Patrimonio Neto" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1, fill: '#8B5CF6' }} activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#8B5CF6' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <section className="card-base">
          <h2 className={sectionTitleClasses + " mb-4"}><ActivityIcon className="mr-2 text-brand-accent-secondary"/>Actividad Reciente</h2>
          {cargando && <p className="text-slate-400 text-sm">Cargando...</p>}
          {!cargando && ultimasTransacciones.length === 0 && !error && (<p className="text-slate-500 text-sm">No hay transacciones recientes.</p>)}
          {!cargando && ultimasTransacciones.length > 0 && (
            <ul className="space-y-3">
              {ultimasTransacciones.map(tx => (
                <li key={tx.id} className="flex justify-between items-center text-sm border-b border-slate-700 pb-2.5 last:border-b-0 gap-2">
                  <div className='flex-1 min-w-0'>
                    <p className="text-slate-200 truncate font-medium" title={tx.descripcion || 'Sin descripción'}>{tx.descripcion || 'S/D'}</p>
                    <p className="text-xs text-slate-400">{tx.categoria?.nombre || (tx.tipo === 'Transferencia' ? 'Transferencia' : 'N/A')}</p>
                  </div>
                  <span className={`font-semibold whitespace-nowrap ${tx.tipo === 'Ingreso' ? 'text-green-400' : tx.tipo === 'Egreso' ? 'text-red-400' : 'text-blue-400'}`}>
                    {tx.tipo === 'Ingreso' ? '+' : tx.tipo === 'Egreso' ? '-' : ''} {formatearMonedaLocal(Math.abs(tx.monto))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-base">
          <h2 className={sectionTitleClasses + " mb-4"}><CalendarClockIcon className="mr-2 text-blue-400"/>Próximas Recurrencias</h2>
          {cargando && <p className="text-slate-400 text-sm">Cargando...</p>}
          {!cargando && proximasRecurrencias.length > 0 && (
            <ul className="space-y-3">
              {proximasRecurrencias.map(rec => (
                <li key={rec.id} className="flex justify-between items-center text-sm border-b border-slate-700 pb-2.5 last:border-b-0 gap-2">
                  <div className='flex-1 min-w-0'>
                    <p className="text-slate-200 truncate font-medium" title={rec.descripcion || 'Recurrencia'}>{rec.descripcion || 'Recurrencia'}</p>
                    <p className="text-xs text-slate-400">Próx: {formatFechaCorta(rec.proxima_fecha)}</p>
                  </div>
                  <span className={`font-semibold whitespace-nowrap ${rec.tipo === 'Ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                    {rec.tipo === 'Ingreso' ? '+' : '-'} {formatearMonedaLocal(Math.abs(rec.monto))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!cargando && proximasRecurrencias.length === 0 && !error && (<p className="text-slate-500 text-sm">No hay recurrencias próximas.</p>)}
        </section>

        <section className="card-base">
          <h2 className={sectionTitleClasses + " mb-4"}><ClipboardListIcon className="mr-2 text-amber-400"/>Presupuestos ({formatFechaCorta(fechaInicio)} - {formatFechaCorta(fechaFin)})</h2>
          {cargando && <p className="text-slate-400 text-sm">Cargando...</p>}
          {!cargando && resumenPresupuestos.length > 0 && (
            <ul className="space-y-3.5">
              {resumenPresupuestos.map((pres, index) => {
                const p = Math.max(0, parseFloat(pres.progreso) || 0); const pD = Math.min(p, 100);
                const pC = p < 75 ? 'bg-green-500' : p < 95 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <li key={index} className="text-sm">
                    <div className="flex justify-between mb-1 items-center">
                      <span className="text-slate-200 truncate font-medium" title={pres.categoria_nombre}>{pres.categoria_nombre}</span>
                      <span className="text-xs text-slate-400">{p.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full ${pC}`} style={{ width: `${pD}%` }}></div></div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Gastado: {formatearMonedaLocal(pres.gasto_real_periodo)}</span>
                      <span>Meta: {formatearMonedaLocal(pres.monto)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!cargando && resumenPresupuestos.length === 0 && !error && (<p className="text-slate-500 text-sm">Sin presupuestos activos para el periodo.</p>)}
        </section>

        <section className="card-base">
          <h2 className={sectionTitleClasses + " mb-4"}><GoalIcon className="mr-2 text-purple-400"/>Progreso Objetivos</h2>
          {cargando && <p className="text-slate-400 text-sm">Cargando...</p>}
          {!cargando && resumenObjetivos.length > 0 && (
            <ul className="space-y-3.5">
              {resumenObjetivos.map((obj, index) => {
                const p = Math.max(0, parseFloat(obj.progreso) || 0); const pD = Math.min(p, 100);
                const pC = p < 75 ? 'bg-brand-accent-primary' : p < 95 ? 'bg-yellow-500' : 'bg-green-500'; // Ajustado color progreso
                return(
                  <li key={index} className="text-sm">
                    <div className="flex justify-between mb-1 items-center">
                      <span className="text-slate-200 truncate font-medium" title={obj.nombre}>{obj.nombre}</span>
                      <span className="text-xs text-slate-400">{p.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full ${pC}`} style={{ width: `${pD}%` }}></div></div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Ahorrado: {formatearMonedaLocal(obj.monto_actual)}</span>
                      <span>Meta: {formatearMonedaLocal(obj.monto_objetivo)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!cargando && resumenObjetivos.length === 0 && !error && (<p className="text-slate-500 text-sm">Sin objetivos de ahorro activos.</p>)}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
