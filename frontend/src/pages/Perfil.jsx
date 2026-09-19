import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

export default function Perfil() {
  const { id } = useParams();
  const { usuario, setUsuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [evolucion, setEvolucion] = useState([]);
  const [editando, setEditando] = useState(false);
  const [intereses, setIntereses] = useState('');

  const esPropio = !id || id === usuario.id;
  const idAMostrar = id || usuario.id;

  useEffect(() => {
    api.get(`/usuarios/${idAMostrar}`).then((res) => { setPerfil(res.data); setIntereses(res.data.intereses || ''); });
    api.get(`/usuarios/${idAMostrar}/evolucion-puntuacion`).then((res) => setEvolucion(res.data));
  }, [idAMostrar]);

  if (!perfil) return null;

  async function guardarIntereses() {
    const { data } = await api.patch('/usuarios/me', { intereses });
    setPerfil((p) => ({ ...p, intereses: data.intereses }));
    setUsuario((u) => ({ ...u, intereses: data.intereses }));
    setEditando(false);
  }

  const puntuacionActual = evolucion[evolucion.length - 1]?.puntuacion ?? '–';
  const maxPuntaje = Math.max(...evolucion.map((e) => e.puntuacion), 1);

  return (
    <div className="app-shell">
      <div className="header">
        <Link to="/">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </div>
        </Link>
        <div className="disp" style={{ fontWeight: 800, fontSize: 19, flexGrow: 1 }}>{esPropio ? 'Mi Perfil' : perfil.nombre}</div>
      </div>

      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ width: 88, height: 88, background: 'var(--accent)', fontSize: 30 }}>
            {perfil.nombre.slice(0, 1).toUpperCase()}
          </div>
          <div className="disp" style={{ fontSize: 22, fontWeight: 800 }}>{esPropio ? 'Vos' : perfil.nombre}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {perfil.autopercepcion && (
              <div style={{
                background: perfil.autopercepcion === 'blanco' ? '#fff' : 'var(--ink)',
                color: perfil.autopercepcion === 'blanco' ? 'var(--ink)' : '#fff',
                border: perfil.autopercepcion === 'blanco' ? '1.5px solid var(--ink)' : 'none',
                borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
              }}>
                {perfil.autopercepcion === 'blanco' ? 'Blanco' : perfil.autopercepcion === 'oscuro' ? 'Oscuro' : 'Indistinto'}
              </div>
            )}
            {perfil.posicion && <div className="tag">{perfil.posicion}</div>}
          </div>
          <div style={{ display: 'flex', gap: 26, marginTop: 8 }}>
            <Stat valor={puntuacionActual} label="Puntuación" />
            <Stat valor={perfil.stats.vecesMVP} label="Veces MVP" color="var(--gold)" />
            <Stat valor={perfil.stats.partidosJugados} label="Partidos" />
          </div>
        </div>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Edad" valor={perfil.edad ? `${perfil.edad} años` : '–'} />
          <Campo label="Altura" valor={perfil.altura ? `${perfil.altura} m` : '–'} />
          <Campo label="Club" valor={perfil.clubFavorito || '–'} />
          <Campo label="Estado físico" valor={perfil.estadoFisico || '–'} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="label">Intereses</div>
            {esPropio && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{intereses.length}/40</div>}
          </div>
          {esPropio && editando ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={intereses}
                maxLength={40}
                onChange={(e) => setIntereses(e.target.value)}
                placeholder="Ej: Asado, pádel y cine"
                autoFocus
              />
              <button className="btn-primary" style={{ width: 'auto', padding: '0 16px' }} onClick={guardarIntereses}>OK</button>
            </div>
          ) : (
            <div
              onClick={() => esPropio && setEditando(true)}
              style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', cursor: esPropio ? 'pointer' : 'default' }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, color: perfil.intereses ? 'inherit' : 'var(--muted)' }}>
                {perfil.intereses || 'Sin definir'}
              </div>
              {esPropio && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9A9EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              )}
            </div>
          )}
          {esPropio && <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 5 }}>Texto libre y corto — máx. 40 caracteres.</div>}
        </div>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>Evolución de puntuación</div>
          <div className="card" style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            {evolucion.map((e, i) => (
              <div key={e.periodo} style={{
                width: `${100 / Math.max(evolucion.length, 1)}%`,
                height: `${(e.puntuacion / maxPuntaje) * 100}%`,
                background: i === evolucion.length - 1 ? 'var(--accent)' : 'var(--border)',
                borderRadius: '6px 6px 0 0',
              }} />
            ))}
            {evolucion.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, margin: 'auto' }}>Sin calificaciones todavía</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
            {evolucion.map((e) => <span key={e.periodo}>{e.periodo}</span>)}
          </div>
        </div>

        <Link to="/historial"><button className="btn-outline">Ver historial de partidos</button></Link>
      </div>

      <BottomNav />
    </div>
  );
}

function Stat({ valor, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="disp" style={{ fontSize: 24, fontWeight: 800, color: color || 'inherit' }}>{valor}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function Campo({ label, valor }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{valor}</div>
    </div>
  );
}
