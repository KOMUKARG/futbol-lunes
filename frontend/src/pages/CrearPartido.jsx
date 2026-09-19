import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

// Formatea un Date a yyyy-mm-dd usando SIEMPRE los componentes locales
// (evita el bug clásico de toISOString(), que convierte a UTC y puede
// correr la fecha un día para atrás/adelante según la zona horaria).
function aFechaLocal(date) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Calcula la fecha del próximo lunes (o hoy si es lunes)
function proximoLunes() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes...
  const diff = diaSemana === 1 ? 0 : (8 - diaSemana) % 7 || 7;
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diff);
  return aFechaLocal(lunes);
}

const ESTADOS_LABEL = { abierto: 'Inscripción abierta', cerrado: 'Inscripción cerrada', jugado: 'Jugado', cancelado: 'Cancelado' };

export default function CrearPartido() {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(proximoLunes());
  const [abrirYa, setAbrirYa] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [proximo, setProximo] = useState(undefined); // undefined = cargando, null = no hay
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    cargarProximo();
  }, []);

  function cargarProximo() {
    api.get('/partidos/proximo')
      .then((res) => setProximo(res.data))
      .catch(() => setProximo(null));
  }

  async function crear() {
    setError('');
    setCargando(true);
    try {
      const res = await api.post('/partidos', { fecha });
      if (abrirYa) {
        await api.patch(`/partidos/${res.data.id}/estado`, { estado: 'abierto' });
      }
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo crear el partido. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  async function cancelarProximo() {
    if (!proximo) return;
    setCancelando(true);
    setError('');
    try {
      await api.patch(`/partidos/${proximo.id}/estado`, { estado: 'cancelado' });
      cargarProximo();
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo cancelar el partido.');
    } finally {
      setCancelando(false);
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
        <div className="disp" style={{ fontWeight: 800, fontSize: 18 }}>Nuevo partido</div>
      </div>

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {proximo === undefined && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Buscando si ya hay un próximo partido…</div>
        )}

        {proximo && (
          <div className="card" style={{ borderColor: '#F0DDBE', background: '#FFFBF3', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#8A6414', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Ya hay un partido programado
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {new Date(proximo.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Estado: {ESTADOS_LABEL[proximo.estado] || proximo.estado}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>
              Mientras este partido siga abierto o cerrado (no cancelado ni jugado), la app lo va a seguir mostrando como "el próximo partido" aunque crees uno nuevo con otra fecha.
            </div>
            <button className="btn-outline" onClick={cancelarProximo} disabled={cancelando}>
              {cancelando ? 'Cancelando…' : 'Cancelar este partido'}
            </button>
          </div>
        )}

        <div>
          <div className="label">Fecha del partido</div>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={abrirYa} onChange={(e) => setAbrirYa(e.target.checked)} />
          Abrir la inscripción apenas se crea
        </label>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

        <button className="btn-primary" onClick={crear} disabled={cargando}>
          {cargando ? 'Creando...' : 'Crear partido'}
        </button>
      </div>
    </div>
  );
}
