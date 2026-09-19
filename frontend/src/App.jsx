import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaPrivada from './components/RutaPrivada';

import Login from './pages/Login';
import Home from './pages/Home';
import Inscripcion from './pages/Inscripcion';
import ArmadoEquipos from './pages/ArmadoEquipos';
import Historial from './pages/Historial';
import DetallePartido from './pages/DetallePartido';
import CargarResultado from './pages/CargarResultado';
import Calificar from './pages/Calificar';
import Perfil from './pages/Perfil';
import Feed from './pages/Feed';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<RutaPrivada><Home /></RutaPrivada>} />
          <Route path="/inscripcion" element={<RutaPrivada><Inscripcion /></RutaPrivada>} />
          <Route path="/historial" element={<RutaPrivada><Historial /></RutaPrivada>} />
          <Route path="/partido/:id" element={<RutaPrivada><DetallePartido /></RutaPrivada>} />
          <Route path="/calificar" element={<RutaPrivada><Calificar /></RutaPrivada>} />
          <Route path="/perfil" element={<RutaPrivada><Perfil /></RutaPrivada>} />
          <Route path="/perfil/:id" element={<RutaPrivada><Perfil /></RutaPrivada>} />
          <Route path="/feed" element={<RutaPrivada><Feed /></RutaPrivada>} />

          <Route path="/admin/armado-equipos" element={<RutaPrivada soloAdmin><ArmadoEquipos /></RutaPrivada>} />
          <Route path="/admin/partido/:id/resultado" element={<RutaPrivada soloAdmin><CargarResultado /></RutaPrivada>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
