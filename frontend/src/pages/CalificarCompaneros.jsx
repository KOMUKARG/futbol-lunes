import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const OPCIONES_PUNTAJE = Array.from({ length: 10 }, (_, i) => i + 1);

export default function CalificarCompaneros() {
  const { id } = useParams();
  const [datos, setDatos] = useState(null); // { habilitado, companeros }
  const [puntajes, setPuntajes] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mvpElegido, setMvpElegido] = useState('');
  const [mvpEnviado, setMvpEnviado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/partidos/${id}/calificacion-companeros-pendientes`)
      .then((res) => {
        setDatos(res.data);
        setPuntajes(Object.fromEntries(
          res.data.companeros.map((c) => [c.id, c.puntajePrevio ? String(c.puntajePrevio) : ''])
        ));
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudo cargar la calificación de este partido.'));
  }, [id]);

  if (error) {
    return (
      <div className="app-shell">
        <Encabezado id={id} />
        <div className="content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{error}</div>
          <Link to={`/partido/${id}`} style={{ marginTop: 16 }}><button className="btn-outline">Volver al partido</button></Link>
        </div>
      </div>
    );
  }

  if (!datos) return null;

  if (!datos.habilitado) {
    return (
      <div className="app-shell">
        <Encabezado id={id} />
        <div className="content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div className="disp" style={{ fontSize: 20, fontWeight: 800 }}>La ventana ya cerró</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
            Tenías 24 horas desde el final del partido para calificar a tus compañeros.
          </div>
          <Link to={`/partido/${id}`} style={{ marginTop: 16 }}><button className="btn-outline">Volver al partido</button></Link>
        </div>
      </div>
    );
  }

  async function enviarPuntuaciones() {
    setEnviando(true);
    try {
      const calificaciones = Object.entries(puntajes)
        .filter(([, valor]) => valor !== '')
        .map(([jugadorId, valor]) => ({ jugadorId, puntaje: Number(valor) }));
      await api.post(`/partidos/${id}/calificaciones-companeros`, { calificaciones });
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarMVP() {
    if (!mvpElegido) return;
    await api.post(`/partidos/${id}/mvp`, { jugadorVotadoId: mvpElegido });
    setMvpEnviado(true);
  }

  return (
    <div className="app-shell">
      <Encabezado id={id} />

      <div className="content">
        <div style={{ background: '#FDF6E9', borderRadius: 12, padding: '12px 14px', fontSize: 11.5, color: '#6B5A2E', lineHeight: 1.4 }}>
          ⏱ Tenés 24 horas desde el final del partido. Puntaje general del 1 al 10 para cada compañero que jugó.
        </div>

        <div className="card" style={{ padding: '6px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px' }}>
            <div style={{ flexGrow: 1, fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Jugador</div>
            <div style={{ width: 78, fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'center' }}>Puntaje</div>
          </div>
          {datos.companeros.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderTop: '1px solid #F0EEE8' }}>
              <div className="avatar" style={{ width: 36, height: 36, background: '#4A6FA5', fontSize: 13, overflow: 'hidden' }}>
                {c.foto ? <img src={c.foto} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.nombre.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.posicion || 'Sin posición'}</div>
              </div>
              <select
                style={{ width: 78 }}
                value={puntajes[c.id] || ''}
                onChange={(e) => setPuntajes((p) => ({ ...p, [c.id]: e.target.value }))}
              >
                <option value="">—</option>
                {OPCIONES_PUNTAJE.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}
          {datos.companeros.length === 0 && (
            <div style={{ padding: '14px 12px', color: 'var(--muted)', fontSize: 13 }}>No hay compañeros para calificar.</div>
          )}
        </div>

        <button className="btn-primary" onClick={enviarPuntuaciones} disabled={enviando || enviado}>
          {enviado ? '✓ Puntuaciones enviadas' : enviando ? 'Enviando…' : 'Enviar puntuaciones'}
        </button>

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

        <div>
          <div className="disp" style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>¿Quién fue el MVP?</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Elegí al mejor jugador de la cancha en este partido.</div>
          <select value={mvpElegido} onChange={(e) => setMvpElegido(e.target.value)} disabled={mvpEnviado}>
            <option value="">Seleccionar jugador…</option>
            {datos.companeros.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <button className="btn-primary" style={{ background: 'var(--accent)' }} onClick={confirmarMVP} disabled={!mvpElegido || mvpEnviado}>
          {mvpEnviado ? '✓ Voto a MVP confirmado' : 'Confirmar voto a MVP'}
        </button>
      </div>
    </div>
  );
}

function Encabezado({ id }) {
  return (
    <div className="header">
      <Link to={`/partido/${id}`}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </div>
      </Link>
      <div className="disp" style={{ fontWeight: 800, fontSize: 18, flexGrow: 1 }}>Calificar el partido</div>
    </div>
  );
}
