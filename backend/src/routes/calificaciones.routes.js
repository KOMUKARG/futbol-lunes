const express = require('express');
const prisma = require('../db');
const { requiereAuth } = require('../middleware/auth');
const { obtenerConfiguracion } = require('../utils/configuracion');

const router = express.Router();

const CONCEPTOS = [
  'nivelTecnico', 'actitud', 'puntualidad', 'juegoEnEquipo',
  'velocidad', 'regate', 'cabezazo', 'habilidadTactica', 'remate',
];

// Calcula el período trimestral actual, ej. "2026-Q3"
function periodoActual() {
  const ahora = new Date();
  const trimestre = Math.floor(ahora.getUTCMonth() / 3) + 1;
  return `${ahora.getUTCFullYear()}-Q${trimestre}`;
}

// GET /api/calificaciones/pendientes — jugadores que todavía no califiqué en el período actual
router.get('/pendientes', requiereAuth, async (req, res) => {
  const config = await obtenerConfiguracion();
  if (!config.calificacionesAbiertas) {
    return res.json({ abierto: false, periodo: periodoActual(), total: 0, completados: 0, pendientes: [] });
  }

  const periodo = periodoActual();
  const jugadorQueCalificaId = req.usuario.id;

  const [todos, yaCalificados] = await Promise.all([
    prisma.usuario.findMany({
      where: { id: { not: jugadorQueCalificaId } },
      select: { id: true, nombre: true, foto: true, posicion: true, autopercepcion: true },
    }),
    prisma.calificacion.findMany({
      where: { periodo, jugadorQueCalificaId },
      select: { jugadorCalificadoId: true },
    }),
  ]);

  const yaCalificadosIds = new Set(yaCalificados.map((c) => c.jugadorCalificadoId));
  res.json({
    abierto: true,
    periodo,
    total: todos.length,
    completados: yaCalificadosIds.size,
    pendientes: todos.filter((j) => !yaCalificadosIds.has(j.id)),
  });
});

// POST /api/calificaciones — el jugador califica a un compañero (anónimo, sección 4.4)
// body: { jugadorCalificadoId, nivelTecnico, actitud, ... } (1-5 cada concepto)
router.post('/', requiereAuth, async (req, res) => {
  const config = await obtenerConfiguracion();
  if (!config.calificacionesAbiertas) {
    return res.status(403).json({ error: 'Las calificaciones trimestrales están cerradas por el administrador.' });
  }

  const jugadorQueCalificaId = req.usuario.id;
  const { jugadorCalificadoId, ...valores } = req.body;

  if (jugadorCalificadoId === jugadorQueCalificaId) {
    return res.status(400).json({ error: 'No podés calificarte a vos mismo.' });
  }
  for (const concepto of CONCEPTOS) {
    const valor = valores[concepto];
    if (!Number.isInteger(valor) || valor < 1 || valor > 5) {
      return res.status(400).json({ error: `El concepto "${concepto}" debe ser un entero entre 1 y 5.` });
    }
  }

  const periodo = periodoActual();
  const calificacion = await prisma.calificacion.upsert({
    where: {
      periodo_jugadorCalificadoId_jugadorQueCalificaId: {
        periodo, jugadorCalificadoId, jugadorQueCalificaId,
      },
    },
    update: valores,
    create: { periodo, jugadorCalificadoId, jugadorQueCalificaId, ...valores },
  });

  // La respuesta nunca expone jugadorQueCalificaId a otro jugador distinto de quien calificó,
  // preservando el anonimato (esto además se refuerza restringiendo el acceso a este recurso por rol).
  const { jugadorQueCalificaId: _omit, ...calificacionSinRevelarAutor } = calificacion;
  res.status(201).json(calificacionSinRevelarAutor);
});

module.exports = router;
