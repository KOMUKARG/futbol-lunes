// Carga datos de ejemplo para probar la app sin tener que cargar todo a mano.
// Ejecutar con: npm run seed

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NOMBRES = [
  'Juan Pérez', 'Martín G.', 'Nico R.', 'Facu L.', 'Diego M.', 'Pablo S.',
  'Tomás P.', 'Lucas F.', 'Gonza A.', 'Fede T.', 'Ale V.', 'Cristian D.',
  'Rodrigo N.', 'Maxi C.', 'Ezequiel B.', 'Santiago H.',
];

async function main() {
  console.log('🌱 Sembrando datos de ejemplo...');

  const passwordHash = await bcrypt.hash('futbol123', 10);

  // Admin (vos)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@futbollunes.com' },
    update: {},
    create: {
      nombre: 'Vos',
      email: 'admin@futbollunes.com',
      passwordHash,
      rol: 'admin',
      posicion: 'Mediocampista',
      autopercepcion: 'oscuro',
      edad: 29,
      altura: 1.78,
      estadoFisico: 'Bueno',
      clubFavorito: 'River Plate',
      intereses: 'Asado, pádel y cine',
    },
  });

  // Resto del plantel
  const jugadores = [admin];
  for (let i = 0; i < NOMBRES.length; i++) {
    const email = `jugador${i + 1}@futbollunes.com`;
    const jugador = await prisma.usuario.upsert({
      where: { email },
      update: {},
      create: {
        nombre: NOMBRES[i],
        email,
        passwordHash,
        rol: 'jugador',
        posicion: ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'][i % 4],
        autopercepcion: i % 3 === 0 ? 'oscuro' : i % 3 === 1 ? 'blanco' : 'indistinto',
        edad: 22 + (i % 15),
      },
    });
    jugadores.push(jugador);
  }
  console.log(`✔ ${jugadores.length} jugadores (incluye admin)`);

  // Un partido jugado la semana pasada, con resultado, goles y voto de MVP
  const partidoJugado = await prisma.partido.create({
    data: {
      fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      estado: 'jugado',
      golesOscuros: 5,
      golesBlancos: 3,
    },
  });

  const equipoOscuro = await prisma.equipo.create({ data: { partidoId: partidoJugado.id, color: 'oscuro' } });
  const equipoBlanco = await prisma.equipo.create({ data: { partidoId: partidoJugado.id, color: 'blanco' } });

  await prisma.equipoJugador.createMany({
    data: jugadores.slice(0, 7).map((j) => ({ equipoId: equipoOscuro.id, jugadorId: j.id })),
  });
  await prisma.equipoJugador.createMany({
    data: jugadores.slice(7, 14).map((j) => ({ equipoId: equipoBlanco.id, jugadorId: j.id })),
  });

  await prisma.gol.createMany({
    data: [
      { partidoId: partidoJugado.id, jugadorId: jugadores[1].id, equipoColor: 'oscuro', cantidad: 2 },
      { partidoId: partidoJugado.id, jugadorId: admin.id, equipoColor: 'oscuro', cantidad: 2 },
      { partidoId: partidoJugado.id, jugadorId: jugadores[2].id, equipoColor: 'oscuro', cantidad: 1 },
      { partidoId: partidoJugado.id, jugadorId: jugadores[7].id, equipoColor: 'blanco', cantidad: 3 },
    ],
  });

  await prisma.votoMVP.createMany({
    data: jugadores.slice(2, 11).map((j) => ({
      partidoId: partidoJugado.id,
      jugadorQueVotaId: j.id,
      jugadorVotadoId: jugadores[1].id, // Martín G. es el MVP
    })),
    skipDuplicates: true,
  });

  // El próximo partido, abierto para inscripción, con algunos ya anotados
  const proximoLunes = new Date();
  proximoLunes.setDate(proximoLunes.getDate() + ((1 + 7 - proximoLunes.getDay()) % 7 || 7));

  const partidoProximo = await prisma.partido.create({
    data: { fecha: proximoLunes, estado: 'abierto' },
  });

  await prisma.inscripcion.createMany({
    data: jugadores.slice(0, 8).map((j, i) => ({
      partidoId: partidoProximo.id,
      jugadorId: j.id,
      estado: 'confirmado',
      fechaHora: new Date(Date.now() - (8 - i) * 60 * 1000),
    })),
  });

  // Algunas calificaciones del trimestre actual, para tener puntuaciones no neutras
  const trimestre = Math.floor(new Date().getUTCMonth() / 3) + 1;
  const periodo = `${new Date().getUTCFullYear()}-Q${trimestre}`;
  for (const calificador of jugadores.slice(0, 5)) {
    for (const calificado of jugadores) {
      if (calificado.id === calificador.id) continue;
      await prisma.calificacion.upsert({
        where: {
          periodo_jugadorCalificadoId_jugadorQueCalificaId: {
            periodo, jugadorCalificadoId: calificado.id, jugadorQueCalificaId: calificador.id,
          },
        },
        update: {},
        create: {
          periodo,
          jugadorCalificadoId: calificado.id,
          jugadorQueCalificaId: calificador.id,
          nivelTecnico: 3 + (Math.random() > 0.5 ? 1 : 0),
          actitud: 4,
          puntualidad: 4,
          juegoEnEquipo: 4,
          velocidad: 3,
          regate: 3,
          cabezazo: 3,
          habilidadTactica: 4,
          remate: 3,
        },
      });
    }
  }

  // Un par de posts en el feed
  await prisma.post.create({
    data: {
      autorId: jugadores[1].id,
      texto: 'Golazo de Juan el lunes 🔥',
    },
  });
  await prisma.post.create({
    data: {
      autorId: jugadores[0].id,
      texto: '¿Alguien puede el lunes que viene además del fútbol? Se arma después una previa 🍻',
    },
  });

  console.log('✅ Seed completo.');
  console.log('   Login admin: admin@futbollunes.com / futbol123');
  console.log('   Login jugador: jugador1@futbollunes.com / futbol123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
