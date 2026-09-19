const express = require('express');
const prisma = require('../db');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');

const router = express.Router();

// Puntuación promedio de un jugador sobre todas sus calificaciones recibidas (todo período)
async function puntuacionPromedio(jugadorId) {
  const calificaciones = await prisma.calificacion.findMany({ where: { jugadorCalificadoId: jugadorId } });
  if (calificaciones.length === 0) return 6; // valor neutro por defecto para jugadores sin calificar aún

  const promedios = calificaciones.map((c) => (
    c.nivelTecnico + c.actitud + c.puntualidad + c.juegoEnEquipo +
    c.velocidad + c.regate + c.cabezazo + c.habilidadTactica + c.remate
  ) / 9);
  return promedios.reduce((a, b) => a + b, 0) / promedios.length;
}

// GET /api/partidos/:id/equipos/sugerencia — solo Admin: arma dos equipos balanceados
// por puntuación total, a partir de los confirmados (sección 4.5 / flujo 5.3).
router.get('/:id/equipos/sugerencia', requiereAuth, requiereAdmin, async (req, res) => {
  const { id: partidoId } = req.params;

  const confirmados = await prisma.inscripcion.findMany({
    where: { partidoId, estado: 'confirmado' },
    include: { jugador: true },
  });

  const jugadoresConPuntaje = await Promise.all(
    confirmados.map(async (i) => ({
      id: i.jugador.id,
      nombre: i.jugador.nombre,
      autopercepcion: i.jugador.autopercepcion,
      puntuacion: await puntuacionPromedio(i.jugador.id),
    }))
  );

  // Algoritmo simple: ordenar de mayor a menor puntaje y repartir "serpiente" (1-2-2-1...)
  // para que ambos equipos queden lo más parejos posible en puntuación total.
  jugadoresConPuntaje.sort((a, b) => b.puntuacion - a.puntuacion);

  const oscuros = [];
  const blancos = [];
  jugadoresConPuntaje.forEach((jugador, i) => {
    const turnoOscuro = Math.floor(i / 2) % 2 === 0 ? i % 2 === 0 : i % 2 === 1;
    (turnoOscuro ? oscuros : blancos).push(jugador);
  });

  const suma = (lista) => lista.reduce((acc, j) => acc + j.puntuacion, 0);
  res.json({
    oscuros: { jugadores: oscuros, puntuacionTotal: Number(suma(oscuros).toFixed(1)) },
    blancos: { jugadores: blancos, puntuacionTotal: Number(suma(blancos).toFixed(1)) },
  });
});

// POST /api/partidos/:id/equipos/confirmar — solo Admin: guarda el armado final
// body: { oscuros: [jugadorId, ...], blancos: [jugadorId, ...] }
router.post('/:id/equipos/confirmar', requiereAuth, requiereAdmin, async (req, res) => {
  const { id: partidoId } = req.params;
  const { oscuros = [], blancos = [] } = req.body;

  await prisma.$transaction(async (tx) => {
    await tx.equipo.deleteMany({ where: { partidoId } }); // borra armado previo si lo había (cascada a equipo_jugadores)

    for (const [color, jugadorIds] of [['oscuro', oscuros], ['blanco', blancos]]) {
      const equipo = await tx.equipo.create({ data: { partidoId, color } });
      await tx.equipoJugador.createMany({
        data: jugadorIds.map((jugadorId) => ({ equipoId: equipo.id, jugadorId })),
      });
    }
  });

  // Acá se dispararía la notificación "se asignó tu equipo" a los 14 jugadores (sección 4.7)
  const equipos = await prisma.equipo.findMany({
    where: { partidoId },
    include: { jugadores: { include: { jugador: { select: { id: true, nombre: true } } } } },
  });
  res.status(201).json(equipos);
});

module.exports = router;
