const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const partidosRoutes = require('./routes/partidos.routes');
const inscripcionesRoutes = require('./routes/inscripciones.routes');
const equiposRoutes = require('./routes/equipos.routes');
const calificacionesRoutes = require('./routes/calificaciones.routes');
const feedRoutes = require('./routes/feed.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/partidos', partidosRoutes);
// Inscripciones y equipos cuelgan de /api/partidos/:id/... (ver dentro de cada router)
app.use('/api/partidos', inscripcionesRoutes);
app.use('/api/partidos', equiposRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/feed', feedRoutes);

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
