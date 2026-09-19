import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfiguracionProvider } from './context/ConfiguracionContext';
import RutaPrivada from './components/RutaPrivada';

import Login from './pages/Login';
import Home from './pages/Home';
import Inscripcion from './pages/Inscripcion';
import ArmadoEquipos from './pages/ArmadoEquipos';
import Historial from './pages/Historial';
import DetallePartido from './pages/DetallePartido';
import CargarResultado from './pages/CargarResultado';
import Calificar from './pages/Calificar';
import CalificarCompaneros from './pages/CalificarCompaneros';
import Jugadores from './pages/Jugadores';
import Perfil from './pages/Perfil';
import Feed from './pages/Feed';
import AltaJugador from './pages/AltaJugador';
import CrearPartido from './pages/CrearPartido';
import EscudosConfig from './pages/EscudosConfig';
import GestionPartidos from './pages/GestionPartidos';

export default function App() {
  return (
    <AuthProvider>
      <ConfiguracionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<RutaPrivada><Home /></RutaPrivada>} />
            <Route path="/inscripcion" element={<RutaPrivada><Inscripcion /></RutaPrivada>} />
            <Route path="/jugadores" element={<RutaPrivada><Jugadores /></RutaPrivada>} />
            <Route path="/historial" element={<RutaPrivada><Historial /></RutaPrivada>} />
            <Route path="/partido/:id" element={<RutaPrivada><DetallePartido /></RutaPrivada>} />
            <Route path="/partido/:id/calificar-companeros" element={<RutaPrivada><CalificarCompaneros /></RutaPrivada>} />
            <Route path="/calificar" element={<RutaPrivada><Calificar /></RutaPrivada>} />
            <Route path="/perfil" element={<RutaPrivada><Perfil /></RutaPrivada>} />
            <Route path="/perfil/:id" element={<RutaPrivada><Perfil /></RutaPrivada>} />
            <Route path="/feed" element={<RutaPrivada><Feed /></RutaPrivada>} />

            <Route path="/admin/armado-equipos" element={<RutaPrivada soloAdmin><ArmadoEquipos /></RutaPrivada>} />
            <Route path="/admin/partido/:id/resultado" element={<RutaPrivada soloAdmin><CargarResultado /></RutaPrivada>} />
            <Route path="/admin/nuevo-jugador" element={<RutaPrivada soloAdmin><AltaJugador /></RutaPrivada>} />
            <Route path="/admin/nuevo-partido" element={<RutaPrivada soloAdmin><CrearPartido /></RutaPrivada>} />
            <Route path="/admin/escudos" element={<RutaPrivada soloAdmin><EscudosConfig /></RutaPrivada>} />
            <Route path="/admin/partidos" element={<RutaPrivada soloAdmin><GestionPartidos /></RutaPrivada>} />
          </Routes>
        </BrowserRouter>
      </ConfiguracionProvider>
    </AuthProvider>
  );
}
