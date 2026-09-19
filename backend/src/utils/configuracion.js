const prisma = require('../db');

// Fila única (singleton) con los escudos de los equipos y el estado de las calificaciones
// trimestrales. Se crea sola con valores por defecto la primera vez que se pide.
async function obtenerConfiguracion() {
  let config = await prisma.configuracion.findUnique({ where: { id: 'singleton' } });
  if (!config) {
    config = await prisma.configuracion.create({ data: { id: 'singleton' } });
  }
  return config;
}

module.exports = { obtenerConfiguracion };
