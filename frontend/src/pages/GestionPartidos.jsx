import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const ESTADO_INFO = {
  abierto: { label: 'Inscripción abierta', color: 'var(--accent)' },
  cerrado: { label: 'Inscripción cerrada', color: '#8A6414' },
  jugado: { label: 'Jugado', color: 'var(--muted)' },
  cancelado: { label: 'Cancelado', color: 'var(--danger)' },
};

export default function GestionPartidos() {
  const [partidos, setPartidos] = useState(null);
  const [ocupado, setOcupado] = useState(null); // id del partido con una acción en curso
  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, []);

  function cargar() {
    api.get('/partidos').then((res) => setPartidos(res.data));
  }

  async function cancelar(id) {
    setError('');
    setOcupado(id);
    try {
      await api.patch(`/partidos/${id}/estado`, { estado: 'cancelado' });
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo cancelar el partido.');
    } finally {
      setOcupado(null);
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este partido? Se borran también sus inscripciones, equipos, goles y calificaciones. Esta acción no se puede deshacer.')) return;
    setError('');
    setOcupado(id);
    try {
      await api.delete(`/partidos/${id}`);
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo eliminar el partido.');
    } finally {
      setOcupado(null);
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
        <div className="disp" style={{ fontWeight: 800, fontSize: 18, flexGrow: 1 }}>Gestionar partidos</div>
        <div style={{ background: 'var(--ink)', color: '#E8C87A', fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 16 }}>ADMIN</div>
      </div>

      <div className="content">
        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>
          Solo puede haber un partido "abierto" o "cerrado" a la vez para que Home, Inscripción y Armado de equipos funcionen sobre el correcto. Si hay más de uno activo, cancelá o eliminá los que sobren.
        </div>

        <Link to="/admin/nuevo-partido"><button className="btn-primary">+ Crear partido</button></Link>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

        {partidos === null && <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando…</div>}

        {partidos?.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>Todavía no hay partidos cargados.</div>
        )}

        {partidos?.map((p) => {
          const info = ESTADO_INFO[p.estado] || { label: p.estado, color: 'var(--muted)' };
          const activo = ocupado === p.id;
          return (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {new Date(p.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: info.color }}>{info.label}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/partido/${p.id}`} style={{ flex: 1 }}><button className="btn-outline" style={{ width: '100%' }}>Ver detalle</button></Link>
                {(p.estado === 'abierto' || p.estado === 'cerrado') && (
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => cancelar(p.id)} disabled={activo}>
                    {activo ? '…' : 'Cancelar'}
                  </button>
                )}
                <button
                  style={{ flex: 1, border: '1.5px solid var(--danger)', color: 'var(--danger)', background: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => eliminar(p.id)}
                  disabled={activo}
                >
                  {activo ? '…' : 'Eliminar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
