import React, { useState, useEffect, useCallback } from 'react';
import { obtenerResumenFinanciero } from '../lib/dashboardApi';
import { useSettings } from '../context/SettingsContext'; // Importar hook

// Componente reutilizable para las tarjetas de resumen
function SummaryCard({ title, value, colorClass = 'text-indigo-400', isLoading }) {
  // Usar el contexto para obtener la moneda
  const { currency, loadingSettings } = useSettings();

  const formatearMoneda = (monto) => {
    // Mostrar placeholder si las configuraciones o el valor están cargando
    if (loadingSettings || isLoading || typeof monto !== 'number') return '---';
    // Usar la moneda del contexto
    return monto.toLocaleString('es-MX', { // Puedes ajustar el locale si quieres
        style: 'currency',
        currency: currency, // Usa la moneda del contexto
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">{title}</h3>
      {isLoading || loadingSettings ? ( // Mostrar pulso si carga datos O configuración
        <div className="h-8 bg-gray-700 rounded animate-pulse w-3/4"></div>
      ) : (
        <p className={`text-3xl font-semibold ${colorClass} truncate`}> {/* Añadido truncate */}
          {formatearMoneda(value)}
        </p>
      )}
    </div>
  );
}


function Dashboard({ session }) {
  const [resumen, setResumen] = useState({
    saldo_total_carteras: 0,
    ingresos_mes_actual: 0,
    egresos_mes_actual: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // Obtener moneda del contexto (aunque se use principalmente en SummaryCard)
  const { currency, loadingSettings } = useSettings();

  const cargarResumen = useCallback(async () => {
    if (!session?.user?.id) return;
    setCargando(true); setError(null);
    try {
      const { data, error: fetchError } = await obtenerResumenFinanciero();
      if (fetchError) throw fetchError;
      if (data) { setResumen(data); }
      else { setResumen({ saldo_total_carteras: 0, ingresos_mes_actual: 0, egresos_mes_actual: 0 }); }
    } catch (err) {
      setError(`Error al cargar resumen: ${err.message || 'Desconocido'}`);
      setResumen({ saldo_total_carteras: 0, ingresos_mes_actual: 0, egresos_mes_actual: 0 });
    } finally { setCargando(false); }
  }, [session]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  const balanceMes = resumen.ingresos_mes_actual - resumen.egresos_mes_actual;
  const balanceColor = balanceMes >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="space-y-8">
      <div className="text-white">
         <h1 className="text-3xl font-bold mb-2">¡Hola! 👋</h1>
         {/* Muestra moneda actual si no está cargando */}
         <p className="text-lg text-gray-400">Resumen del mes en <span className='font-semibold'>{loadingSettings ? '...' : currency}</span>.</p>
      </div>

      {error && <p className="text-red-400 bg-gray-900 p-4 rounded-lg">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Saldo Total Actual"
          value={resumen.saldo_total_carteras}
          colorClass="text-blue-400"
          isLoading={cargando} // SummaryCard maneja loadingSettings internamente
        />
        <SummaryCard
          title="Ingresos del Mes"
          value={resumen.ingresos_mes_actual}
          colorClass="text-green-400"
          isLoading={cargando}
        />
        <SummaryCard
          title="Egresos del Mes"
          value={resumen.egresos_mes_actual}
          colorClass="text-red-400"
          isLoading={cargando}
        />
        <SummaryCard
          title="Balance del Mes"
          value={balanceMes}
          colorClass={balanceColor}
          isLoading={cargando}
        />
      </div>
      {/* Futuras secciones */}
    </div>
  );
}

export default Dashboard;
