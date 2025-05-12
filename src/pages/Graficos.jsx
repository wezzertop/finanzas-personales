// Archivo: src/pages/Graficos.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { obtenerDatosGraficoEgresos } from '../lib/graficosApi';
import { useSettings } from '../context/SettingsContext';

// --- Icono SVG Inline ---
const PieChartIconPageTitle = ({ className = "page-title-icon" }) => ( // Para el título de la página
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>
);
// --- Fin Icono SVG Inline ---

// Paleta de colores mejorada para gráficos, con buen contraste en tema oscuro
const GRAPH_COLORS = [
  '#38BDF8', // sky-500 (brand-accent-primary)
  '#A3E635', // lime-500 (brand-accent-secondary)
  '#FACC15', // yellow-400
  '#FB923C', // orange-400
  '#F472B6', // pink-400
  '#A78BFA', // violet-400
  '#60A5FA', // blue-400
  '#2DD4BF', // teal-400
  '#F43F5E', // rose-500 (brand-accent-danger)
  '#E879F9', // fuchsia-400
  '#C084FC', // purple-400
  '#818CF8', // indigo-400
];

// Leyenda personalizada con estilos actualizados
const CustomLegend = ({ payload }) => {
  const { currency, loadingSettings } = useSettings();

  const formatearMoneda = useCallback((monto) => {
    if (loadingSettings || typeof monto !== 'number' || isNaN(monto)) return '---';
    return monto.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [currency, loadingSettings]);

  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2 mt-6 text-xs text-slate-300">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center truncate" title={`${entry.value}: ${formatearMoneda(entry.payload.value)}`}>
          <span className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
          <span className="truncate mr-1.5 text-slate-400">{entry.value}:</span>
          <span className="font-medium text-slate-200 whitespace-nowrap">
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
  const { currency, loadingSettings } = useSettings();

  const cargarDatos = useCallback(async () => {
    if (!session?.user?.id) { setCargando(false); setDatosGrafico([]); return; }
    setCargando(true); setError(null);
    try {
      const { data, error: fetchError } = await obtenerDatosGraficoEgresos();
      if (fetchError) throw fetchError;
      const formattedData = (data || []).map(item => ({ name: item.nombre_categoria, value: parseFloat(item.total_egresos) || 0 }));
      setDatosGrafico(formattedData);
    } catch (err) { setError(`Error cargando datos del gráfico: ${err.message || 'Desconocido'}`); setDatosGrafico([]); }
    finally { setCargando(false); }
  }, [session]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const tooltipFormatter = useCallback((value, name) => {
    if (loadingSettings || typeof value !== 'number' || isNaN(value)) return ['---', name];
    const formattedValue = value.toLocaleString('es-MX', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return [formattedValue, name];
  }, [currency, loadingSettings]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    if (percent < 0.03) return null; // No mostrar etiqueta si el segmento es muy pequeño
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px" fontWeight="500">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };


  return (
    <div className="space-y-8">
      <h1 className="page-title"> <PieChartIconPageTitle /> Gráficos Financieros </h1>

      <section className="card-base">
        <h2 className="text-xl font-semibold mb-6 text-slate-100 text-center">Egresos por Categoría (Mes Actual)</h2>

        {cargando && <div className="h-96 flex items-center justify-center text-slate-400">Cargando gráfico...</div>}
        {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-md text-center">{error}</p>}
        
        {!cargando && datosGrafico.length === 0 && !error && (
          <p className="text-slate-500 text-center py-10">No hay datos de egresos para mostrar en el gráfico este mes.</p>
        )}

        {!cargando && datosGrafico.length > 0 && (
          <div className="w-full h-[400px] sm:h-[450px] md:h-[500px]"> {/* Altura responsiva */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosGrafico}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius="80%"
                  innerRadius="50%" // Para efecto dona
                  fill="#8884d8" // Color por defecto, se sobreescribe por Cell
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {datosGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRAPH_COLORS[index % GRAPH_COLORS.length]} stroke={GRAPH_COLORS[index % GRAPH_COLORS.length]} strokeOpacity={0.6} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={tooltipFormatter}
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)', // slate-800 con transparencia
                    borderColor: '#334155', // slate-700
                    borderRadius: '0.5rem', // rounded-lg
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#cbd5e1' }} // slate-300
                  labelStyle={{ color: '#94a3b8', fontWeight: '500', marginBottom: '4px' }} // slate-400
                />
                <Legend content={<CustomLegend />} verticalAlign="bottom" align="center" wrapperStyle={{ marginTop: '20px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      {/* Aquí podrías añadir más secciones de gráficos en el futuro */}
    </div>
  );
}

export default Graficos;
