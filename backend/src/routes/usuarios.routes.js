const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const { contarVecesMVP } = require('../utils/mvp');

const router = express.Router();

// Campos de perfil que un jugador puede editar sobre sí mismo (sección 4.1 del doc de diseño)
const CAMPOS_PERFIL_EDITABLES = [
  'foto', 'edad', 'altura', 'estadoFisico', 'posicion',
  'clubFavorito', 'intereses', 'autopercepcion',
];

// GET /api/usuarios — listado básico (para armar equipos, calificar, etc.)
router.get('/', requiereAuth, async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true, nombre: true, foto: true, posicion: true,
      autopercepcion: true, rol: true,
    },
    orderBy: { nombre: 'asc' },
  });
  res.json(usuarios);
});

// GET /api/usuarios/:id — perfil completo + stats (puntuación, MVPs, partidos)
router.get('/:id', requiereAuth, async (req, res) => {
  const { id } = req.params;
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) return res.status(404).json({ error: 'Jugador no encontrado.' });

  const [vecesMVP, partidosJugados, golesTotales] = await Promise.all([
    contarVecesMVP(id),
    prisma.equipoJugador.count({ where: { jugadorId: id } }),
    prisma.gol.aggregate({ where: { jugadorId: id }, _sum: { cantidad: true } }),
  ]);

  const { passwordHash, ...usuarioSinPassword } = usuario;
  res.json({
    ...usuarioSinPassword,
    stats: {
      partidosJugados,
      golesTotales: golesTotales._sum.cantidad || 0,
      vecesMVP,
    },
  });
});

// PATCH /api/usuarios/me — el jugador edita su propio perfil
router.patch('/me', requiereAuth, async (req, res) => {
  const data = {};
  for (const campo of CAMPOS_PERFIL_EDITABLES) {
    if (req.body[campo] !== undefined) data[campo] = req.body[campo];
  }
  if (data.intereses && data.intereses.length > 40) {
    return res.status(400).json({ error: 'Intereses: máximo 40 caracteres.' });
  }

  const usuario = await prisma.usuario.update({ where: { id: req.usuario.id }, data });
  const { passwordHash, ...usuarioSinPassword } = usuario;
  res.json(usuarioSinPassword);
});

// POST /api/usuarios — solo Admin: alta de un nuevo jugador (no hay registro público)
router.post('/', requiereAuth, requiereAdmin, async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash, rol: rol === 'admin' ? 'admin' : 'jugador' },
  });
  const { passwordHash: _omit, ...usuarioSinPassword } = usuario;
  res.status(201).json(usuarioSinPassword);
});

// GET /api/usuarios/:id/evolucion-puntuacion — puntuación promedio por período (para el gráfico del perfil)
router.get('/:id/evolucion-puntuacion', requiereAuth, async (req, res) => {
  const { id } = req.params;
  const calificaciones = await prisma.calificacion.findMany({
    where: { jugadorCalificadoId: id },
  });

  const porPeriodo = {};
  for (const c of calificaciones) {
    const promedioConcepto = (
      c.nivelTecnico + c.actitud + c.puntualidad + c.juegoEnEquipo +
      c.velocidad + c.regate + c.cabezazo + c.habilidadTactica + c.remate
    ) / 9;
    if (!porPeriodo[c.periodo]) porPeriodo[c.periodo] = [];
    porPeriodo[c.periodo].push(promedioConcepto);
  }

  const evolucion = Object.entries(porPeriodo)
    .map(([periodo, valores]) => ({
      periodo,
      puntuacion: Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)),
    }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  res.json(evolucion);
});

module.exports = router;
