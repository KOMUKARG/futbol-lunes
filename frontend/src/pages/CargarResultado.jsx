import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

export default function CargarResultado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partido, setPartido] = useState(null);
  const [golesOscuros, setGolesOscuros] = useState(0);
  const [golesBlancos, setGolesBlancos] = useState(0);
  const [goles, setGoles] = useState([]); // { jugadorId, equipoColor, cantidad }

  useEffect(() => {
    api.get(`/partidos/${id}`).then((res) => {
      setPartido(res.data);
      setGolesOscuros(res.data.golesOscuros || 0);
      setGolesBlancos(res.data.golesBlancos || 0);
      setGoles(res.data.goles.map((g) => ({ jugadorId: g.jugadorId, equipoColor: g.equipoColor, cantidad: g.cantidad })));
    });
  }, [id]);

  if (!partido) return null;

  const jugadores = [...(partido.equipos.find((e) => e.color === 'oscuro')?.jugadores || []),
    ...(partido.equipos.find((e) => e.color === 'blanco')?.jugadores || [])].map((ej) => ej.jugador);

  function cantidadDe(jugadorId) {
    return goles.find((g) => g.jugadorId === jugadorId)?.cantidad || 0;
  }

  function setCantidad(jugador, equipoColor, cantidad) {
    setGoles((prev) => {
      const resto = prev.filter((g) => g.jugadorId !== jugador.id);
      return cantidad > 0 ? [...resto, { jugadorId: jugador.id, equipoColor, cantidad }] : resto;
    });
  }

  async function guardar() {
    await api.patch(`/partidos/${id}/resultado`, {
      golesOscuros: Number(golesOscuros),
      golesBlancos: Number(golesBlancos),
      goles,
    });
    navigate(`/partido/${id}`);
  }

  return (
    <div className="app-shell">
      <div className="header">
        <Link to={`/partido/${id}`}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </div>
        </Link>
        <div className="disp" style={{ fontWeight: 800, fontSize: 18 }}>Cargar resultado</div>
      </div>

      <div className="content">
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="label">Goles Oscuros</div>
            <input type="number" min="0" value={golesOscuros} onChange={(e) => setGolesOscuros(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">Goles Blancos</div>
            <input type="number" min="0" value={golesBlancos} onChange={(e) => setGolesBlancos(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="disp" style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Goles por jugador</div>
          <div className="card" style={{ padding: '6px 16px' }}>
            {jugadores.map((j, i) => {
              const equipoColor = partido.equipos.find((e) => e.jugadores.some((ej) => ej.jugador.id === j.id))?.color;
              return (
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < jugadores.length - 1 ? '1px solid #F0EEE8' : 'none' }}>
                  <div className={equipoColor === 'blanco' ? 'dot-blanco' : 'dot-oscuro'} />
                  <div style={{ flexGrow: 1, fontSize: 13 }}>{j.nombre}</div>
                  <input
                    type="number" min="0" style={{ width: 60 }}
                    value={cantidadDe(j.id)}
                    onChange={(e) => setCantidad(j, equipoColor, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button className="btn-primary" onClick={guardar}>Guardar resultado</button>
      </div>
    </div>
  );
}
