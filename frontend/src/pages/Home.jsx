import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { usuario, esAdmin } = useAuth();
  const [proximo, setProximo] = useState(null);
  const [ultimo, setUltimo] = useState(null);

  useEffect(() => {
    api.get('/partidos/proximo').then((res) => setProximo(res.data)).catch(() => setProximo(null));
    api.get('/partidos').then((res) => {
      const jugados = res.data.filter((p) => p.estado === 'jugado');
      setUltimo(jugados[0] || null);
    });
  }, []);

  const confirmados = proximo?.inscripciones?.filter((i) => i.estado === 'confirmado').length || 0;

  return (
    <div className="app-shell">
      <div className="header">
        <div className="disp" style={{ fontWeight: 800, fontSize: 22, flexGrow: 1 }}>
          FÚTBOL <span style={{ color: 'var(--accent)' }}>LUNES</span>
        </div>
        <div className="avatar" style={{ width: 34, height: 34, background: 'var(--accent)', fontSize: 13 }}>
          {(usuario?.nombre || '?').slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="content">
        {proximo && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="label">
                Próximo partido · {new Date(proximo.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </div>
              <div style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
                {proximo.estado === 'abierto' ? 'ABIERTA' : 'CERRADA'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="disp" style={{ fontSize: 46, fontWeight: 800, lineHeight: 1 }}>
                {confirmados}<span style={{ fontSize: 22, color: '#9A9EA8' }}>/14</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
                {14 - confirmados > 0 ? `${14 - confirmados} lugares libres` : 'Cupo completo'}
              </div>
            </div>
            <Link to="/inscripcion"><button className="btn-primary">Ver inscripción</button></Link>
          </div>
        )}

        {ultimo && (
          <Link to={`/partido/${ultimo.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="label">Último resultado</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="dot-oscuro" /><div className="disp" style={{ fontSize: 30, fontWeight: 800 }}>{ultimo.golesOscuros}</div>
                </div>
                <div style={{ fontSize: 11, color: '#9A9EA8', fontWeight: 700 }}>FINAL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="disp" style={{ fontSize: 30, fontWeight: 800 }}>{ultimo.golesBlancos}</div><div className="dot-blanco" />
                </div>
              </div>
              {ultimo.mvp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
                  ★ MVP: {ultimo.mvp.nombre || 'jugador votado'}
                </div>
              )}
            </div>
          </Link>
        )}

        {!proximo && !ultimo && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Todavía no hay partidos cargados.
          </div>
        )}

               {esAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/admin/nuevo-partido">
              <button className="btn-outline">📅 Crear partido (Admin)</button>
            </Link>
            <Link to="/admin/nuevo-jugador">
              <button className="btn-outline">➕ Nuevo jugador (Admin)</button>
            </Link>
            {proximo && (
              <Link to="/admin/armado-equipos">
                <button className="btn-outline">⚙ Armar equipos (Admin)</button>
              </Link>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
