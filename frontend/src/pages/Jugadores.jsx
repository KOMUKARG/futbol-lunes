import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Escudo from '../components/Escudo';
import { useConfiguracion } from '../context/ConfiguracionContext';

const COLUMNAS = [
  { key: 'partidosJugados', label: 'PJ' },
  { key: 'partidosGanados', label: 'PG' },
  { key: 'partidosPerdidos', label: 'PP' },
  { key: 'partidosEmpatados', label: 'PE' },
  { key: 'golesTotales', label: 'Goles' },
  { key: 'vecesMVP', label: 'MVP' },
  { key: 'puntuacion', label: 'Puntos' },
  { key: 'promedioUltimos8', label: 'Prom. 8' },
];

export default function Jugadores() {
  const [jugadores, setJugadores] = useState([]);
  const [orden, setOrden] = useState({ columna: 'puntuacion', direccion: 'desc' });
  const { escudoOscuroUrl, escudoBlancoUrl } = useConfiguracion();

  useEffect(() => {
    api.get('/jugadores').then((res) => setJugadores(res.data));
  }, []);

  function ordenarPor(columna) {
    setOrden((prev) => ({
      columna,
      direccion: prev.columna === columna && prev.direccion === 'desc' ? 'asc' : 'desc',
    }));
  }

  const jugadoresOrdenados = useMemo(() => {
    const copia = [...jugadores];
    copia.sort((a, b) => {
      const va = a[orden.columna] ?? -Infinity;
      const vb = b[orden.columna] ?? -Infinity;
      return orden.direccion === 'desc' ? vb - va : va - vb;
    });
    return copia;
  }, [jugadores, orden]);

  return (
    <div className="app-shell">
      <div className="header">
        <div className="disp" style={{ fontWeight: 800, fontSize: 20, flexGrow: 1 }}>Jugadores</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{jugadores.length} en total</div>
      </div>

      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>← deslizá para ver todas las columnas →</div>
      </div>

      <div style={{ flexGrow: 1, overflow: 'auto', paddingBottom: 90 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle(true)}>
                <div style={colHeadStyle(false)}>Jugador</div>
              </th>
              {COLUMNAS.map((col) => (
                <th key={col.key} style={thStyle(false)} onClick={() => ordenarPor(col.key)}>
                  <button style={sortButtonStyle}>
                    <div style={colHeadStyle(orden.columna === col.key)}>
                      {col.label}
                      <Flecha activa={orden.columna === col.key} direccion={orden.direccion} />
                    </div>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jugadoresOrdenados.map((j, i) => (
              <tr key={j.id} style={{ background: i % 2 === 1 ? '#FAF9F6' : 'transparent' }}>
                <td style={tdStyle(true, i)}>
                  <Link to={`/perfil/${j.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar" style={{ width: 28, height: 28, background: colorAvatar(j.id), fontSize: 11, overflow: 'hidden' }}>
                      {j.foto ? <img src={j.foto} alt={j.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : j.nombre.slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{j.nombre}</div>
                    {j.autopercepcion && j.autopercepcion !== 'indistinto' && (
                      <Escudo color={j.autopercepcion} size={12} url={j.autopercepcion === 'blanco' ? escudoBlancoUrl : escudoOscuroUrl} />
                    )}
                    {j.amonestado && <span style={{ fontSize: 10 }}>🟨</span>}
                  </Link>
                </td>
                <td style={tdStyle(false, i)}>{j.partidosJugados}</td>
                <td style={tdStyle(false, i)}>{j.partidosGanados}</td>
                <td style={tdStyle(false, i)}>{j.partidosPerdidos}</td>
                <td style={tdStyle(false, i)}>{j.partidosEmpatados}</td>
                <td style={tdStyle(false, i)}>{j.golesTotales}</td>
                <td style={tdStyle(false, i)}>
                  {j.vecesMVP > 0 ? <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{j.vecesMVP}</span> : 0}
                </td>
                <td style={{ ...tdStyle(false, i), fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14 }}>
                  {j.puntuacion}
                </td>
                <td style={tdStyle(false, i)}>{j.promedioUltimos8 ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jugadores.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>Todavía no hay jugadores cargados.</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Flecha({ activa, direccion }) {
  const rota = direccion === 'asc' ? 'rotate(180deg)' : 'none';
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={activa ? '#15171B' : '#B9B6AE'} strokeWidth="3" style={{ transform: rota }}>
      <path d="M7 14l5-5 5 5" />
    </svg>
  );
}

function colorAvatar(id) {
  const colores = ['#4A6FA5', '#B85C5C', '#8A6B4C', '#6E7B8B', '#2E7D4F', '#6B5CA5'];
  let hash = 0;
  for (const ch of id) hash = (hash + ch.charCodeAt(0)) % colores.length;
  return colores[hash];
}

function thStyle(esPrimera) {
  return {
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: esPrimera ? 3 : 2,
    padding: '10px 12px',
    borderBottom: '1px solid #EFEDE7',
    textAlign: esPrimera ? 'left' : 'center',
    whiteSpace: 'nowrap',
    ...(esPrimera ? { position: 'sticky', left: 0, minWidth: 150 } : {}),
  };
}

function tdStyle(esPrimera, fila) {
  return {
    padding: '10px 12px',
    fontSize: 12.5,
    textAlign: esPrimera ? 'left' : 'center',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #EFEDE7',
    ...(esPrimera
      ? { position: 'sticky', left: 0, background: fila % 2 === 1 ? '#FAF9F6' : '#fff', boxShadow: '2px 0 4px rgba(21,23,27,.04)' }
      : {}),
  };
}

const sortButtonStyle = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' };

function colHeadStyle(activa) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    fontSize: 10.5,
    fontWeight: 800,
    color: activa ? '#15171B' : '#767B85',
    textTransform: 'uppercase',
    letterSpacing: '.03em',
  };
}
