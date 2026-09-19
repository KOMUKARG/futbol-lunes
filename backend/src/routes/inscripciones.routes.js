const express = require('express');
const prisma = require('../db');
const { requiereAuth } = require('../middleware/auth');

const router = express.Router();
const CUPO_MAXIMO = Number(process.env.CUPO_MAXIMO || 14);

// POST /api/partidos/:id/inscripciones — el jugador se anota (sección 4.2 / flujo 5.1)
router.post('/:id/inscripciones', requiereAuth, async (req, res) => {
  const { id: partidoId } = req.params;
  const jugadorId = req.usuario.id;

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado.' });
  if (partido.estado !== 'abierto') {
    return res.status(400).json({ error: 'La inscripción para este partido no está abierta.' });
  }

  const yaInscripto = await prisma.inscripcion.findUnique({
    where: { partidoId_jugadorId: { partidoId, jugadorId } },
  });
  if (yaInscripto && yaInscripto.estado !== 'baja') {
    return res.status(400).json({ error: 'Ya estás anotado para este partido.' });
  }

  const confirmados = await prisma.inscripcion.count({
    where: { partidoId, estado: 'confirmado' },
  });
  const estado = confirmados < CUPO_MAXIMO ? 'confirmado' : 'espera';

  const inscripcion = yaInscripto
    ? await prisma.inscripcion.update({
        where: { id: yaInscripto.id },
        data: { estado, fechaHora: new Date() },
      })
    : await prisma.inscripcion.create({ data: { partidoId, jugadorId, estado } });

  res.status(201).json(inscripcion);
});

// DELETE /api/partidos/:id/inscripciones/me — el jugador se da de baja
// Si estaba confirmado, promueve automáticamente al primero de la lista de espera (flujo 5.1).
// No hay penalización por baja tardía (definido en la sección 7 del documento).
router.delete('/:id/inscripciones/me', requiereAuth, async (req, res) => {
  const { id: partidoId } = req.params;
  const jugadorId = req.usuario.id;

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { partidoId_jugadorId: { partidoId, jugadorId } },
  });
  if (!inscripcion || inscripcion.estado === 'baja') {
    return res.status(404).json({ error: 'No estás anotado en este partido.' });
  }

  const eraConfirmado = inscripcion.estado === 'confirmado';
  await prisma.inscripcion.update({ where: { id: inscripcion.id }, data: { estado: 'baja' } });

  if (eraConfirmado) {
    const primeroEnEspera = await prisma.inscripcion.findFirst({
      where: { partidoId, estado: 'espera' },
      orderBy: { fechaHora: 'asc' },
    });
    if (primeroEnEspera) {
      await prisma.inscripcion.update({
        where: { id: primeroEnEspera.id },
        data: { estado: 'confirmado' },
      });
      // Acá se dispararía la notificación "pasaste a confirmado" (sección 4.7)
    }
  }

  res.status(204).send();
});

module.exports = router;
