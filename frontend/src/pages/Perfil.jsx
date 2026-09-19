import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { comprimirImagen } from '../utils/comprimirImagen';

const CAMPOS_EDITABLES = [
  { key: 'edad', label: 'Edad', tipo: 'number', sufijo: ' años' },
  { key: 'altura', label: 'Altura (m)', tipo: 'number', paso: '0.01' },
  { key: 'posicion', label: 'Posición', tipo: 'text' },
  { key: 'clubFavorito', label: 'Club favorito', tipo: 'text' },
];

const OPCIONES_ESTADO_FISICO = ['Regular', 'Bueno', 'Excelente'];

export default function Perfil() {
  const { id } = useParams();
  const { usuario, setUsuario, esAdmin } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [evolucion, setEvolucion] = useState([]);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [cambiandoAmonestacion, setCambiandoAmonestacion] = useState(false);
  const inputFotoRef = useRef(null);

  const esPropio = !id || id === usuario.id;
  const idAMostrar = id || usuario.id;

  useEffect(() => {
    cargarPerfil();
    api.get(`/usuarios/${idAMostrar}/evolucion-puntuacion`).then((res) => setEvolucion(res.data));
  }, [idAMostrar]);

  function cargarPerfil() {
    return api.get(`/usuarios/${idAMostrar}`).then((res) => {
      setPerfil(res.data);
      setForm({
        edad: res.data.edad ?? '',
        altura: res.data.altura ?? '',
        posicion: res.data.posicion ?? '',
        clubFavorito: res.data.clubFavorito ?? '',
        estadoFisico: res.data.estadoFisico ?? '',
        intereses: res.data.intereses ?? '',
      });
    });
  }

  if (!perfil) return null;

  async function guardarPerfil() {
    setGuardando(true);
    try {
      const data = {
        edad: form.edad === '' ? null : Number(form.edad),
        altura: form.altura === '' ? null : Number(form.altura),
        posicion: form.posicion || null,
        clubFavorito: form.clubFavorito || null,
        estadoFisico: form.estadoFisico || null,
        intereses: form.intereses || null,
      };
      const { data: actualizado } = await api.patch('/usuarios/me', data);
      setPerfil((p) => ({ ...p, ...actualizado }));
      setUsuario((u) => ({ ...u, ...actualizado }));
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  async function subirFoto(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoFoto(true);
    try {
      const foto = await comprimirImagen(archivo);
      const { data } = await api.patch('/usuarios/me', { foto });
      setPerfil((p) => ({ ...p, foto: data.foto }));
      setUsuario((u) => ({ ...u, foto: data.foto }));
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  }

  async function toggleAmonestacion() {
    setCambiandoAmonestacion(true);
    try {
      const { data } = await api.patch(`/usuarios/${idAMostrar}/amonestacion`, { amonestado: !perfil.amonestado });
      setPerfil((p) => ({ ...p, amonestado: data.amonestado }));
    } finally {
      setCambiandoAmonestacion(false);
    }
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
        {esPropio && (
          editando ? (
            <button className="btn-primary" style={{ width: 'auto', padding: '9px 16px' }} onClick={guardarPerfil} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          ) : (
            <button className="btn-outline" style={{ width: 'auto', padding: '9px 16px' }} onClick={() => setEditando(true)}>
              Editar
            </button>
          )
        )}
      </div>

      <div className="content">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <div className="avatar" style={{ width: 88, height: 88, background: 'var(--accent)', fontSize: 30, overflow: 'hidden' }}>
              {perfil.foto
                ? <img src={perfil.foto} alt={perfil.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : perfil.nombre.slice(0, 1).toUpperCase()}
            </div>
            {esPropio && (
              <>
                <button
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={subiendoFoto}
                  style={{
                    position: 'absolute', bottom: 0, right: -2, width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--ink)', border: '3px solid var(--bg)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                  }}
                  aria-label="Cambiar foto de perfil"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                </button>
                <input ref={inputFotoRef} type="file" accept="image/*" onChange={subirFoto} style={{ display: 'none' }} />
              </>
            )}
          </div>
          {esPropio && <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{subiendoFoto ? 'Subiendo…' : 'Tocá el ícono para cambiar tu foto'}</div>}
          <div className="disp" style={{ fontSize: 22, fontWeight: 800 }}>{esPropio ? 'Vos' : perfil.nombre}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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
            {perfil.amonestado && (
              <div style={{ background: '#FCEFD2', color: '#8A6414', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
                🟨 Amonestado
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 26, marginTop: 8 }}>
            <Stat valor={puntuacionActual} label="Puntuación" />
            <Stat valor={perfil.stats.vecesMVP} label="Veces MVP" color="var(--gold)" />
            <Stat valor={perfil.stats.partidosJugados} label="Partidos" />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {CAMPOS_EDITABLES.map((campo) => (
              esPropio && editando ? (
                <div key={campo.key}>
                  <div className="label" style={{ marginBottom: 5 }}>{campo.label}</div>
                  <input
                    type={campo.tipo}
                    step={campo.paso}
                    value={form[campo.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [campo.key]: e.target.value }))}
                  />
                </div>
              ) : (
                <Campo
                  key={campo.key}
                  label={campo.label}
                  valor={perfil[campo.key] ? `${perfil[campo.key]}${campo.key === 'edad' ? ' años' : campo.key === 'altura' ? ' m' : ''}` : '–'}
                />
              )
            ))}
          </div>

          <div>
            <div className="label" style={{ marginBottom: 5 }}>Estado físico</div>
            {esPropio && editando ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {OPCIONES_ESTADO_FISICO.map((op) => (
                  <button
                    key={op}
                    onClick={() => setForm((f) => ({ ...f, estadoFisico: op }))}
                    style={{
                      flex: 1, textAlign: 'center', padding: 9, borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: form.estadoFisico === op ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                      background: form.estadoFisico === op ? 'var(--accent-bg)' : '#fff',
                      color: form.estadoFisico === op ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700 }}>{perfil.estadoFisico || '–'}</div>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="label">Intereses</div>
            {esPropio && editando && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{(form.intereses || '').length}/40</div>}
          </div>
          {esPropio && editando ? (
            <input
              value={form.intereses}
              maxLength={40}
              onChange={(e) => setForm((f) => ({ ...f, intereses: e.target.value }))}
              placeholder="Ej: Asado, pádel y cine"
            />
          ) : (
            <div style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', background: '#fff' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: perfil.intereses ? 'inherit' : 'var(--muted)' }}>
                {perfil.intereses || 'Sin definir'}
              </div>
            </div>
          )}
          {esPropio && editando && <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 5 }}>Texto libre y corto — máx. 40 caracteres.</div>}
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

        {esAdmin && !esPropio && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderColor: '#F0DDBE', background: '#FFFBF3' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#8A6414', textTransform: 'uppercase', letterSpacing: '.05em' }}>Panel de administrador</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {perfil.amonestado
                ? 'Este jugador está amonestado. La amarilla queda fija hasta que la saques.'
                : 'Podés sancionar a este jugador con amarilla. Queda fija hasta que la saques.'}
            </div>
            <button className="btn-primary" onClick={toggleAmonestacion} disabled={cambiandoAmonestacion}>
              {cambiandoAmonestacion ? 'Guardando…' : perfil.amonestado ? 'Sacar amonestación 🟨' : 'Sancionar con amarilla 🟨'}
            </button>
          </div>
        )}
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
