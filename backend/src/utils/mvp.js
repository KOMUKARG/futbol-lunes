const prisma = require('../db');

// Dado un partido, devuelve { jugadorId, votos } del más votado, o null si no hay votos.
// El empate se resuelve por orden de llegada del primer voto (simple y suficiente para el grupo).
async function calcularMVP(partidoId) {
  const votos = await prisma.votoMVP.groupBy({
    by: ['jugadorVotadoId'],
    where: { partidoId },
    _count: { jugadorVotadoId: true },
  });
  if (votos.length === 0) return null;

  const ganador = votos.reduce((max, actual) =>
    actual._count.jugadorVotadoId > max._count.jugadorVotadoId ? actual : max
  );

  const jugador = await prisma.usuario.findUnique({
    where: { id: ganador.jugadorVotadoId },
    select: { id: true, nombre: true },
  });

  return { jugadorId: ganador.jugadorVotadoId, nombre: jugador?.nombre, votos: ganador._count.jugadorVotadoId };
}

// Cuenta en cuántos partidos un jugador fue el MVP (ganador de la votación), histórico.
async function contarVecesMVP(jugadorId) {
  const partidosConVotos = await prisma.votoMVP.findMany({
    where: {}, // traemos todos los votos y agrupamos en memoria: volumen bajo (liga de amigos)
    select: { partidoId: true },
    distinct: ['partidoId'],
  });

  let veces = 0;
  for (const { partidoId } of partidosConVotos) {
    const mvp = await calcularMVP(partidoId);
    if (mvp?.jugadorId === jugadorId) veces += 1;
  }
  return veces;
}

module.exports = { calcularMVP, contarVecesMVP };
