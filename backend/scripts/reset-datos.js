// Script de un solo uso: borra todos los datos de prueba y crea el usuario admin real.
const bcrypt = require('bcryptjs');
const prisma = require('../src/db');

async function main() {
  console.log('Borrando datos de prueba...');
  await prisma.comentario.deleteMany();
  await prisma.post.deleteMany();
  await prisma.votoMVP.deleteMany();
  await prisma.calificacion.deleteMany();
  await prisma.gol.deleteMany();
  await prisma.equipoJugador.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.inscripcion.deleteMany();
  await prisma.partido.deleteMany();
  await prisma.usuario.deleteMany();
  console.log('Datos de prueba borrados.');

  const passwordHash = await bcrypt.hash('Jose2899', 10);
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Pollo',
      email: 'diegoaguilar_89@hotmail.com',
      passwordHash,
      rol: 'admin',
    },
  });
  console.log('Usuario admin creado:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
