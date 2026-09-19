const express = require('express');
const prisma = require('../db');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const { obtenerConfiguracion } = require('../utils/configuracion');

const router = express.Router();

// GET /api/configuracion — escudos de los equipos y si las calificaciones trimestrales
// están abiertas. Cualquier usuario logueado puede leerla.
router.get('/', requiereAuth, async (req, res) => {
  const config = await obtenerConfiguracion();
  res.json(config);
});

// PATCH /api/configuracion — solo Admin: sube/cambia los escudos y abre o cierra
// las calificaciones trimestrales (el admin decide cuándo, sin ventana de tiempo fija).
router.patch('/', requiereAuth, requiereAdmin, async (req, res) => {
  const { escudoOscuroUrl, escudoBlancoUrl, calificacionesAbiertas } = req.body;
  const data = {};
  if (escudoOscuroUrl !== undefined) data.escudoOscuroUrl = escudoOscuroUrl;
  if (escudoBlancoUrl !== undefined) data.escudoBlancoUrl = escudoBlancoUrl;
  if (calificacionesAbiertas !== undefined) data.calificacionesAbiertas = !!calificacionesAbiertas;

  await obtenerConfiguracion(); // asegura que la fila exista antes de actualizarla
  const config = await prisma.configuracion.update({ where: { id: 'singleton' }, data });
  res.json(config);
});

module.exports = router;
