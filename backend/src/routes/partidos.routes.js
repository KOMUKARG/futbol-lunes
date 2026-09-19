const express = require('express');
const prisma = require('../db');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const { calcularMVP } = require('../utils/mvp');

const router = express.Router();

// GET /api/partidos — historial (más reciente primero)
router.get('/', requiereAuth, async (req, res) => {
  const partidos = await prisma.partido.findMany({
    orderBy: { fecha: 'desc' },
    include: { _count: { select: { inscripciones: true } } },
  });

  const conMVP = await Promise.all(
    partidos.map(async (p) => ({ ...p, mvp: p.estado === 'jugado' ? await calcularMVP(p.id) : null }))
  );
  res.json(conMVP);
});

// GET /api/partidos/proximo — el próximo lunes (el que está abierto o el más cercano en el futuro)
router.get('/proximo', requiereAuth, async (req, res) => {
  const partido = await prisma.partido.findFirst({
    where: { estado: { in: ['abierto', 'cerrado'] } },
    orderBy: { fecha: 'asc' },
    include: {
      inscripciones: {
        include: { jugador: { select: { id: true, nombre: true, foto: true, autopercepcion: true } } },
        orderBy: { fechaHora: 'asc' },
      },
    },
  });
  if (!partido) return res.status(404).json({ error: 'No hay un próximo partido programado.' });
  res.json(partido);
});

// GET /api/partidos/:id — detalle completo (resultado, goleadores, planteles, MVP)
router.get('/:id', requiereAuth, async (req, res) => {
  const { id } = req.params;
  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      goles: { include: { jugador: { select: { id: true, nombre: true } } } },
      equipos: {
        include: { jugadores: { include: { jugador: { select: { id: true, nombre: true } } } } },
      },
    },
  });
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado.' });

  const mvp = await calcularMVP(id);
  res.json({ ...partido, mvp });
});

// POST /api/partidos — solo Admin: crea el partido de la próxima semana
router.post('/', requiereAuth, requiereAdmin, async (req, res) => {
  const { fecha } = req.body;
  if (!fecha) return res.status(400).json({ error: 'La fecha es requerida.' });

  const partido = await prisma.partido.create({ data: { fecha: new Date(fecha) } });
  res.status(201).json(partido);
});

// DELETE /api/partidos/:id — solo Admin: borra el partido y todo lo relacionado (cascada:
// inscripciones, equipos, goles, votos MVP, calificaciones). Pensado para limpiar partidos
// de prueba o cargados por error.
router.delete('/:id', requiereAuth, requiereAdmin, async (req, res) => {
  const { id } = req.params;
  const partido = await prisma.partido.findUnique({ where: { id } });
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado.' });

  await prisma.partido.delete({ where: { id } });
  res.status(204).end();
});

// PATCH /api/partidos/:id/estado — solo Admin: abre/cierra la inscripción o cancela el partido
router.patch('/:id/estado', requiereAuth, requiereAdmin, async (req, res) => {
  const { estado } = req.body;
  const estadosValidos = ['abierto', 'cerrado', 'jugado', 'cancelado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Usar uno de: ${estadosValidos.join(', ')}` });
  }
  const partido = await prisma.partido.update({ where: { id: req.params.id }, data: { estado } });
  res.json(partido);
});

// PATCH /api/partidos/:id/resultado — solo Admin: carga resultado final + goles (sección 4.3)
// body: { golesOscuros, golesBlancos, goles: [{ jugadorId, equipoColor, cantidad }] }
router.patch('/:id/resultado', requiereAuth, requiereAdmin, async (req, res) => {
  const { id } = req.params;
  const { golesOscuros, golesBlancos, goles = [] } = req.body;

  await prisma.$transaction([
    prisma.gol.deleteMany({ where: { partidoId: id } }), // recarga completa del detalle de goles
    prisma.gol.createMany({
      data: goles.map((g) => ({
        partidoId: id,
        jugadorId: g.jugadorId,
        equipoColor: g.equipoColor,
        cantidad: g.cantidad || 1,
      })),
    }),
    prisma.partido.update({
      where: { id },
      data: { golesOscuros, golesBlancos, estado: 'jugado' },
    }),
  ]);

  const partidoActualizado = await prisma.partido.findUnique({ where: { id }, include: { goles: true } });
  res.json(partidoActualizado);
});

// POST /api/partidos/:id/mvp — un jugador vota al MVP (ventana de 24hs post-partido, sección 4.9)
router.post('/:id/mvp', requiereAuth, async (req, res) => {
  const { id: partidoId } = req.params;
  const { jugadorVotadoId } = req.body;
  const jugadorQueVotaId = req.usuario.id;

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado.' });
  if (partido.estado !== 'jugado') {
    return res.status(400).json({ error: 'Solo se puede votar el MVP de un partido ya jugado.' });
  }
  const horasDesdeElPartido = (Date.now() - new Date(partido.fecha).getTime()) / 36e5;
  if (horasDesdeElPartido > 24) {
    return res.status(400).json({ error: 'La ventana de votación de 24 hs ya cerró.' });
  }
  if (jugadorVotadoId === jugadorQueVotaId) {
    return res.status(400).json({ error: 'No podés votarte a vos mismo.' });
  }

  const voto = await prisma.votoMVP.upsert({
    where: { partidoId_jugadorQueVotaId: { partidoId, jugadorQueVotaId } },
    update: { jugadorVotadoId },
    create: { partidoId, jugadorQueVotaId, jugadorVotadoId },
  });
  res.status(201).json(voto);
});

module.exports = router;
