const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const partidosRoutes = require('./routes/partidos.routes');
const inscripcionesRoutes = require('./routes/inscripciones.routes');
const equiposRoutes = require('./routes/equipos.routes');
const calificacionesRoutes = require('./routes/calificaciones.routes');
const calificacionesPartidoRoutes = require('./routes/calificacionesPartido.routes');
const jugadoresRoutes = require('./routes/jugadores.routes');
const configuracionRoutes = require('./routes/configuracion.routes');
const feedRoutes = require('./routes/feed.routes');

const app = express();

app.use(cors());
// Límite subido a 5mb: las fotos de perfil y los escudos de los equipos viajan
// como imágenes comprimidas en base64 dentro del body del request.
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/partidos', partidosRoutes);
// Inscripciones, equipos y calificaciones post-partido cuelgan de /api/partidos/:id/... (ver dentro de cada router)
app.use('/api/partidos', inscripcionesRoutes);
app.use('/api/partidos', equiposRoutes);
app.use('/api/partidos', calificacionesPartidoRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/feed', feedRoutes);

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
