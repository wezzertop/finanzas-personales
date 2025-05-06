import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Importa useMemo correctamente
import { useSettings } from '../context/SettingsContext';
import { obtenerEgresosFiltrados } from '../lib/informesApi'; // API actualizada
import { obtenerCategorias } from '../lib/categoriasApi'; // Para filtro
import { obtenerCarteras } from '../lib/carterasApi';   // Para filtro
// Importar TransactionItem para reutilizar la fila de transacción
import TransactionItem from '../components/TransactionItem';

// Función auxiliar fechas (sin cambios)
const getDefaultDateRange = () => { const t = new Date(); const f = new Date(t.getFullYear(), t.getMonth(), 1).toLocaleDateString('sv-SE'); const l = new Date(t.getFullYear(), t.getMonth() + 1, 0).toLocaleDateString('sv-SE'); return { inicio: f, fin: l }; };
const formatYMD = (date) => { if (!date) return ''; try { if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) { return date; } return new Date(date).toLocaleDateString('sv-SE'); } catch (e) { return ''; } };


function Informes({ session }) {
    const { currency, loadingSettings } = useSettings();

    // Estados para filtros
    const [fechaInicio, setFechaInicio] = useState(getDefaultDateRange().inicio);
    const [fechaFin, setFechaFin] = useState(getDefaultDateRange().fin);
    const [selectedCategoriaId, setSelectedCategoriaId] = useState(''); // '' para "Todas"
    const [selectedCarteraId, setSelectedCarteraId] = useState('');   // '' para "Todas"

    // Estados para datos y UI
    const [datosInforme, setDatosInforme] = useState([]); // Ahora serán transacciones individuales
    const [cargandoInforme, setCargandoInforme] = useState(false); // Inicia en false, se activa al generar
    const [errorInforme, setErrorInforme] = useState(null);
    const [informeGenerado, setInformeGenerado] = useState(false); // Para saber si mostrar resultados

    // Estados para listas de filtros
    const [categoriasEgreso, setCategoriasEgreso] = useState([]);
    const [carteras, setCarteras] = useState([]);
    const [loadingRefs, setLoadingRefs] = useState(true);

    // Cargar listas para filtros
    const cargarReferencias = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoadingRefs(true);
        try {
            const [resCat, resCart] = await Promise.all([
                obtenerCategorias('Egreso'), // Solo categorías de Egreso
                obtenerCarteras()
            ]);
            if (resCat.error || resCart.error) { throw new Error(`${resCat.error?.message || resCart.error?.message}`); }
            setCategoriasEgreso(resCat.data || []);
            setCarteras(resCart.data || []);
        } catch (err) { setErrorInforme(`Error cargando filtros: ${err.message}`); }
        finally { setLoadingRefs(false); }
    }, [session]);

    useEffect(() => { cargarReferencias(); }, [cargarReferencias]);

    // Función para generar el informe (llama a nueva API)
    const handleGenerarInforme = useCallback(async () => {
        if (!session?.user?.id || !fechaInicio || !fechaFin) { setErrorInforme("Selecciona un rango de fechas válido."); return; }
        if (new Date(fechaFin) < new Date(fechaInicio)) { setErrorInforme("La fecha de fin no puede ser anterior a la fecha de inicio."); return; }

        setCargandoInforme(true); setErrorInforme(null); setInformeGenerado(false); // Ocultar resultados anteriores
        try {
            const { data, error } = await obtenerEgresosFiltrados(
                fechaInicio,
                fechaFin,
                selectedCategoriaId || null, // null si ''
                selectedCarteraId || null    // null si ''
            );
            if (error) throw error;
            setDatosInforme(data || []);
            setInformeGenerado(true); // Marcar que se generó
        } catch (err) { setErrorInforme(`Error al generar informe: ${err.message || 'Desconocido'}`); setDatosInforme([]); }
        finally { setCargandoInforme(false); }
    }, [session, fechaInicio, fechaFin, selectedCategoriaId, selectedCarteraId]); // Depende de los filtros

    // Formateador de moneda local
    const formatearMonedaLocal = useCallback((monto) => { if (loadingSettings || typeof monto !== 'number') return '---'; const num = parseFloat(monto); if (isNaN(num)) return '---'; return num.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, [currency, loadingSettings]);

    // Calcular total de egresos del informe actual usando useMemo
    const totalEgresosInforme = useMemo(() => {
        return datosInforme.reduce((sum, tx) => sum + (parseFloat(tx.monto) || 0), 0);
    }, [datosInforme]); // Recalcular solo si datosInforme cambia

    // --- Clases CSS ---
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const inputClasses = `block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`;
    const selectClasses = `${inputClasses} bg-gray-700`;
    const buttonClasses = (color = 'indigo') => `px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-${color}-500 transition duration-150 disabled:opacity-50`;

    return (
        <div className="space-y-8">
            <div className="flex items-center text-white"> <span className="mr-3 text-2xl">📄</span> <h1 className="text-2xl font-semibold">Informes de Gastos</h1> </div>

            {/* Sección de Controles del Informe */}
            <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Filtrar Egresos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div> <label htmlFor="fechaInicioInforme" className={labelClasses}>Desde</label> <input type="date" id="fechaInicioInforme" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required className={inputClasses} /> </div>
                    <div> <label htmlFor="fechaFinInforme" className={labelClasses}>Hasta</label> <input type="date" id="fechaFinInforme" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required className={inputClasses} min={fechaInicio} /> </div>
                    <div>
                        <label htmlFor="filtroCategoria" className={labelClasses}>Categoría</label>
                        <select id="filtroCategoria" value={selectedCategoriaId} onChange={(e) => setSelectedCategoriaId(e.target.value)} className={selectClasses} disabled={loadingRefs}> <option value="">-- Todas --</option> {loadingRefs ? <option>...</option> : categoriasEgreso.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)} </select>
                    </div>
                    <div>
                        <label htmlFor="filtroCartera" className={labelClasses}>Cartera</label>
                        <select id="filtroCartera" value={selectedCarteraId} onChange={(e) => setSelectedCarteraId(e.target.value)} className={selectClasses} disabled={loadingRefs}> <option value="">-- Todas --</option> {loadingRefs ? <option>...</option> : carteras.map(cart => <option key={cart.id} value={cart.id}>{cart.nombre}</option>)} </select>
                    </div>
                    <div className="lg:pt-6">
                        <button onClick={handleGenerarInforme} className={`${buttonClasses('blue')} w-full`} disabled={cargandoInforme || loadingRefs}> {cargandoInforme ? 'Generando...' : '📊 Generar Informe'} </button>
                    </div>
                </div>
                {errorInforme && !cargandoInforme && <p className="text-red-400 mt-4 text-sm">{errorInforme}</p>}
            </section>

            {/* Sección de Resultados del Informe */}
            {informeGenerado && !cargandoInforme && (
                <section className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white"> Resultados ({new Date(fechaInicio+'T00:00:00').toLocaleDateString('es-ES')} - {new Date(fechaFin+'T00:00:00').toLocaleDateString('es-ES')}) </h2>
                    {datosInforme.length === 0 && !errorInforme && ( <p className="text-gray-500">No se encontraron egresos con los filtros seleccionados.</p> )}
                    {datosInforme.length > 0 && (
                        <div className="overflow-x-auto relative shadow-md rounded-lg border border-gray-700">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-5 py-3">Monto</th>
                                        <th scope="col" className="px-5 py-3">Descripción</th>
                                        <th scope="col" className="px-5 py-3 hidden md:table-cell">Categoría</th>
                                        <th scope="col" className="px-5 py-3 hidden lg:table-cell">Cartera</th>
                                        <th scope="col" className="px-5 py-3 hidden md:table-cell">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datosInforme.map((tx) => ( <TransactionItem key={tx.id} transaccion={tx} onEdit={() => {}} onDelete={() => {}} /> ))}
                                </tbody>
                                 <tfoot className="bg-gray-700 font-semibold text-gray-300">
                                    <tr>
                                        {/* Ajustar colSpan según columnas visibles (puede ser complejo hacerlo perfectamente responsivo aquí) */}
                                        {/* Simplificación: usar colSpan amplio y alinear texto */}
                                        <td className="px-5 py-3 text-right font-bold" colSpan={5}>Total Periodo:</td>
                                        <td className="px-5 py-3 text-left font-bold text-red-400"> {formatearMonedaLocal(totalEgresosInforme)} </td>
                                    </tr>
                                 </tfoot>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default Informes;
