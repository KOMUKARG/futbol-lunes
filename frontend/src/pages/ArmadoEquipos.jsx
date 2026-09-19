import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Escudo from '../components/Escudo';
import { useConfiguracion } from '../context/ConfiguracionContext';

export default function ArmadoEquipos() {
  const navigate = useNavigate();
  const [partido, setPartido] = useState(null);
  const [oscuros, setOscuros] = useState([]);
  const [blancos, setBlancos] = useState([]);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    api.get('/partidos/proximo').then(async (res) => {
      setPartido(res.data);
      const { data } = await api.get(`/partidos/${res.data.id}/equipos/sugerencia`);
      setOscuros(data.oscuros.jugadores);
      setBlancos(data.blancos.jugadores);
    });
  }, []);

  if (!partido) return null;

  function mover(jugador, desde, hacia) {
    const quitarDe = desde === 'oscuros' ? oscuros : blancos;
    const ponerEn = hacia === 'oscuros' ? setOscuros : setBlancos;
    const sacarDe = desde === 'oscuros' ? setOscuros : setBlancos;
    sacarDe(quitarDe.filter((j) => j.id !== jugador.id));
    ponerEn((prev) => [...prev, jugador]);
  }

  async function confirmar() {
    setConfirmando(true);
    try {
      await api.post(`/partidos/${partido.id}/equipos/confirmar`, {
        oscuros: oscuros.map((j) => j.id),
        blancos: blancos.map((j) => j.id),
      });
      navigate('/');
    } finally {
      setConfirmando(false);
    }
  }

  const sumaOscuros = oscuros.reduce((a, j) => a + j.puntuacion, 0).toFixed(1);
  const sumaBlancos = blancos.reduce((a, j) => a + j.puntuacion, 0).toFixed(1);

  return (
    <div className="app-shell">
      <div className="header">
        <Link to="/">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </div>
        </Link>
        <div className="disp" style={{ fontWeight: 800, fontSize: 18, flexGrow: 1 }}>Armado de equipos</div>
        <div style={{ background: 'var(--ink)', color: '#E8C87A', fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 16 }}>ADMIN</div>
      </div>

      <div className="content">
        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
          {oscuros.length + blancos.length} confirmados · sugerencia por puntuación total. Tocá un jugador para pasarlo de equipo.
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Columna titulo="OSCUROS" puntos={sumaOscuros} jugadores={oscuros} onMover={(j) => mover(j, 'oscuros', 'blancos')} color="oscuro" />
          <Columna titulo="BLANCOS" puntos={sumaBlancos} jugadores={blancos} onMover={(j) => mover(j, 'blancos', 'oscuros')} color="blanco" />
        </div>

        <Link to="/admin/escudos" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 2.5 4.5 5.8v5.4c0 5.3 3.2 9.3 7.5 10.8 4.3-1.5 7.5-5.5 7.5-10.8V5.8L12 2.5z" /></svg>
            <div style={{ flexGrow: 1, fontSize: 12.5, fontWeight: 700 }}>Cambiar escudos de los equipos</div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9A9EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </div>
        </Link>
      </div>

      <div style={{ padding: 20, background: '#fff', borderTop: '1px solid var(--border)' }}>
        <button className="btn-primary" onClick={confirmar} disabled={confirmando}>
          {confirmando ? 'Confirmando…' : 'Confirmar y notificar equipos'}
        </button>
      </div>
    </div>
  );
}

function Columna({ titulo, puntos, jugadores, onMover, color }) {
  const { escudoOscuroUrl, escudoBlancoUrl } = useConfiguracion();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Escudo color={color} url={color === 'blanco' ? escudoBlancoUrl : escudoOscuroUrl} size={14} />
        <div className="disp" style={{ fontWeight: 800, fontSize: 15 }}>{titulo}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{puntos} pts</div>
      <div className="card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {jugadores.map((j) => (
          <button
            key={j.id}
            onClick={() => onMover(j)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0', border: 'none', background: 'none', borderBottom: '1px solid #F0EEE8', cursor: 'pointer', textAlign: 'left' }}
          >
            <div className="avatar" style={{ width: 22, height: 22, background: '#4A6FA5', fontSize: 9 }}>{j.puntuacion.toFixed(1)}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600 }}>{j.nombre}</div>
          </button>
        ))}
        {jugadores.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>Sin jugadores</div>}
      </div>
    </div>
  );
}
