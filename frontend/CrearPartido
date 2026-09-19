import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

// Calcula la fecha del próximo lunes (o hoy si es lunes) en formato yyyy-mm-dd
function proximoLunes() {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0=domingo, 1=lunes...
  const diff = (8 - dia) % 7 || 7; // días hasta el próximo lunes (si hoy es lunes, salta al siguiente)
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + (dia === 1 ? 0 : diff));
  return lunes.toISOString().slice(0, 10);
}

export default function CrearPartido() {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(proximoLunes());
  const [abrirYa, setAbrirYa] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

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
      setError(e.response?.data?.error || 'No se pudo crear el partido.');
    } finally {
      setCargando(false);
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
