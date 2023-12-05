// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Regulados from './components/regulados';
import Consumos from './components/consumos'; // make sure the import path is correct
import Potencia from './components/potencia'; // make sure the import path is correct
import WMAPE from './components/WMAPE'; // make sure the import path is correct
import Factura from './components/factura'; // make sure the import path is correct
import './App.css';

function App() {
  return (
    <Router>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Consumos />} />
        <Route path="/regulados" element={<Regulados />} />
        <Route path="/Potencia" element={<Potencia />} />
        <Route path="/WMAPE" element={<WMAPE />} />
        <Route path="/factura" element={<Factura />} />
        {/* other routes if any */}
      </Routes>
    </Router>
  );
}

export default App;
