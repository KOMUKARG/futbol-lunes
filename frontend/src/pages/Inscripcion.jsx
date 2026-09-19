import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

export default function Inscripcion() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [partido, setPartido] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    try {
      const { data } = await api.get('/partidos/proximo');
      setPartido(data);
    } catch {
      setPartido(null);
    }
  }

  useEffect(() => { cargar(); }, []);

  if (!partido) {
    return (
      <div className="app-shell">
        <div className="header"><Link to="/"><BackIcon /></Link><div className="disp" style={{ fontWeight: 800, fontSize: 19 }}>Inscripción</div></div>
        <div className="content"><div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>No hay un partido abierto todavía.</div></div>
        <BottomNav />
      </div>
    );
  }

  const confirmados = partido.inscripciones.filter((i) => i.estado === 'confirmado');
  const espera = partido.inscripciones.filter((i) => i.estado === 'espera');
  const miInscripcion = partido.inscripciones.find((i) => i.jugador.id === usuario.id && i.estado !== 'baja');

  async function anotarme() {
    setError('');
    try {
      await api.post(`/partidos/${partido.id}/inscripciones`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo completar la inscripción.');
    }
  }

  async function darseDeBaja() {
    setError('');
    try {
      await api.delete(`/partidos/${partido.id}/inscripciones/me`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo dar de baja.');
    }
  }

  return (
    <div className="app-shell">
      <div className="header">
        <Link to="/"><BackIcon /></Link>
        <div className="disp" style={{ fontWeight: 800, fontSize: 19 }}>
          Inscripción — {new Date(partido.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
        </div>
      </div>

      <div className="content">
        <div style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>
            {partido.estado === 'abierto' ? 'Inscripción abierta' : 'Inscripción cerrada'}
          </div>
          <div style={{ fontSize: 11 }}>hasta completar el cupo de 14 jugadores</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="disp" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
            {confirmados.length}<span style={{ fontSize: 26, color: '#C9C6BC' }}>/14</span>
          </div>
          <div className="label">anotados</div>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</div>}

        {!miInscripcion && partido.estado === 'abierto' && (
          <button className="btn-primary" onClick={anotarme}>Anotarme</button>
        )}

        <div>
          <div className="disp" style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Confirmados</div>
          <div className="card" style={{ padding: '6px 16px' }}>
            {confirmados.map((i) => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F0EEE8' }}>
                <div className="avatar" style={{ width: 32, height: 32, background: colorPara(i.jugador.id), fontSize: 12 }}>
                  {i.jugador.nombre.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flexGrow: 1, fontSize: 13, fontWeight: 600 }}>
                  {i.jugador.id === usuario.id ? 'Vos' : i.jugador.nombre}
                </div>
                <div className={i.jugador.autopercepcion === 'blanco' ? 'dot-blanco' : 'dot-oscuro'} />
              </div>
            ))}
            {confirmados.length === 0 && <div style={{ padding: '14px 0', color: 'var(--muted)', fontSize: 13 }}>Todavía nadie se anotó.</div>}
          </div>
        </div>

        <div>
          <div className="disp" style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Lista de espera ({espera.length})</div>
          {espera.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              Vacía por ahora. Si alguien se da de baja, el primero de esta lista pasa a confirmado automáticamente.
            </div>
          ) : (
            <div className="card" style={{ padding: '6px 16px' }}>
              {espera.map((i) => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F0EEE8' }}>
                  <div style={{ flexGrow: 1, fontSize: 13, fontWeight: 600 }}>{i.jugador.nombre}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {miInscripcion && (
          <button className="btn-danger-outline" onClick={darseDeBaja}>Darme de baja</button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// Genera un color estable a partir del id, para que cada avatar tenga un color consistente
function colorPara(id) {
  const colores = ['#2E7D4F', '#4A6FA5', '#B8862E', '#A5524A', '#6B5CA5'];
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % colores.length;
  return colores[hash];
}

function BackIcon() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
    </div>
  );
}
