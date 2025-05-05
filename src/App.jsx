// Archivo: src/App.jsx

import React from 'react';
import Transacciones from './pages/Transacciones'; // Importamos nuestra página

function App() {
  return (
    <div className="App bg-gray-100 min-h-screen">
      {/* Aquí podrías añadir un encabezado o menú de navegación en el futuro */}
      {/* <Header /> */}

      <main>
        {/* Renderizamos la página de Transacciones */}
        <Transacciones />
      </main>

      {/* Aquí podrías añadir un pie de página en el futuro */}
      {/* <Footer /> */}
    </div>
  );
}

export default App;