// Archivo: src/components/TransactionForm.jsx

import React, { useState, useEffect } from 'react';

// Opciones predefinidas (podrían venir de la BD en el futuro)
const tipos = ['Ingreso', 'Egreso'];
const categoriasBase = ['Comida', 'Transporte', 'Salario', 'Entretenimiento', 'Servicios', 'Otros'];
const carterasBase = ['Efectivo', 'Banco Principal', 'Tarjeta Crédito', 'Ahorros'];

function TransactionForm({ onSubmit, transaccionInicial, onCancelEdit }) {
  // --- Estados del Formulario ---
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState(tipos[0]); // Valor inicial: Ingreso
  const [categoria, setCategoria] = useState(categoriasBase[0]); // Valor inicial: Comida
  const [cartera, setCartera] = useState(carterasBase[0]); // Valor inicial: Efectivo

  // --- Efecto para Cargar Datos Iniciales (cuando se edita) ---
  useEffect(() => {
    if (transaccionInicial) {
      // Si recibimos una transacción para editar, llenamos el formulario
      setMonto(transaccionInicial.monto || ''); // Asegura que no sea null
      setDescripcion(transaccionInicial.descripcion || '');
      setTipo(transaccionInicial.tipo || tipos[0]);
      setCategoria(transaccionInicial.categoria || categoriasBase[0]);
      setCartera(transaccionInicial.cartera || carterasBase[0]);
      console.log("FORM: Cargando datos para editar:", transaccionInicial);
    } else {
      // Si no hay transacción inicial (modo agregar), reseteamos el form
      console.log("FORM: Reseteando formulario para agregar");
      setMonto('');
      setDescripcion('');
      setTipo(tipos[0]);
      setCategoria(categoriasBase[0]);
      setCartera(carterasBase[0]);
    }
  }, [transaccionInicial]); // Este efecto se ejecuta cada vez que `transaccionInicial` cambia

  // --- Manejador del Envío del Formulario ---
  const handleSubmit = (event) => {
    event.preventDefault(); // Evita que la página se recargue
    console.log("FORM: Enviando formulario...");

    // Validación simple (puedes añadir más)
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      alert('Por favor, ingresa un monto válido y positivo.');
      return;
    }
    if (!descripcion.trim()) {
       alert('La descripción no puede estar vacía.');
       return;
    }

    const datosTransaccion = {
      monto: parseFloat(monto), // Convertimos a número flotante
      descripcion: descripcion.trim(),
      tipo,
      categoria,
      cartera,
    };

    if (transaccionInicial) {
      // Si estábamos editando, llamamos a onSubmit con el ID y los datos
      console.log("FORM: Llamando a onSubmit para EDITAR ID:", transaccionInicial.id);
      onSubmit(transaccionInicial.id, datosTransaccion);
    } else {
      // Si estábamos agregando, llamamos a onSubmit solo con los datos
      console.log("FORM: Llamando a onSubmit para AGREGAR");
      onSubmit(datosTransaccion);
    }

    // Limpiar el formulario DESPUÉS de llamar a onSubmit (si es modo AGREGAR)
    // Si es modo EDITAR, la página principal se encargará de limpiar vía `transaccionInicial`
    if (!transaccionInicial) {
        console.log("FORM: Limpiando formulario después de agregar.");
        setMonto('');
        setDescripcion('');
        setTipo(tipos[0]);
        setCategoria(categoriasBase[0]);
        setCartera(carterasBase[0]);
    }
  };

  // --- Renderizado del Formulario ---
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fila 1: Monto y Descripción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
            Monto ($)
          </label>
          <input
            type="number"
            id="monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej: 50.00"
            step="0.01" // Permite decimales
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            type="text"
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Café con amigos"
            required
            maxLength={100} // Límite opcional
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Fila 2: Tipo, Categoría y Cartera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
          >
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
          >
            {categoriasBase.map(c => <option key={c} value={c}>{c}</option>)}
            {/* Podrías añadir una opción para 'Nueva Categoría' en el futuro */}
          </select>
        </div>
        <div>
          <label htmlFor="cartera" className="block text-sm font-medium text-gray-700 mb-1">
            Cartera / Cuenta
          </label>
          <select
            id="cartera"
            value={cartera}
            onChange={(e) => setCartera(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
          >
            {carterasBase.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end space-x-3 pt-4">
        {transaccionInicial && ( // Mostrar botón Cancelar solo si estamos editando
            <button
              type="button" // Importante: type="button" para que no envíe el form
              onClick={onCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar Edición
            </button>
        )}
        <button
          type="submit"
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${transaccionInicial ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          {transaccionInicial ? 'Guardar Cambios' : 'Agregar Transacción'}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;