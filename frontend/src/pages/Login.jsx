import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="disp" style={{ fontWeight: 800, fontSize: 32 }}>
            FÚTBOL <span style={{ color: 'var(--accent)' }}>LUNES</span>
          </div>
          <div className="label" style={{ marginTop: 4 }}>Iniciá sesión para anotarte</div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
          ¿No tenés cuenta? Pedile al administrador del grupo que te dé de alta.
        </div>
      </div>
    </div>
  );
}
