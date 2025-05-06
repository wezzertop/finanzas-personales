import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { obtenerDatosGraficoEgresos } from '../lib/graficosApi';
import { useSettings } from '../context/SettingsContext'; // Importar hook

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'];

// Leyenda personalizada usa el contexto
const CustomLegend = ({ payload }) => {
  const { currency, loadingSettings } = useSettings();

  const formatearMoneda = useCallback((monto) => {
    if (loadingSettings || typeof monto !== 'number') return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 mt-4 text-xs text-gray-400">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center truncate">
          <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
          <span className="truncate mr-1" title={entry.value}>{entry.value}:</span>
          <span className="font-medium text-gray-300 whitespace-nowrap">
            {loadingSettings ? '...' : formatearMoneda(entry.payload.value)}
          </span>
        </li>
      ))}
    </ul>
  );
};

function Graficos({ session }) {
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // Obtener moneda y estado de carga del contexto (para Tooltip)
  const { currency, loadingSettings } = useSettings();

  const cargarDatos = useCallback(async () => {
      if (!session?.user?.id) { setCargando(false); setDatosGrafico([]); return; }
      setCargando(true); setError(null);
      try {
        const { data, error: fetchError } = await obtenerDatosGraficoEgresos();
        if (fetchError) throw fetchError;
        const formattedData = (data || []).map(item => ({ name: item.nombre_categoria, value: parseFloat(item.total_egresos) }));
        setDatosGrafico(formattedData);
      } catch (err) { setError(`Error cargando datos: ${err.message || 'Desconocido'}`); setDatosGrafico([]); }
      finally { setCargando(false); }
  }, [session]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Formateador para el Tooltip usa el contexto
  const tooltipFormatter = useCallback((value, name) => {
      if (loadingSettings || typeof value !== 'number') return ['---', name];
      const formattedValue = value.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return [formattedValue, name];
  }, [currency, loadingSettings]);

  return (
    <div className="space-y-8">
      <div className="flex items-center text-white"> <span className="mr-3 text-2xl">📈</span> <h1 className="text-2xl font-semibold">Gráficos</h1> </div>

      <section className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-white text-center">Egresos por Categoría (Mes Actual)</h2>

        {cargando && <p className="text-blue-400 text-center py-10">Cargando...</p>}
        {error && <p className="text-red-400 text-center bg-gray-800 p-3 rounded">{error}</p>}
        {!cargando && datosGrafico.length === 0 && !error && ( <p className="text-gray-500 text-center py-10">No hay datos.</p> )}

        {!cargando && datosGrafico.length > 0 && (
          <div className="w-full h-[450px] min-h-[300px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={datosGrafico} cx="50%" cy="50%" labelLine={false} outerRadius="80%" innerRadius="50%" fill="#8884d8" paddingAngle={2} dataKey="value" nameKey="name" >
                  {datosGrafico.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                </Pie>
                <Tooltip
                   formatter={tooltipFormatter}
                   contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#D1D5DB' }}
                   itemStyle={{ color: '#D1D5DB' }}
                />
                <Legend content={<CustomLegend />} verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

export default Graficos;
