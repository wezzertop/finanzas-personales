import React, { useState, useEffect } from 'react';

const tipos = ['Ingreso', 'Egreso'];
const categoriasBase = ['Comida', 'Transporte', 'Salario', 'Entretenimiento', 'Servicios', 'Otros'];
const carterasBase = ['Efectivo', 'Banco Principal', 'Tarjeta Crédito', 'Ahorros'];

function TransactionForm({ onSubmit, transaccionInicial, onCancelEdit }) {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState(tipos[0]);
  const [categoria, setCategoria] = useState(''); // Cambiado para que "Seleccione" sea el valor inicial
  const [cartera, setCartera] = useState('');   // Cambiado para que "Seleccione" sea el valor inicial
  const [fecha, setFecha] = useState(''); // Añadido estado para la fecha

  useEffect(() => {
    if (transaccionInicial) {
      setMonto(transaccionInicial.monto || '');
      setDescripcion(transaccionInicial.descripcion || '');
      setTipo(transaccionInicial.tipo || tipos[0]);
      setCategoria(transaccionInicial.categoria || '');
      setCartera(transaccionInicial.cartera || '');
      // Formatear fecha si viene de la BD (asumiendo formato ISO)
      setFecha(transaccionInicial.fecha ? new Date(transaccionInicial.fecha).toISOString().split('T')[0] : '');
    } else {
      setMonto('');
      setDescripcion('');
      setTipo(tipos[0]);
      setCategoria('');
      setCartera('');
      // Fecha actual por defecto para nuevos registros
      setFecha(new Date().toISOString().split('T')[0]);
    }
  }, [transaccionInicial]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      alert('Por favor, ingresa un monto válido y positivo.');
      return;
    }
    if (!descripcion.trim()) {
      alert('La descripción no puede estar vacía.');
      return;
    }
     if (!categoria) {
       alert('Por favor, selecciona una categoría.');
       return;
    }
     if (!cartera) {
       alert('Por favor, selecciona una cartera.');
       return;
    }
     if (!fecha) {
        alert('Por favor, selecciona una fecha.');
        return;
     }


    const datosTransaccion = {
      monto: parseFloat(monto),
      descripcion: descripcion.trim(),
      tipo,
      categoria,
      cartera,
      fecha, // Incluimos la fecha
    };

    if (transaccionInicial) {
      onSubmit(transaccionInicial.id, datosTransaccion);
    } else {
      onSubmit(datosTransaccion);
    }

    if (!transaccionInicial) {
      setMonto('');
      setDescripcion('');
      setTipo(tipos[0]);
      setCategoria('');
      setCartera('');
      setFecha(new Date().toISOString().split('T')[0]);
    }
  };

  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
  const inputClasses = `
    block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
    text-gray-200 placeholder-gray-500 text-sm shadow-sm
    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label htmlFor="monto" className={labelClasses}>
            Monto ($)
          </label>
          <input
            type="number"
            id="monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="50.00"
            step="0.01"
            required
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="descripcion" className={labelClasses}>
            Descripción
          </label>
          <input
            type="text"
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Café..."
            required
            maxLength={100}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="tipo" className={labelClasses}>
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            required
            className={inputClasses}
          >
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
         <div>
          <label htmlFor="categoria" className={labelClasses}>
            Categoría
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            className={inputClasses}
          >
            <option value="" disabled>-- Seleccione --</option>
            {categoriasBase.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cartera" className={labelClasses}>
            Cartera
          </label>
          <select
            id="cartera"
            value={cartera}
            onChange={(e) => setCartera(e.target.value)}
            required
            className={inputClasses}
          >
            <option value="" disabled>-- Seleccione --</option>
            {carterasBase.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
         <div>
          <label htmlFor="fecha" className={labelClasses}>
            Fecha
          </label>
          <input
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className={inputClasses}
          />
        </div>
      </div>

      <div className="flex items-center justify-start pt-4 space-x-3">
        <button
          type="submit"
          className={`px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${transaccionInicial ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150`}
        >
          {transaccionInicial ? '💾 Guardar Cambios' : '💾 Guardar Transacción'}
        </button>
        {transaccionInicial && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition duration-150"
            >
              Cancelar
            </button>
        )}
      </div>
    </form>
  );
}

export default TransactionForm;
