const express = require('express');
const prisma = require('../db');
const { requiereAuth } = require('../middleware/auth');

const router = express.Router();

// Devuelve, para un partido, la lista de jugadores que jugaron (con su color de equipo)
async function jugadoresDelPartido(partidoId) {
  const equipos = await prisma.equipo.findMany({
    where: { partidoId },
    include: {
      jugadores: {
        include: { jugador: { select: { id: true, nombre: true, foto: true, posicion: true } } },
      },
    },
  });

  const jugadores = [];
  for (const equipo of equipos) {
    for (const ej of equipo.jugadores) {
      jugadores.push({ ...ej.jugador, color: equipo.color });
    }
  }
  return jugadores;
}

// La calificación post-partido (1-10, general) solo se puede hacer dentro de las 24 hs
// posteriores al partido, igual que la votación de MVP (sección 4.9).
function ventanaVencida(partido) {
  const horasDesdePartido = (Date.now() - new Date(partido.fecha).getTime()) / 36e5;
  return horasDesdePartido > 24;
}

// GET /api/partidos/:id/calificacion-companeros-pendientes
router.get('/:id/calificacion-companeros-pendientes', requiereAuth, async (req, res) => {
  const { id: partidoId } = req.params;
  const jugadorQueCalificaId = req.usuario.id;

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado.' });
  if (partido.estado !== 'jugado') {
    return res.status(400).json({ error: 'Este partido todavía no fue jugado.' });
  }

  const jugadores = await jugadoresDelPartido(partidoId);
  const jugueEsePartido = jugadores.some((j) => j.id === jugadorQueCalificaId);
  if (!jugueEsePartido) {
    return res.status(403).json({ error: 'Solo pueden calificar los jugadores que jugaron este partido.' });
  }

  const yaCalificados = await prisma.calificacionPartido.findMany({
    where: { partidoId, jugadorQueCalificaId },
    select: { jugadorCalificadoId: true, puntaje: true },
  });
  const puntajesPrevios = new Map(yaCalificados.map((c) => [c.jugadorCalificadoId, c.puntaje]));

  res.json({
    habilitado: !ventanaVencida(partido),
    companeros: jugadores
      .filter((j) => j.id !== jugadorQueCalificaId)
      .map((j) => ({ ...j, puntajePrevio: puntajesPrevios.get(j.id) ?? null })),
  });
});

// POST /api/partidos/:id/calificaciones-companeros
// body: { calificaciones: [{ jugadorId, puntaje }] } — puntaje general 1-10, no por conceptos.
router.post('/:id/calificaciones-companeros', requiereAuth, async (req, res) => {
  const { id: partidoId } = req.params;
  const jugadorQueCalificaId = req.usuario.id;
  const { calificaciones = [] } = req.body;

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado.' });
  if (partido.estado !== 'jugado') {
    return res.status(400).json({ error: 'Este partido todavía no fue jugado.' });
  }
  if (ventanaVencida(partido)) {
    return res.status(400).json({ error: 'La ventana de 24 hs para calificar a tus compañeros ya cerró.' });
  }

  const jugadores = await jugadoresDelPartido(partidoId);
  const idsValidos = new Set(jugadores.map((j) => j.id));
  if (!idsValidos.has(jugadorQueCalificaId)) {
    return res.status(403).json({ error: 'Solo pueden calificar los jugadores que jugaron este partido.' });
  }

  for (const c of calificaciones) {
    if (c.jugadorId === jugadorQueCalificaId) {
      return res.status(400).json({ error: 'No podés calificarte a vos mismo.' });
    }
    if (!idsValidos.has(c.jugadorId)) {
      return res.status(400).json({ error: 'Solo podés calificar a jugadores que jugaron este partido.' });
    }
    if (!Number.isInteger(c.puntaje) || c.puntaje < 1 || c.puntaje > 10) {
      return res.status(400).json({ error: 'El puntaje debe ser un entero entre 1 y 10.' });
    }
  }

  await prisma.$transaction(
    calificaciones.map((c) =>
      prisma.calificacionPartido.upsert({
        where: {
          partidoId_jugadorCalificadoId_jugadorQueCalificaId: {
            partidoId,
            jugadorCalificadoId: c.jugadorId,
            jugadorQueCalificaId,
          },
        },
        update: { puntaje: c.puntaje },
        create: { partidoId, jugadorCalificadoId: c.jugadorId, jugadorQueCalificaId, puntaje: c.puntaje },
      })
    )
  );

  res.status(201).json({ ok: true });
});

module.exports = router;
