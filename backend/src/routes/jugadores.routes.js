const express = require('express');
const prisma = require('../db');
const { requiereAuth } = require('../middleware/auth');
const { contarVecesMVP } = require('../utils/mvp');

const router = express.Router();

function periodoActual() {
  const ahora = new Date();
  const trimestre = Math.floor(ahora.getUTCMonth() / 3) + 1;
  return `${ahora.getUTCFullYear()}-Q${trimestre}`;
}

async function statsDeJugador(usuario) {
  const equipoJugador = await prisma.equipoJugador.findMany({
    where: { jugadorId: usuario.id },
    include: { equipo: { include: { partido: true } } },
  });

  let partidosJugados = 0;
  let partidosGanados = 0;
  let partidosPerdidos = 0;
  let partidosEmpatados = 0;

  for (const ej of equipoJugador) {
    const partido = ej.equipo.partido;
    if (partido.estado !== 'jugado') continue;
    if (partido.golesOscuros == null || partido.golesBlancos == null) continue;

    partidosJugados += 1;
    const golesPropios = ej.equipo.color === 'oscuro' ? partido.golesOscuros : partido.golesBlancos;
    const golesRivales = ej.equipo.color === 'oscuro' ? partido.golesBlancos : partido.golesOscuros;
    if (golesPropios > golesRivales) partidosGanados += 1;
    else if (golesPropios < golesRivales) partidosPerdidos += 1;
    else partidosEmpatados += 1;
  }

  const [golesAgg, vecesMVP, calificacionesTrimestre, ultimasCalifPartido] = await Promise.all([
    prisma.gol.aggregate({ where: { jugadorId: usuario.id }, _sum: { cantidad: true } }),
    contarVecesMVP(usuario.id),
    prisma.calificacion.findMany({ where: { jugadorCalificadoId: usuario.id, periodo: periodoActual() } }),
    prisma.calificacionPartido.findMany({
      where: { jugadorCalificadoId: usuario.id },
      include: { partido: { select: { fecha: true } } },
      orderBy: { partido: { fecha: 'desc' } },
      take: 200, // de sobra para agrupar y quedarnos con los últimos 8 partidos distintos
    }),
  ]);

  let puntuacion = 6; // valor neutro para quien todavía no fue calificado este trimestre
  if (calificacionesTrimestre.length > 0) {
    const promedios = calificacionesTrimestre.map((c) => (
      c.nivelTecnico + c.actitud + c.puntualidad + c.juegoEnEquipo +
      c.velocidad + c.regate + c.cabezazo + c.habilidadTactica + c.remate
    ) / 9);
    puntuacion = promedios.reduce((a, b) => a + b, 0) / promedios.length;
  }

  // Agrupa las calificaciones post-partido por partido (ya vienen ordenadas por fecha desc)
  // y promedia las notas recibidas en cada uno; luego promedia los últimos 8 partidos.
  const porPartido = new Map();
  for (const c of ultimasCalifPartido) {
    if (!porPartido.has(c.partidoId)) porPartido.set(c.partidoId, []);
    porPartido.get(c.partidoId).push(c.puntaje);
  }
  const promediosPorPartido = [...porPartido.values()].map(
    (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
  );
  const ultimos8 = promediosPorPartido.slice(0, 8);
  const promedioUltimos8 = ultimos8.length > 0
    ? Number((ultimos8.reduce((a, b) => a + b, 0) / ultimos8.length).toFixed(1))
    : null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    foto: usuario.foto,
    posicion: usuario.posicion,
    autopercepcion: usuario.autopercepcion,
    amonestado: usuario.amonestado,
    partidosJugados,
    partidosGanados,
    partidosPerdidos,
    partidosEmpatados,
    golesTotales: golesAgg._sum.cantidad || 0,
    vecesMVP,
    puntuacion: Number(puntuacion.toFixed(1)),
    promedioUltimos8,
  };
}

// GET /api/jugadores — listado completo con estadísticas (pestaña Jugadores)
router.get('/', requiereAuth, async (req, res) => {
  const usuarios = await prisma.usuario.findMany({ orderBy: { nombre: 'asc' } });
  const jugadores = await Promise.all(usuarios.map(statsDeJugador));
  res.json(jugadores);
});

module.exports = router;
