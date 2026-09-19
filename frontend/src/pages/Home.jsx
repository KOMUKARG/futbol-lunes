import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Escudo from '../components/Escudo';
import { useAuth } from '../context/AuthContext';
import { useConfiguracion } from '../context/ConfiguracionContext';

const FRASES = [
  { texto: 'La pelota no se mancha.', autor: 'Diego Armando Maradona' },
  { texto: 'El fútbol es el deporte más lindo del mundo.', autor: 'Diego Armando Maradona' },
  { texto: 'Cada desventaja tiene su ventaja.', autor: 'Johan Cruyff' },
  { texto: 'Jugar al fútbol es muy sencillo, pero jugar al fútbol sencillo es lo más difícil que hay.', autor: 'Johan Cruyff' },
  { texto: 'No corras más que la pelota, porque la pelota siempre corre más rápido que vos.', autor: 'Johan Cruyff' },
  { texto: 'No se trata de ganar, sino de merecerlo.', autor: 'Pep Guardiola' },
  { texto: 'Prefiero morir en mi ley antes que vivir en la ajena.', autor: 'Marcelo Bielsa' },
  { texto: 'El fútbol no cambia, cambian los intérpretes.', autor: 'Marcelo Bielsa' },
  { texto: 'El fútbol es el deporte más importante de las cosas menos importantes.', autor: 'Jorge Valdano' },
  { texto: 'El talento sin trabajo no sirve de nada.', autor: 'Cristiano Ronaldo' },
  { texto: 'Podés ganar o perder, pero nunca debés rendirte.', autor: 'Lionel Messi' },
  { texto: 'Hay que luchar para conseguir los sueños, siempre pensando que es posible.', autor: 'Lionel Messi' },
  { texto: 'Cuando el balón se para, el fútbol se para.', autor: 'Xavi Hernández' },
  { texto: 'El fútbol es un deporte de errores; el que menos se equivoca, gana.', autor: 'Andrés Iniesta' },
  { texto: 'El fútbol es un deporte simple: 22 hombres corren detrás de una pelota durante 90 minutos y al final ganan los alemanes.', autor: 'Gary Lineker' },
  { texto: 'El equipo siempre está por encima del individuo.', autor: 'Vicente del Bosque' },
  { texto: 'El fútbol es la cosa más importante entre las cosas menos importantes.', autor: 'Arrigo Sacchi' },
  { texto: 'Algunos piensan que el fútbol es una cuestión de vida o muerte. Les puedo asegurar que es mucho más importante que eso.', autor: 'Bill Shankly' },
  { texto: 'El fútbol es un juego de inteligencia, no de fuerza.', autor: 'César Luis Menotti' },
  { texto: 'La belleza viene primero, la victoria es secundaria. Lo que importa es la alegría.', autor: 'Sócrates (Brasil)' },
];

// Misma frase para todos durante toda la semana (rota automáticamente cada 7 días)
function fraseDeLaSemana() {
  const inicioAno = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const dias = Math.floor((Date.now() - inicioAno.getTime()) / 86400000);
  const semana = Math.floor(dias / 7);
  return FRASES[semana % FRASES.length];
}

