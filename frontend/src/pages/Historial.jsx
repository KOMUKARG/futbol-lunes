import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';

export default function Historial() {
  const [partidos, setPartidos] = useState([]);

  useEffect(() => {
    api.get('/partidos').then((res) => setPartidos(res.data.filter((p) => p.estado === 'jugado')));
  }, []);

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 18px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="dot-oscuro" />
          <div className="disp" style={{ fontWeight: 800, fontSize: 18 }}>OSCUROS</div>
        </div>
        <div className="label">Historial</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="disp" style={{ fontWeight: 800, fontSize: 18 }}>BLANCOS</div>
          <div className="dot-blanco" />
        </div>
      </div>

      <div className="content">
        {partidos.map((p) => (
          <MatchCard key={p.id} partido={p} />
        ))}
        {partidos.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>Todavía no hay partidos jugados.</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function MatchCard({ partido }) {
  const osc = partido.golesOscuros ?? 0;
  const bla = partido.golesBlancos ?? 0;
  let gradiente = 'linear-gradient(to right, #FCF1E3 50%, #FCF1E3 50%)'; // empate
  if (osc > bla) gradiente = 'linear-gradient(to right, #DCF0E2 50%, #FBDCD8 50%)';
  if (bla > osc) gradiente = 'linear-gradient(to right, #FBDCD8 50%, #DCF0E2 50%)';

  return (
    <Link to={`/partido/${partido.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ background: gradiente, borderColor: 'var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="label">
          {new Date(partido.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="dot-oscuro" /><div className="disp" style={{ fontSize: 24, fontWeight: 800 }}>{osc}</div></div>
          <div style={{ fontSize: 10, color: '#9A9EA8', fontWeight: 700 }}>FINAL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="disp" style={{ fontSize: 24, fontWeight: 800 }}>{bla}</div><div className="dot-blanco" /></div>
        </div>
        {partido.mvp && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>★ MVP: {partido.mvp.nombre}</div>}
      </div>
    </Link>
  );
}
