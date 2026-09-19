import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DetallePartido() {
  const { id } = useParams();
  const { usuario, esAdmin } = useAuth();
  const [partido, setPartido] = useState(null);

  useEffect(() => {
    api.get(`/partidos/${id}`).then((res) => setPartido(res.data));
  }, [id]);

  async function votarMVP(jugadorVotadoId) {
    await api.post(`/partidos/${id}/mvp`, { jugadorVotadoId });
    const { data } = await api.get(`/partidos/${id}`);
    setPartido(data);
  }

  if (!partido) return null;

  const equipoOscuro = partido.equipos.find((e) => e.color === 'oscuro');
  const equipoBlanco = partido.equipos.find((e) => e.color === 'blanco');
  const golesPorJugador = agruparGoles(partido.goles);

  const horasDesdePartido = (Date.now() - new Date(partido.fecha).getTime()) / 36e5;
  const puedeVotarMVP = partido.estado === 'jugado' && horasDesdePartido <= 24;

  return (
    <div className="app-shell">
      <div className="header">
        <Link to="/historial">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </div>
        </Link>
        <div className="disp" style={{ fontWeight: 800, fontSize: 19 }}>
          {new Date(partido.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
        </div>
      </div>

      <div className="content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="dot-oscuro" style={{ margin: '0 auto 6px' }} />
            <div className="disp" style={{ fontWeight: 800, fontSize: 14 }}>OSCUROS</div>
            <div className="disp" style={{ fontSize: 52, fontWeight: 800 }}>{partido.golesOscuros ?? '-'}</div>
          </div>
          <div style={{ fontSize: 11, color: '#9A9EA8', fontWeight: 800, marginTop: 26 }}>FINAL</div>
          <div style={{ textAlign: 'center' }}>
            <div className="dot-blanco" style={{ margin: '0 auto 6px' }} />
            <div className="disp" style={{ fontWeight: 800, fontSize: 14 }}>BLANCOS</div>
            <div className="disp" style={{ fontSize: 52, fontWeight: 800 }}>{partido.golesBlancos ?? '-'}</div>
          </div>
        </div>

        {partido.mvp && (
          <div className="card" style={{ background: 'var(--gold-bg)', borderColor: '#F0E2B8', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar" style={{ width: 38, height: 38, background: 'var(--gold)' }}>★</div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8A6A1F', textTransform: 'uppercase' }}>MVP del partido</div>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{partido.mvp.nombre} — {partido.mvp.votos} votos</div>
            </div>
          </div>
        )}

        {puedeVotarMVP && (
          <div className="card">
            <div className="label" style={{ marginBottom: 8 }}>Votá al MVP (24 hs desde el partido)</div>
            <select onChange={(e) => e.target.value && votarMVP(e.target.value)} defaultValue="">
              <option value="" disabled>Elegí un jugador…</option>
              {[...(equipoOscuro?.jugadores || []), ...(equipoBlanco?.jugadores || [])]
                .filter((ej) => ej.jugador.id !== usuario.id)
                .map((ej) => (
                  <option key={ej.jugador.id} value={ej.jugador.id}>{ej.jugador.nombre}</option>
                ))}
            </select>
          </div>
        )}

        <div>
          <div className="disp" style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Goleadores</div>
          <div className="card" style={{ padding: '6px 16px' }}>
            {golesPorJugador.map((g) => (
              <div key={g.jugadorId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F0EEE8' }}>
                <div className={g.equipoColor === 'blanco' ? 'dot-blanco' : 'dot-oscuro'} />
                <div style={{ flexGrow: 1, fontSize: 13, fontWeight: 600 }}>{g.nombre}</div>
                <div style={{ fontSize: 13 }}>{'⚽'.repeat(g.cantidad)}</div>
              </div>
            ))}
            {golesPorJugador.length === 0 && <div style={{ padding: '14px 0', color: 'var(--muted)', fontSize: 13 }}>Sin goles cargados.</div>}
          </div>
        </div>

        <div>
          <div className="disp" style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Planteles</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <PlantelCard titulo="● Oscuros" jugadores={equipoOscuro?.jugadores} />
            <PlantelCard titulo="○ Blancos" jugadores={equipoBlanco?.jugadores} />
          </div>
        </div>

        {esAdmin && (
          <Link to={`/admin/partido/${id}/resultado`}>
            <button className="btn-primary">Editar resultado (Admin)</button>
          </Link>
        )}
      </div>
    </div>
  );
}

function PlantelCard({ titulo, jugadores = [] }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{titulo}</div>
      <div className="card" style={{ padding: '10px 12px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {jugadores.map((ej) => <div key={ej.jugador.id}>{ej.jugador.nombre}</div>)}
        {jugadores.length === 0 && <div style={{ color: 'var(--muted)' }}>Sin datos</div>}
      </div>
    </div>
  );
}

function agruparGoles(goles = []) {
  const mapa = new Map();
  for (const g of goles) {
    const key = g.jugadorId;
    if (!mapa.has(key)) mapa.set(key, { jugadorId: key, nombre: g.jugador.nombre, equipoColor: g.equipoColor, cantidad: 0 });
    mapa.get(key).cantidad += g.cantidad;
  }
  return [...mapa.values()];
}
