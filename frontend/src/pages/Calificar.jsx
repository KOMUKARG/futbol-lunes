import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useConfiguracion } from '../context/ConfiguracionContext';

const CONCEPTOS = [
  { key: 'nivelTecnico', label: 'Nivel técnico' },
  { key: 'actitud', label: 'Actitud / juego limpio' },
  { key: 'puntualidad', label: 'Puntualidad' },
  { key: 'juegoEnEquipo', label: 'Juego en equipo' },
  { key: 'velocidad', label: 'Velocidad' },
  { key: 'regate', label: 'Regate' },
  { key: 'cabezazo', label: 'Cabezazo' },
  { key: 'habilidadTactica', label: 'Habilidad táctica' },
  { key: 'remate', label: 'Remate' },
];

export default function Calificar() {
  const { esAdmin } = useAuth();
  const { calificacionesAbiertas, recargarConfiguracion } = useConfiguracion();
  const [estado, setEstado] = useState(null); // { abierto, periodo, total, completados, pendientes }
  const [indice, setIndice] = useState(0);
  const [valores, setValores] = useState(() => Object.fromEntries(CONCEPTOS.map((c) => [c.key, 3])));
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  useEffect(() => {
    api.get('/calificaciones/pendientes').then((res) => setEstado(res.data));
  }, [calificacionesAbiertas]);

  async function toggleAbierto() {
    setCambiandoEstado(true);
    try {
      await api.patch('/configuracion', { calificacionesAbiertas: !calificacionesAbiertas });
      await recargarConfiguracion();
      const { data } = await api.get('/calificaciones/pendientes');
      setEstado(data);
    } finally {
      setCambiandoEstado(false);
    }
  }

  if (!estado) return null;

  const panelAdmin = esAdmin && (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, borderColor: '#F0DDBE', background: '#FFFBF3' }}>
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#8A6414', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Panel de administrador</div>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>
          Calificaciones trimestrales: <span style={{ color: calificacionesAbiertas ? 'var(--accent)' : 'var(--danger)' }}>{calificacionesAbiertas ? 'ABIERTAS' : 'CERRADAS'}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Vos decidís cuándo abrirlas y cerrarlas.</div>
      </div>
      <button
        onClick={toggleAbierto}
        disabled={cambiandoEstado}
        style={{
          width: 42, height: 24, borderRadius: 20, border: 'none', position: 'relative', flexShrink: 0, cursor: 'pointer',
          background: calificacionesAbiertas ? 'var(--accent)' : '#D8D5CD',
        }}
        aria-label="Abrir o cerrar las calificaciones trimestrales"
      >
        <div style={{
          position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)', left: calificacionesAbiertas ? 20 : 2, transition: 'left .15s',
        }} />
      </button>
    </div>
  );

  if (!estado.abierto) {
    return (
      <div className="app-shell">
        <div className="header">
          <Link to="/">
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </div>
          </Link>
          <div className="disp" style={{ fontWeight: 800, fontSize: 18, flexGrow: 1 }}>Calificar — {estado.periodo}</div>
        </div>
        <div className="content">
          {panelAdmin}
          {!esAdmin && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EFEDE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9A9EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v1" /></svg>
              </div>
              <div className="disp" style={{ fontSize: 20, fontWeight: 800 }}>Calificaciones cerradas</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                El administrador todavía no abrió la calificación trimestral. Te vamos a avisar cuando esté disponible.
              </div>
              <Link to="/" style={{ width: '100%' }}><button className="btn-outline">Volver al inicio</button></Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (estado.pendientes.length === 0) {
    return (
      <div className="app-shell">
        <div className="content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          {panelAdmin}
          <div className="disp" style={{ fontSize: 22, fontWeight: 800 }}>¡Ya calificaste a todos!</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>Gracias por completar las calificaciones de {estado.periodo}.</div>
          <Link to="/" style={{ marginTop: 16 }}><button className="btn-outline">Volver al inicio</button></Link>
        </div>
      </div>
    );
  }

  const jugador = estado.pendientes[indice];
  const progresoTotal = estado.total - 1; // no se cuenta a uno mismo
  const completados = estado.completados;

  async function guardarYSeguir() {
    setGuardando(true);
    try {
      await api.post('/calificaciones', { jugadorCalificadoId: jugador.id, ...valores });
      if (indice + 1 < estado.pendientes.length) {
        setIndice(indice + 1);
        setValores(Object.fromEntries(CONCEPTOS.map((c) => [c.key, 3])));
      } else {
        const { data } = await api.get('/calificaciones/pendientes');
        setEstado(data);
        setIndice(0);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="header">
        <Link to="/">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </div>
        </Link>
        <div className="disp" style={{ fontWeight: 800, fontSize: 18, flexGrow: 1 }}>Calificar — {estado.periodo}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{completados}/{progresoTotal}</div>
      </div>
      <div style={{ height: 3, background: 'var(--border)' }}>
        <div style={{ width: `${(completados / progresoTotal) * 100}%`, height: '100%', background: 'var(--accent)' }} />
      </div>

      <div className="content">
        {panelAdmin}

        <div style={{ background: '#EFF4F1', borderRadius: 12, padding: '12px 14px', fontSize: 11.5, color: '#3F5A48' }}>
          🔒 Tus calificaciones son 100% anónimas. Nadie sabrá qué puntaje le pusiste a cada jugador.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="avatar" style={{ width: 52, height: 52, background: '#4A6FA5', fontSize: 18 }}>
            {jugador.nombre.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="disp" style={{ fontWeight: 800, fontSize: 20 }}>{jugador.nombre}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{jugador.posicion || 'Sin posición'}</div>
          </div>
        </div>

        {CONCEPTOS.map((c) => (
          <div key={c.key}>
            <div className="label" style={{ marginBottom: 10 }}>{c.label}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setValores((v) => ({ ...v, [c.key]: n }))}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    background: valores[c.key] === n ? 'var(--ink)' : '#fff',
                    color: valores[c.key] === n ? '#fff' : 'var(--muted)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 20, background: '#fff', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, position: 'sticky', bottom: 0 }}>
        <Link to="/" style={{ flex: 1 }}><button className="btn-outline">Guardar y salir</button></Link>
        <button className="btn-primary" style={{ flex: 1 }} onClick={guardarYSeguir} disabled={guardando}>
          {indice + 1 < estado.pendientes.length ? 'Siguiente ›' : 'Terminar'}
        </button>
      </div>
    </div>
  );
}
