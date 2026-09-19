import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function AltaJugador() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('jugador');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);

  async function guardar() {
    setError('');
    setOk('');
    if (!nombre || !email || !password) {
      setError('Completá nombre, email y contraseña.');
      return;
    }
    setCargando(true);
    try {
      await api.post('/usuarios', { nombre, email, password, rol });
      setOk(`Jugador "${nombre}" creado correctamente.`);
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('jugador');
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo crear el jugador.');
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
        <div className="disp" style={{ fontWeight: 800, fontSize: 18 }}>Nuevo jugador</div>
      </div>

      <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div className="label">Nombre</div>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Martín Gómez" />
        </div>
        <div>
          <div className="label">Email</div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" />
        </div>
        <div>
          <div className="label">Contraseña</div>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña inicial" />
        </div>
        <div>
          <div className="label">Rol</div>
          <select value={rol} onChange={(e) => setRol(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <option value="jugador">Jugador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        {ok && <div style={{ color: 'var(--accent)', fontSize: 13 }}>{ok}</div>}

        <button className="btn-primary" onClick={guardar} disabled={cargando}>
          {cargando ? 'Creando...' : 'Crear jugador'}
        </button>
      </div>
    </div>
  );
}