export default function Home() {
  const { usuario, esAdmin } = useAuth();
  const { escudoOscuroUrl, escudoBlancoUrl, calificacionesAbiertas, recargarConfiguracion } = useConfiguracion();
  const [proximo, setProximo] = useState(null);
  const [ultimo, setUltimo] = useState(null);
  const [cambiandoCalificaciones, setCambiandoCalificaciones] = useState(false);

  useEffect(() => {
    api.get('/partidos/proximo').then((res) => setProximo(res.data)).catch(() => setProximo(null));
    api.get('/partidos').then((res) => {
      const jugados = res.data.filter((p) => p.estado === 'jugado');
      setUltimo(jugados[0] || null);
    });
  }, []);

  const confirmados = proximo?.inscripciones?.filter((i) => i.estado === 'confirmado').length || 0;
  const frase = fraseDeLaSemana();

  async function toggleCalificaciones() {
    setCambiandoCalificaciones(true);
    try {
      await api.patch('/configuracion', { calificacionesAbiertas: !calificacionesAbiertas });
      await recargarConfiguracion();
    } finally {
      setCambiandoCalificaciones(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div className="disp" style={{ fontWeight: 800, fontSize: 22, flexGrow: 1 }}>
          FÚTBOL <span style={{ color: 'var(--accent)' }}>LUNES</span>
        </div>
        <div className="avatar" style={{ width: 34, height: 34, background: 'var(--accent)', fontSize: 13 }}>
          {(usuario?.nombre || '?').slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="content">
        <div className="card" style={{ background: 'var(--ink)', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>Frase de la semana</div>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', lineHeight: 1.3 }}>"{frase.texto}"</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>— {frase.autor}</div>
        </div>

        {proximo && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="label">
                Próximo partido · {new Date(proximo.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </div>
              <div style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
                {proximo.estado === 'abierto' ? 'ABIERTA' : 'CERRADA'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="disp" style={{ fontSize: 46, fontWeight: 800, lineHeight: 1 }}>
                {confirmados}<span style={{ fontSize: 22, color: '#9A9EA8' }}>/14</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
                {14 - confirmados > 0 ? `${14 - confirmados} lugares libres` : 'Cupo completo'}
              </div>
            </div>
            <Link to="/inscripcion"><button className="btn-primary">Ver inscripción</button></Link>
            <Link to={`/partido/${proximo.id}`}><button className="btn-outline">Ver detalle del partido</button></Link>
          </div>
        )}

        {(calificacionesAbiertas || esAdmin) && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="label">Calificaciones trimestrales</div>
              <div style={{
                fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                background: calificacionesAbiertas ? 'var(--accent-bg)' : '#EFEDE7',
                color: calificacionesAbiertas ? 'var(--accent)' : 'var(--muted)',
              }}>
                {calificacionesAbiertas ? 'ABIERTAS' : 'CERRADAS'}
              </div>
            </div>

            {calificacionesAbiertas && (
              <Link to="/calificar"><button className="btn-primary">Calificar ahora</button></Link>
            )}

            {esAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: esAdmin && calificacionesAbiertas ? '1px solid var(--border)' : 'none', paddingTop: esAdmin && calificacionesAbiertas ? 12 : 0 }}>
                <div style={{ flexGrow: 1, fontSize: 11.5, color: 'var(--muted)' }}>Como admin, vos decidís cuándo abrirlas y cerrarlas.</div>
                <button
                  onClick={toggleCalificaciones}
                  disabled={cambiandoCalificaciones}
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
            )}
          </div>
        )}

        {ultimo && (
          <Link to={`/partido/${ultimo.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="label">Último resultado</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Escudo color="oscuro" url={escudoOscuroUrl} size={17} />
                  <div className="disp" style={{ fontSize: 30, fontWeight: 800 }}>{ultimo.golesOscuros}</div>
                </div>
                <div style={{ fontSize: 11, color: '#9A9EA8', fontWeight: 700 }}>FINAL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="disp" style={{ fontSize: 30, fontWeight: 800 }}>{ultimo.golesBlancos}</div>
                  <Escudo color="blanco" url={escudoBlancoUrl} size={17} />
                </div>
              </div>
              {ultimo.mvp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
                  ★ MVP: {ultimo.mvp.nombre || 'jugador votado'}
                </div>
              )}
            </div>
          </Link>
        )}

        {!proximo && !ultimo && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Todavía no hay partidos cargados.
          </div>
        )}

        {esAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/admin/partidos">
              <button className="btn-outline">📅 Gestionar partidos (Admin)</button>
            </Link>
            <Link to="/admin/nuevo-jugador">
              <button className="btn-outline">➕ Nuevo jugador (Admin)</button>
            </Link>
            {proximo && (
              <Link to="/admin/armado-equipos">
                <button className="btn-outline">⚙ Armar equipos (Admin)</button>
              </Link>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
