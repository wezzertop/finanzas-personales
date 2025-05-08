import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
// APIs
import { obtenerEgresosFiltrados, obtenerInformeFlujoMensual, obtenerComparacionMensual } from '../lib/informesApi';
import { obtenerCategorias } from '../lib/categoriasApi';
import { obtenerCarteras } from '../lib/carterasApi';
import TransactionItem from '../components/TransactionItem';
// Gráficos
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Funciones auxiliares de fecha
const getDefaultDateRange = () => { const t = new Date(); const f = new Date(t.getFullYear(), t.getMonth(), 1).toLocaleDateString('sv-SE'); const l = new Date(t.getFullYear(), t.getMonth() + 1, 0).toLocaleDateString('sv-SE'); return { inicio: f, fin: l }; };
const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };
const getInicioAnioActual = () => new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('sv-SE');
const getFinAnioActual = () => new Date(new Date().getFullYear(), 11, 31).toLocaleDateString('sv-SE');
const getPrimerDiaMes = (date) => new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('sv-SE');
const getMesAnterior = (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1);


function Informes({ session }) {
    const { currency, loadingSettings } = useSettings();

    // Estados Informe Gastos Detallado
    const [fechaInicioGastos, setFechaInicioGastos] = useState(getDefaultDateRange().inicio);
    const [fechaFinGastos, setFechaFinGastos] = useState(getDefaultDateRange().fin);
    const [selectedCategoriaIdGastos, setSelectedCategoriaIdGastos] = useState('');
    const [selectedCarteraIdGastos, setSelectedCarteraIdGastos] = useState('');
    const [tagsStringFiltro, setTagsStringFiltro] = useState('');
    const [datosInformeGastos, setDatosInformeGastos] = useState([]);
    const [cargandoInformeGastos, setCargandoInformeGastos] = useState(false);
    const [errorInformeGastos, setErrorInformeGastos] = useState(null);
    const [informeGastosGenerado, setInformeGastosGenerado] = useState(false);

    // Estados Informe Flujo de Caja Mensual
    const [fechaInicioFlujo, setFechaInicioFlujo] = useState(getInicioAnioActual());
    const [fechaFinFlujo, setFechaFinFlujo] = useState(getFinAnioActual());
    const [datosFlujoCaja, setDatosFlujoCaja] = useState([]);
    const [cargandoFlujoCaja, setCargandoFlujoCaja] = useState(false);
    const [errorFlujoCaja, setErrorFlujoCaja] = useState(null);
    const [informeFlujoGenerado, setInformeFlujoGenerado] = useState(false);

    // Estados Informe Comparación Mensual
    const [mes1Comparacion, setMes1Comparacion] = useState(getPrimerDiaMes(getMesAnterior(new Date())));
    const [mes2Comparacion, setMes2Comparacion] = useState(getPrimerDiaMes(new Date()));
    const [datosComparacion, setDatosComparacion] = useState(null); // Inicia como null
    const [cargandoComparacion, setCargandoComparacion] = useState(false);
    const [errorComparacion, setErrorComparacion] = useState(null);
    const [informeComparacionGenerado, setInformeComparacionGenerado] = useState(false);

    // Estados para listas de filtros
    const [categoriasEgreso, setCategoriasEgreso] = useState([]);
    const [carteras, setCarteras] = useState([]);
    const [loadingRefs, setLoadingRefs] = useState(true);

    // Cargar listas para filtros
    const cargarReferencias = useCallback(async () => { if (!session?.user?.id) return; setLoadingRefs(true); try { const [resCat, resCart] = await Promise.all([ obtenerCategorias('Egreso'), obtenerCarteras() ]); if (resCat.error || resCart.error) { throw new Error(`${resCat.error?.message || resCart.error?.message}`); } setCategoriasEgreso(resCat.data || []); setCarteras(resCart.data || []); } catch (err) { const eM = `Error filtros: ${err.message}`; setErrorInformeGastos(eM); setErrorFlujoCaja(eM); setErrorComparacion(eM); } finally { setLoadingRefs(false); } }, [session]);
    useEffect(() => { cargarReferencias(); }, [cargarReferencias]);

    // Generar Informe de Gastos Detallado
    const handleGenerarInformeGastos = useCallback(async () => { if(!session?.user?.id||!fechaInicioGastos||!fechaFinGastos){setErrorInformeGastos("Fechas.");return;} if(new Date(fechaFinGastos)<new Date(fechaInicioGastos)){setErrorInformeGastos("Fin<Ini.");return;} setCargandoInformeGastos(true);setErrorInformeGastos(null);setInformeGastosGenerado(false);const tA=tagsStringFiltro.split(',').map(t=>t.trim()).filter(t=>t!==''); try{const{data,error}=await obtenerEgresosFiltrados(fechaInicioGastos,fechaFinGastos,selectedCategoriaIdGastos||null,selectedCarteraIdGastos||null,tA.length>0?tA:null);if(error)throw error;setDatosInformeGastos(data||[]);setInformeGastosGenerado(true);}catch(e){setErrorInformeGastos(`Err:${e.message}`);setDatosInformeGastos([]);}finally{setCargandoInformeGastos(false);}}, [session, fechaInicioGastos, fechaFinGastos, selectedCategoriaIdGastos, selectedCarteraIdGastos, tagsStringFiltro]);

    // Generar Informe de Flujo de Caja Mensual
    const handleGenerarInformeFlujo = useCallback(async () => { if(!session?.user?.id||!fechaInicioFlujo||!fechaFinFlujo){setErrorFlujoCaja("Fechas.");return;} if(new Date(fechaFinFlujo)<new Date(fechaInicioFlujo)){setErrorFlujoCaja("Fin<Ini.");return;} setCargandoFlujoCaja(true);setErrorFlujoCaja(null);setInformeFlujoGenerado(false); try{const{data,error}=await obtenerInformeFlujoMensual(fechaInicioFlujo,fechaFinFlujo);if(error)throw error;const fD=(data||[]).map(d=>({mes:d.mes,Ingresos:parseFloat(d.total_ingresos)||0,Egresos:parseFloat(d.total_egresos)||0,FlujoNeto:parseFloat(d.flujo_neto)||0}));setDatosFlujoCaja(fD);setInformeFlujoGenerado(true);}catch(e){setErrorFlujoCaja(`Err:${e.message}`);setDatosFlujoCaja([]);}finally{setCargandoFlujoCaja(false);}}, [session, fechaInicioFlujo, fechaFinFlujo]);

    // Generar Informe Comparación Mensual
    const handleGenerarComparacion = useCallback(async () => {
        if (!session?.user?.id || !mes1Comparacion || !mes2Comparacion) { setErrorComparacion("Selecciona dos meses."); return; }
        if (mes1Comparacion === mes2Comparacion) { setErrorComparacion("Selecciona meses diferentes."); return; }

        console.log(`[handleGenerarComparacion] Iniciando: ${mes1Comparacion} vs ${mes2Comparacion}`);
        setCargandoComparacion(true); setErrorComparacion(null); setInformeComparacionGenerado(false); setDatosComparacion(null);
        try {
            const { data, error } = await obtenerComparacionMensual(mes1Comparacion, mes2Comparacion);
            if (error) throw error;
            console.log("[handleGenerarComparacion] Datos crudos:", data);

            if (!data || data.length === 0) {
                console.log("[handleGenerarComparacion] No se recibieron datos de la API.");
                 setDatosComparacion({ mes1: { totalIngresos: 0, totalEgresos: 0, categorias: {} }, mes2: { totalIngresos: 0, totalEgresos: 0, categorias: {} }, categoriasUnicas: [] }); // Objeto vacío pero válido
                 setInformeComparacionGenerado(true); // Marcar como generado para mostrar mensaje "sin datos"
                 return; // Salir temprano
            }

            // Procesar datos
            const processedData = { mes1: { totalIngresos: 0, totalEgresos: 0, categorias: {} }, mes2: { totalIngresos: 0, totalEgresos: 0, categorias: {} }, categoriasUnicas: new Set() };
            data.forEach(item => { const p = item.periodo === 'Mes 1' ? 'mes1' : 'mes2'; const m = parseFloat(item.monto_total) || 0; if (item.categoria_nombre === 'Total') { if (item.tipo === 'Ingreso') processedData[p].totalIngresos = m; else if (item.tipo === 'Egreso') processedData[p].totalEgresos = m; } else { if (item.tipo === 'Egreso') { processedData[p].categorias[item.categoria_nombre] = m; processedData.categoriasUnicas.add(item.categoria_nombre); } } });
             processedData.categoriasUnicas = [...processedData.categoriasUnicas].sort();
            setDatosComparacion(processedData);
            setInformeComparacionGenerado(true); // Marcar como generado SOLO si hubo datos y procesamiento
            console.log("[handleGenerarComparacion] Datos procesados:", processedData);

        } catch (err) { setErrorComparacion(`Error: ${err.message}`); setDatosComparacion(null); }
        finally { setCargandoComparacion(false); }
    }, [session, mes1Comparacion, mes2Comparacion]);

    // Formateadores
    const formatearMonedaLocal = useCallback((m) => { if (loadingSettings || typeof m !== 'number') return '---'; return m.toLocaleString('es-MX', { style: 'currency', currency: currency }); }, [currency, loadingSettings]);
    const tooltipFormatterFlujo = useCallback((v) => { if (loadingSettings || typeof v !== 'number') return '---'; return v.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }); }, [currency, loadingSettings]);
    const formatYAxisFlujo = (t) => { if (loadingSettings) return '...'; if (Math.abs(t) >= 1000000) return `${(t / 1000000).toFixed(1)}M`; if (Math.abs(t) >= 1000) return `${(t / 1000).toFixed(0)}K`; return t.toString(); };
    const totalEgresosInforme = useMemo(() => datosInformeGastos.reduce((sum, tx) => sum + (parseFloat(tx.monto) || 0), 0), [datosInformeGastos]);

    // Clases CSS
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
    const selectClasses = `${inputClasses} bg-gray-700`;
    const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

    // Log para depurar renderizado condicional
    console.log("[Informes Render] informeComparacionGenerado:", informeComparacionGenerado, "cargandoComparacion:", cargandoComparacion, "datosComparacion:", datosComparacion);

    return (
        <div className="space-y-8">
            <div className="flex items-center text-white"> <span className="mr-3 text-2xl">📄</span> <h1 className="text-2xl font-semibold">Informes</h1> </div>

            {/* --- Sección Informe Comparación Mensual --- */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Comparación Mensual</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6"> <div> <label htmlFor="mes1Comp" className={labelClasses}>Mes 1</label> <input type="month" id="mes1Comp" value={mes1Comparacion.substring(0, 7)} onChange={(e) => setMes1Comparacion(getPrimerDiaMes(new Date(e.target.value + '-02')))} required className={inputClasses} disabled={cargandoComparacion}/> </div> <div> <label htmlFor="mes2Comp" className={labelClasses}>Mes 2</label> <input type="month" id="mes2Comp" value={mes2Comparacion.substring(0, 7)} onChange={(e) => setMes2Comparacion(getPrimerDiaMes(new Date(e.target.value + '-02')))} required className={inputClasses} disabled={cargandoComparacion}/> </div> <div> <button onClick={handleGenerarComparacion} className={`${buttonClasses('purple')} w-full`} disabled={cargandoComparacion || !mes1Comparacion || !mes2Comparacion || mes1Comparacion === mes2Comparacion}> {cargandoComparacion ? 'Comparando...' : '⚖️ Comparar Meses'} </button> </div> </div>
                {errorComparacion && !cargandoComparacion && <p className="text-red-400 mt-4 text-sm">{errorComparacion}</p>}
                {/* Resultados Comparación - Condición verificada */}
                {informeComparacionGenerado && !cargandoComparacion && datosComparacion && (
                    <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700 mt-4">
                        {/* ... (Tabla de comparación igual que antes) ... */}
                        <table className="w-full text-sm text-left text-gray-400"> <thead className="text-xs text-gray-400 uppercase bg-gray-700"> <tr> <th scope="col" className="px-4 py-3">Concepto</th> <th scope="col" className="px-4 py-3 text-right">{mes1Comparacion.substring(0, 7)}</th> <th scope="col" className="px-4 py-3 text-right">{mes2Comparacion.substring(0, 7)}</th> <th scope="col" className="px-4 py-3 text-right">Diferencia</th> <th scope="col" className="px-4 py-3 text-right">% Cambio</th> </tr> </thead> <tbody className="bg-gray-800 divide-y divide-gray-700"> <tr className="font-semibold text-gray-200"> <td className="px-4 py-2">Ingresos Totales</td> <td className="px-4 py-2 text-right text-green-400">{formatearMonedaLocal(datosComparacion.mes1.totalIngresos)}</td> <td className="px-4 py-2 text-right text-green-400">{formatearMonedaLocal(datosComparacion.mes2.totalIngresos)}</td> <td className={`px-4 py-2 text-right ${datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos)}</td> <td className={`px-4 py-2 text-right ${datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos >= 0 ? 'text-green-400' : 'text-red-400'}`}>{datosComparacion.mes1.totalIngresos !== 0 ? `${((datosComparacion.mes2.totalIngresos - datosComparacion.mes1.totalIngresos) / datosComparacion.mes1.totalIngresos * 100).toFixed(1)}%` : 'N/A'}</td> </tr> <tr className="font-semibold text-gray-200"> <td className="px-4 py-2">Egresos Totales</td> <td className="px-4 py-2 text-right text-red-400">{formatearMonedaLocal(datosComparacion.mes1.totalEgresos)}</td> <td className="px-4 py-2 text-right text-red-400">{formatearMonedaLocal(datosComparacion.mes2.totalEgresos)}</td> <td className={`px-4 py-2 text-right ${datosComparacion.mes2.totalEgresos <= datosComparacion.mes1.totalEgresos ? 'text-green-400' : 'text-red-400'}`}>{formatearMonedaLocal(datosComparacion.mes2.totalEgresos - datosComparacion.mes1.totalEgresos)}</td> <td className={`px-4 py-2 text-right ${datosComparacion.mes2.totalEgresos <= datosComparacion.mes1.totalEgresos ? 'text-green-400' : 'text-red-400'}`}>{datosComparacion.mes1.totalEgresos !== 0 ? `${((datosComparacion.mes2.totalEgresos - datosComparacion.mes1.totalEgresos) / datosComparacion.mes1.totalEgresos * 100).toFixed(1)}%` : 'N/A'}</td> </tr> <tr className="font-bold text-white bg-gray-700"> <td className="px-4 py-2">Flujo Neto</td> <td className={`px-4 py-2 text-right ${datosComparacion.mes1.totalIngresos - datosComparacion.mes1.totalEgresos >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatearMonedaLocal(datosComparacion.mes1.totalIngresos - datosComparacion.mes1.totalEgresos)}</td> <td className={`px-4 py-2 text-right ${datosComparacion.mes2.totalIngresos - datosComparacion.mes2.totalEgresos >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatearMonedaLocal(datosComparacion.mes2.totalIngresos - datosComparacion.mes2.totalEgresos)}</td> <td colSpan={2}></td> </tr> {datosComparacion.categoriasUnicas.map(catNombre => { const m1 = datosComparacion.mes1.categorias[catNombre] || 0; const m2 = datosComparacion.mes2.categorias[catNombre] || 0; const diff = m2 - m1; const cPct = m1 !== 0 ? `${((diff / m1) * 100).toFixed(1)}%` : (m2 > 0 ? '+Inf%' : 'N/A'); const dCol = diff <= 0 ? 'text-green-400' : 'text-red-400'; return ( <tr key={catNombre}> <td className="px-4 py-2 pl-8 text-gray-300">{catNombre}</td> <td className="px-4 py-2 text-right">{formatearMonedaLocal(m1)}</td> <td className="px-4 py-2 text-right">{formatearMonedaLocal(m2)}</td> <td className={`px-4 py-2 text-right ${dCol}`}>{formatearMonedaLocal(diff)}</td> <td className={`px-4 py-2 text-right ${dCol}`}>{cPct}</td> </tr> ); })} </tbody> </table>
                    </div>
                )}
                 {/* Mensaje si no hay datos después de generar */}
                 {informeComparacionGenerado && !cargandoComparacion && !datosComparacion && !errorComparacion && (
                     <p className="text-gray-500 mt-4">No se encontraron datos para la comparación en los meses seleccionados.</p>
                 )}
            </section>

            {/* --- Sección Informe de Gastos Detallado (sin cambios) --- */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white">Gastos Detallados por Filtro</h2> {/* ... (resto igual) ... */} <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end mb-6"> <div> <label htmlFor="fechaInicioInforme" className={labelClasses}>Desde</label> <input type="date" id="fechaInicioInforme" value={fechaInicioGastos} onChange={(e) => setFechaInicioGastos(e.target.value)} required className={inputClasses} /> </div> <div> <label htmlFor="fechaFinInforme" className={labelClasses}>Hasta</label> <input type="date" id="fechaFinInforme" value={fechaFinGastos} onChange={(e) => setFechaFinGastos(e.target.value)} required className={inputClasses} min={fechaInicioGastos} /> </div> <div> <label htmlFor="filtroCategoria" className={labelClasses}>Categoría</label> <select id="filtroCategoria" value={selectedCategoriaIdGastos} onChange={(e) => setSelectedCategoriaIdGastos(e.target.value)} className={selectClasses} disabled={loadingRefs}> <option value="">-- Todas --</option> {loadingRefs ? <option>...</option> : categoriasEgreso.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)} </select> </div> <div> <label htmlFor="filtroCartera" className={labelClasses}>Cartera</label> <select id="filtroCartera" value={selectedCarteraIdGastos} onChange={(e) => setSelectedCarteraIdGastos(e.target.value)} className={selectClasses} disabled={loadingRefs}> <option value="">-- Todas --</option> {loadingRefs ? <option>...</option> : carteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)} </select> </div> <div className="lg:col-span-1 xl:col-span-1"> <label htmlFor="filtroTags" className={labelClasses}>Etiquetas (coma)</label> <input type="text" id="filtroTags" value={tagsStringFiltro} onChange={(e) => setTagsStringFiltro(e.target.value)} placeholder="Ej: viaje, urgente" className={inputClasses} /> </div> <div className="lg:col-span-1 xl:col-span-1 lg:pt-6"> <button onClick={handleGenerarInformeGastos} className={`${buttonClasses('blue')} w-full`} disabled={cargandoInformeGastos || loadingRefs}> {cargandoInformeGastos ? 'Generando...' : '📊 Ver Gastos'} </button> </div> </div> {errorInformeGastos && !cargandoInformeGastos && <p className="text-red-400 mt-4 text-sm">{errorInformeGastos}</p>} {informeGastosGenerado && !cargandoInformeGastos && ( <> {datosInformeGastos.length === 0 && !errorInformeGastos && ( <p className="text-gray-500 mt-4">No se encontraron egresos.</p> )} {datosInformeGastos.length > 0 && ( <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700 mt-4"> <table className="w-full text-sm text-left text-gray-400"> <thead className="text-xs text-gray-400 uppercase bg-gray-700"><tr> <th scope="col" className="px-5 py-3">Monto</th> <th scope="col" className="px-5 py-3">Descripción</th> <th scope="col" className="px-5 py-3 hidden md:table-cell">Categoría</th> <th scope="col" className="px-5 py-3 hidden lg:table-cell">Cartera</th> <th scope="col" className="px-5 py-3 hidden md:table-cell">Fecha</th> </tr></thead> <tbody>{datosInformeGastos.map((tx) => ( <TransactionItem key={tx.id} transaccion={tx} onEdit={() => {}} onDelete={() => {}} /> ))}</tbody> <tfoot className="bg-gray-700 font-semibold text-gray-300"><tr> <td className="px-5 py-3 text-right font-bold" colSpan={5}>Total Periodo:</td> <td className="px-5 py-3 text-left font-bold text-red-400"> {formatearMonedaLocal(totalEgresosInforme)} </td> </tr></tfoot> </table> </div> )} </> )} </section>

            {/* --- Sección Informe de Flujo de Caja Mensual (sin cambios) --- */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg"> <h2 className="text-xl font-semibold mb-4 text-white">Flujo de Caja Mensual</h2> <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6"> <div> <label htmlFor="fechaInicioFlujo" className={labelClasses}>Desde</label> <input type="date" id="fechaInicioFlujo" value={fechaInicioFlujo} onChange={(e) => setFechaInicioFlujo(e.target.value)} required className={inputClasses} /> </div> <div> <label htmlFor="fechaFinFlujo" className={labelClasses}>Hasta</label> <input type="date" id="fechaFinFlujo" value={fechaFinFlujo} onChange={(e) => setFechaFinFlujo(e.target.value)} required className={inputClasses} min={fechaInicioFlujo} /> </div> <div> <button onClick={handleGenerarInformeFlujo} className={`${buttonClasses('blue')} w-full`} disabled={cargandoFlujoCaja}> {cargandoFlujoCaja ? 'Generando...' : '📊 Ver Flujo'} </button> </div> </div> {errorFlujoCaja && !cargandoFlujoCaja && <p className="text-red-400 mt-4 text-sm">{errorFlujoCaja}</p>} {!cargandoFlujoCaja && informeFlujoGenerado && ( <> {datosFlujoCaja.length === 0 && !errorFlujoCaja && ( <p className="text-gray-500 mt-4">No hay datos de flujo.</p> )} {datosFlujoCaja.length > 0 && ( <div className="space-y-8 mt-4"> <div className="w-full h-[300px]"> <ResponsiveContainer> <LineChart data={datosFlujoCaja} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}> <CartesianGrid strokeDasharray="3 3" stroke="#374151" /> <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={11} /> <YAxis stroke="#9CA3AF" fontSize={11} tickFormatter={formatYAxisFlujo} /> <Tooltip formatter={tooltipFormatterFlujo} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} itemStyle={{ color: '#D1D5DB' }}/> <Legend wrapperStyle={{ fontSize: '12px' }} /> <Line type="monotone" dataKey="Ingresos" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 5 }} /> <Line type="monotone" dataKey="Egresos" stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 5 }} /> <Line type="monotone" dataKey="FlujoNeto" name="Flujo Neto" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /> </LineChart> </ResponsiveContainer> </div> <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700"> <table className="w-full text-sm text-left text-gray-400"> <thead className="text-xs text-gray-400 uppercase bg-gray-700"><tr> <th scope="col" className="px-6 py-3">Mes</th> <th scope="col" className="px-6 py-3 text-right">Ingresos</th> <th scope="col" className="px-6 py-3 text-right">Egresos</th> <th scope="col" className="px-6 py-3 text-right">Flujo Neto</th> </tr></thead> <tbody>{datosFlujoCaja.map((item) => ( <tr key={item.mes} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600"> <td className="px-6 py-3 font-medium text-gray-300">{item.mes}</td> <td className="px-6 py-3 text-right text-green-400">{formatearMonedaLocal(item.Ingresos)}</td> <td className="px-6 py-3 text-right text-red-400">{formatearMonedaLocal(item.Egresos)}</td> <td className={`px-6 py-3 text-right font-medium ${item.FlujoNeto >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatearMonedaLocal(item.FlujoNeto)}</td> </tr> ))}</tbody> </table> </div> </div> )} </> )} </section>
        </div>
    );
}

export default Informes;
