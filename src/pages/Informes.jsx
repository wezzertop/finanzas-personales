// Archivo: src/pages/Informes.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { obtenerEgresosFiltrados, obtenerInformeFlujoMensual, obtenerComparacionMensual } from '../lib/informesApi';
import { obtenerCategorias } from '../lib/categoriasApi';
import { obtenerCarteras } from '../lib/carterasApi';
import TransactionList from '../components/TransactionList'; // Importamos TransactionList
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Iconos SVG Inline ---
const FileTextIcon = ({ className = "page-title-icon" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const BarChartIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
);
const GitCompareIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" /></svg>
);
// --- Fin Iconos SVG Inline ---

const getDefaultDateRange = () => { const t = new Date(); const f = new Date(t.getFullYear(), t.getMonth(), 1).toLocaleDateString('sv-SE'); const l = new Date(t.getFullYear(), t.getMonth() + 1, 0).toLocaleDateString('sv-SE'); return { inicio: f, fin: l }; };
const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };
const getInicioAnioActual = () => new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('sv-SE');
const getFinAnioActual = () => new Date(new Date().getFullYear(), 11, 31).toLocaleDateString('sv-SE');
const getPrimerDiaMes = (date) => new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('sv-SE');
const getMesAnterior = (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1);

function Informes({ session }) {
    const { currency, loadingSettings } = useSettings();

    const [fechaInicioGastos, setFechaInicioGastos] = useState(getDefaultDateRange().inicio);
    const [fechaFinGastos, setFechaFinGastos] = useState(getDefaultDateRange().fin);
    const [selectedCategoriaIdGastos, setSelectedCategoriaIdGastos] = useState('');
    const [selectedCarteraIdGastos, setSelectedCarteraIdGastos] = useState('');
    const [tagsStringFiltro, setTagsStringFiltro] = useState('');
    const [datosInformeGastos, setDatosInformeGastos] = useState([]);
    const [cargandoInformeGastos, setCargandoInformeGastos] = useState(false);
    const [errorInformeGastos, setErrorInformeGastos] = useState(null);
    const [informeGastosGenerado, setInformeGastosGenerado] = useState(false);

    const [fechaInicioFlujo, setFechaInicioFlujo] = useState(getInicioAnioActual());
    const [fechaFinFlujo, setFechaFinFlujo] = useState(getFinAnioActual());
    const [datosFlujoCaja, setDatosFlujoCaja] = useState([]);
    const [cargandoFlujoCaja, setCargandoFlujoCaja] = useState(false);
    const [errorFlujoCaja, setErrorFlujoCaja] = useState(null);
    const [informeFlujoGenerado, setInformeFlujoGenerado] = useState(false);

    const [mes1Comparacion, setMes1Comparacion] = useState(getPrimerDiaMes(getMesAnterior(new Date())));
    const [mes2Comparacion, setMes2Comparacion] = useState(getPrimerDiaMes(new Date()));
    const [datosComparacion, setDatosComparacion] = useState(null);
    const [cargandoComparacion, setCargandoComparacion] = useState(false);
    const [errorComparacion, setErrorComparacion] = useState(null);
    const [informeComparacionGenerado, setInformeComparacionGenerado] = useState(false);

    const [categoriasEgreso, setCategoriasEgreso] = useState([]);
    const [carteras, setCarteras] = useState([]);
    const [loadingRefs, setLoadingRefs] = useState(true);

    const baseLabelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
    const baseInputClasses = "block w-full px-3.5 py-2.5 bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm shadow-sm focus:ring-2 focus:ring-brand-accent-primary focus:border-brand-accent-primary disabled:opacity-60";
    const baseSelectClasses = `${baseInputClasses} appearance-none pr-10`;
    const baseButtonClasses = (color = 'indigo', size = 'md') =>
        `inline-flex items-center justify-center px-${size === 'sm' ? 3 : 5} py-${size === 'sm' ? '1.5' : '2.5'} border border-transparent rounded-lg shadow-md text-${size === 'sm' ? 'xs' : 'sm'} font-semibold text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed
        ${color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : ''}
        ${color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : ''}
        `;
    const tableHeaderClasses = "px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider";
    const tableCellClasses = "px-4 py-3 whitespace-nowrap text-sm"; // Ajustado padding para consistencia

    const cargarReferencias = useCallback(async () => { /* ... (sin cambios) ... */ }, [session]);
    useEffect(() => { cargarReferencias(); }, [cargarReferencias]);

    const handleGenerarInformeGastos = useCallback(async () => { /* ... (sin cambios) ... */ }, [session, fechaInicioGastos, fechaFinGastos, selectedCategoriaIdGastos, selectedCarteraIdGastos, tagsStringFiltro]);
    const handleGenerarInformeFlujo = useCallback(async () => { /* ... (sin cambios) ... */ }, [session, fechaInicioFlujo, fechaFinFlujo]);
    const handleGenerarComparacion = useCallback(async () => { /* ... (sin cambios) ... */ }, [session, mes1Comparacion, mes2Comparacion]);

    const formatearMonedaLocal = useCallback((m) => { if (loadingSettings || typeof m !== 'number' || isNaN(m)) return '---'; return m.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);
    const tooltipFormatterFlujo = useCallback((v) => { if (loadingSettings || typeof v !== 'number') return '---'; return v.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }, [currency, loadingSettings]);
    const formatYAxisFlujo = (t) => { if (loadingSettings) return '...'; if (Math.abs(t) >= 1000000) return `${(t / 1000000).toFixed(1)}M`; if (Math.abs(t) >= 1000) return `${(t / 1000).toFixed(0)}K`; return t.toString(); };
    const totalEgresosInforme = useMemo(() => datosInformeGastos.reduce((sum, tx) => sum + (parseFloat(tx.monto) || 0), 0), [datosInformeGastos]);
    const flujoChartColors = { ingresos: "#22C55E", egresos: "#EF4444", flujoNeto: "#3B82F6" };

    return (
        <div className="space-y-8">
            <h1 className="page-title"> <FileTextIcon /> Informes Financieros </h1>

            <section className="card-base">
                <h2 className="text-xl font-semibold mb-1 text-slate-100">Comparación Mensual</h2>
                <p className="text-sm text-slate-400 mb-6">Analiza ingresos y egresos entre dos meses.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 items-end mb-6">
                    <div> <label htmlFor="mes1Comp" className={baseLabelClasses}>Mes 1</label> <input type="month" id="mes1Comp" value={mes1Comparacion.substring(0, 7)} onChange={(e) => setMes1Comparacion(getPrimerDiaMes(new Date(e.target.value + '-02')))} required className={baseInputClasses} disabled={cargandoComparacion}/> </div>
                    <div> <label htmlFor="mes2Comp" className={baseLabelClasses}>Mes 2</label> <input type="month" id="mes2Comp" value={mes2Comparacion.substring(0, 7)} onChange={(e) => setMes2Comparacion(getPrimerDiaMes(new Date(e.target.value + '-02')))} required className={baseInputClasses} disabled={cargandoComparacion}/> </div>
                    <div className="sm:pt-6"> <button onClick={handleGenerarComparacion} className={`${baseButtonClasses('purple')} w-full`} disabled={cargandoComparacion || !mes1Comparacion || !mes2Comparacion || mes1Comparacion === mes2Comparacion}> {cargandoComparacion ? 'Comparando...' : <><GitCompareIcon className="mr-2 w-4 h-4"/> Comparar Meses</>} </button> </div> {/* Icono con tamaño */}
                </div>
                {errorComparacion && !cargandoComparacion && <p className="text-red-400 bg-red-900/20 p-2 rounded-md mt-4 text-sm">{errorComparacion}</p>}
                {informeComparacionGenerado && !cargandoComparacion && datosComparacion && (
                    <div className="overflow-x-auto mt-4 border border-slate-700 rounded-lg">
                        <table className="w-full min-w-max text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                                <tr>
                                    <th scope="col" className={tableHeaderClasses}>Concepto</th>
                                    <th scope="col" className={`${tableHeaderClasses} text-right`}>{mes1Comparacion.substring(0, 7)}</th>
                                    <th scope="col" className={`${tableHeaderClasses} text-right`}>{mes2Comparacion.substring(0, 7)}</th>
                                    <th scope="col" className={`${tableHeaderClasses} text-right`}>Diferencia</th>
                                    <th scope="col" className={`${tableHeaderClasses} text-right`}>% Cambio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                <tr className="font-semibold text-slate-100"><td className={`${tableCellClasses} py-2.5`}>Ingresos Totales</td><td className={`${tableCellClasses} py-2.5 text-right text-green-400`}>{formatearMonedaLocal(datosComparacion.mes1.totalIngresos)}</td><td className={`${tableCellClasses} py-2.5 text-right text-green-400`}>{formatearMonedaLocal(datosComparacion.mes2.totalIngresos)}</td><td className={`${tableCellClasses} py-2.5 text-right ${datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos)}</td><td className={`${tableCellClasses} py-2.5 text-right ${datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos >= 0 ? 'text-green-400' : 'text-red-400'}`}>{datosComparacion.mes1.totalIngresos !== 0 ? `${((datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos) / datosComparacion.mes1.totalIngresos * 100).toFixed(1)}%` : 'N/A'}</td></tr>
                                <tr className="font-semibold text-slate-100"><td className={`${tableCellClasses} py-2.5`}>Egresos Totales</td><td className={`${tableCellClasses} py-2.5 text-right text-red-400`}>{formatearMonedaLocal(datosComparacion.mes1.totalEgresos)}</td><td className={`${tableCellClasses} py-2.5 text-right text-red-400`}>{formatearMonedaLocal(datosComparacion.mes2.totalEgresos)}</td><td className={`${tableCellClasses} py-2.5 text-right ${datosComparacion.mes2.totalEgresos <= datosComparacion.mes1.totalEgresos ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(datosComparacion.mes2.totalEgresos - datosComparacion.mes1.totalEgresos)}</td><td className={`${tableCellClasses} py-2.5 text-right ${datosComparacion.mes2.totalEgresos <= datosComparacion.mes1.totalEgresos ? 'text-green-400' : 'text-red-400'}`}>{datosComparacion.mes1.totalEgresos !== 0 ? `${((datosComparacion.mes2.totalEgresos - datosComparacion.mes1.totalEgresos) / datosComparacion.mes1.totalEgresos * 100).toFixed(1)}%` : 'N/A'}</td></tr>
                                <tr className="font-bold text-slate-50 bg-slate-700/30"><td className={`${tableCellClasses} py-2.5`}>Flujo Neto</td><td className={`${tableCellClasses} py-2.5 text-right ${datosComparacion.mes1.totalIngresos - datosComparacion.mes1.totalEgresos >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatearMonedaLocal(datosComparacion.mes1.totalIngresos - datosComparacion.mes1.totalEgresos)}</td><td className={`${tableCellClasses} py-2.5 text-right ${datosComparacion.mes2.totalIngresos - datosComparacion.mes2.totalEgresos >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatearMonedaLocal(datosComparacion.mes2.totalIngresos - datosComparacion.mes2.totalEgresos)}</td><td colSpan={2}></td></tr>
                                {datosComparacion.categoriasUnicas.map(catNombre => { const m1 = datosComparacion.mes1.categorias[catNombre] || 0; const m2 = datosComparacion.mes2.categorias[catNombre] || 0; const diff = m2 - m1; const cPct = m1 !== 0 ? `${((diff / m1) * 100).toFixed(1)}%` : (m2 > 0 ? '+Inf%' : 'N/A'); const dCol = diff <= 0 ? 'text-green-400' : 'text-red-400'; return ( <tr key={catNombre} className="hover:bg-slate-700/20"><td className={`${tableCellClasses} py-2 pl-6 text-slate-300`}>{catNombre}</td><td className={`${tableCellClasses} py-2 text-right`}>{formatearMonedaLocal(m1)}</td><td className={`${tableCellClasses} py-2 text-right`}>{formatearMonedaLocal(m2)}</td><td className={`${tableCellClasses} py-2 text-right ${dCol}`}>{formatearMonedaLocal(diff)}</td><td className={`${tableCellClasses} py-2 text-right ${dCol}`}>{cPct}</td></tr> ); })}
                            </tbody>
                        </table>
                    </div>
                )}
                {informeComparacionGenerado && !cargandoComparacion && !datosComparacion && !errorComparacion && (<p className="text-slate-500 mt-4">No se encontraron datos para la comparación.</p>)}
            </section>

            <section className="card-base">
                <h2 className="text-xl font-semibold mb-1 text-slate-100">Gastos Detallados por Filtro</h2>
                <p className="text-sm text-slate-400 mb-6">Explora tus egresos con filtros específicos.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-4 items-end mb-6">
                    <div><label htmlFor="fechaInicioInforme" className={baseLabelClasses}>Desde</label><input type="date" id="fechaInicioInforme" value={fechaInicioGastos} onChange={(e) => setFechaInicioGastos(e.target.value)} required className={baseInputClasses} /></div>
                    <div><label htmlFor="fechaFinInforme" className={baseLabelClasses}>Hasta</label><input type="date" id="fechaFinInforme" value={fechaFinGastos} onChange={(e) => setFechaFinGastos(e.target.value)} required className={baseInputClasses} min={fechaInicioGastos} /></div>
                    <div><label htmlFor="filtroCategoria" className={baseLabelClasses}>Categoría</label><select id="filtroCategoria" value={selectedCategoriaIdGastos} onChange={(e) => setSelectedCategoriaIdGastos(e.target.value)} className={baseSelectClasses} disabled={loadingRefs}><option value="">-- Todas --</option>{loadingRefs ? <option>Cargando...</option> : categoriasEgreso.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}</select></div>
                    <div><label htmlFor="filtroCartera" className={baseLabelClasses}>Cartera</label><select id="filtroCartera" value={selectedCarteraIdGastos} onChange={(e) => setSelectedCarteraIdGastos(e.target.value)} className={baseSelectClasses} disabled={loadingRefs}><option value="">-- Todas --</option>{loadingRefs ? <option>Cargando...</option> : carteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)}</select></div>
                    <div className="lg:col-span-1 xl:col-span-1"><label htmlFor="filtroTags" className={baseLabelClasses}>Etiquetas</label><input type="text" id="filtroTags" value={tagsStringFiltro} onChange={(e) => setTagsStringFiltro(e.target.value)} placeholder="Ej: viaje, urgente" className={baseInputClasses} /></div>
                    <div className="lg:col-span-1 xl:col-span-1 sm:pt-6"><button onClick={handleGenerarInformeGastos} className={`${baseButtonClasses('blue')} w-full`} disabled={cargandoInformeGastos || loadingRefs}> {cargandoInformeGastos ? 'Generando...' : <><BarChartIcon className="mr-2 w-4 h-4"/> Ver Gastos</>}</button></div> {/* Icono con tamaño */}
                </div>
                {errorInformeGastos && !cargandoInformeGastos && <p className="text-red-400 bg-red-900/20 p-2 rounded-md mt-4 text-sm">{errorInformeGastos}</p>}
                {informeGastosGenerado && !cargandoInformeGastos && (
                    <>
                        {datosInformeGastos.length === 0 && !errorInformeGastos && (<p className="text-slate-500 mt-4">No se encontraron egresos con los filtros aplicados.</p>)}
                        {datosInformeGastos.length > 0 && (
                            <TransactionList transacciones={datosInformeGastos} onEdit={() => {}} onDelete={() => {}} />
                        )}
                        {datosInformeGastos.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-700 text-right">
                                <span className="text-sm text-slate-400">Total del Periodo Filtrado: </span>
                                <span className="text-md font-semibold text-red-400">{formatearMonedaLocal(totalEgresosInforme)}</span>
                            </div>
                        )}
                    </>
                )}
            </section>

            <section className="card-base">
                <h2 className="text-xl font-semibold mb-1 text-slate-100">Flujo de Caja Mensual</h2>
                <p className="text-sm text-slate-400 mb-6">Visualiza tus ingresos, egresos y flujo neto a lo largo del tiempo.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 items-end mb-6">
                    <div><label htmlFor="fechaInicioFlujo" className={baseLabelClasses}>Desde</label><input type="date" id="fechaInicioFlujo" value={fechaInicioFlujo} onChange={(e) => setFechaInicioFlujo(e.target.value)} required className={baseInputClasses} /></div>
                    <div><label htmlFor="fechaFinFlujo" className={baseLabelClasses}>Hasta</label><input type="date" id="fechaFinFlujo" value={fechaFinFlujo} onChange={(e) => setFechaFinFlujo(e.target.value)} required className={baseInputClasses} min={fechaInicioFlujo} /></div>
                    <div className="sm:pt-6"><button onClick={handleGenerarInformeFlujo} className={`${baseButtonClasses('blue')} w-full`} disabled={cargandoFlujoCaja}> {cargandoFlujoCaja ? 'Generando...' : <><BarChartIcon className="mr-2 w-4 h-4"/> Ver Flujo</>}</button></div> {/* Icono con tamaño */}
                </div>
                {errorFlujoCaja && !cargandoFlujoCaja && <p className="text-red-400 bg-red-900/20 p-2 rounded-md mt-4 text-sm">{errorFlujoCaja}</p>}
                {!cargandoFlujoCaja && informeFlujoGenerado && (
                    <>
                        {datosFlujoCaja.length === 0 && !errorFlujoCaja && (<p className="text-slate-500 mt-4">No hay datos de flujo de caja para el periodo seleccionado.</p>)}
                        {datosFlujoCaja.length > 0 && (
                            <div className="space-y-8 mt-4">
                                <div className="w-full h-[350px]">
                                    <ResponsiveContainer>
                                        <LineChart data={datosFlujoCaja} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#475569" />
                                            <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} tickMargin={5}/>
                                            <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={formatYAxisFlujo} tickMargin={5}/>
                                            <Tooltip formatter={tooltipFormatterFlujo} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '0.5rem' }} itemStyle={{ color: '#E2E8F0' }} labelStyle={{ color: '#94A3B8', fontWeight: '500' }}/>
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Line type="monotone" dataKey="Ingresos" stroke={flujoChartColors.ingresos} strokeWidth={2.5} dot={{ r: 4, fill: flujoChartColors.ingresos }} activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: flujoChartColors.ingresos }} />
                                            <Line type="monotone" dataKey="Egresos" stroke={flujoChartColors.egresos} strokeWidth={2.5} dot={{ r: 4, fill: flujoChartColors.egresos }} activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: flujoChartColors.egresos }} />
                                            <Line type="monotone" dataKey="FlujoNeto" name="Flujo Neto" stroke={flujoChartColors.flujoNeto} strokeWidth={3} dot={{ r: 5, fill: flujoChartColors.flujoNeto }} activeDot={{ r: 7, strokeWidth: 2, fill: '#fff', stroke: flujoChartColors.flujoNeto }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="overflow-x-auto border border-slate-700 rounded-lg">
                                    <table className="w-full min-w-max text-sm text-left text-slate-300">
                                        <thead className="text-xs text-slate-400 uppercase bg-slate-700/50"><tr><th scope="col" className={tableHeaderClasses}>Mes</th><th scope="col" className={`${tableHeaderClasses} text-right`}>Ingresos</th><th scope="col" className={`${tableHeaderClasses} text-right`}>Egresos</th><th scope="col" className={`${tableHeaderClasses} text-right`}>Flujo Neto</th></tr></thead>
                                        <tbody className="divide-y divide-slate-700">{datosFlujoCaja.map((item) => (<tr key={item.mes} className="hover:bg-slate-700/30"><td className={`${tableCellClasses} font-medium text-slate-100`}>{item.mes}</td><td className={`${tableCellClasses} text-right text-green-400`}>{formatearMonedaLocal(item.Ingresos)}</td><td className={`${tableCellClasses} text-right text-red-400`}>{formatearMonedaLocal(item.Egresos)}</td><td className={`${tableCellClasses} text-right font-medium ${item.FlujoNeto >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatearMonedaLocal(item.FlujoNeto)}</td></tr>))}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

export default Informes;
