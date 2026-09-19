const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { firmarToken } = require('../utils/jwt');
const { requiereAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
// El registro NO es público: el administrador da de alta a cada jugador (ver sección 2 del doc de diseño).
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = firmarToken(usuario);
  const { passwordHash, ...usuarioSinPassword } = usuario;
  res.json({ token, usuario: usuarioSinPassword });
});

// GET /api/auth/me — devuelve el usuario autenticado actual
router.get('/me', requiereAuth, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
  const { passwordHash, ...usuarioSinPassword } = usuario;
  res.json(usuarioSinPassword);
});

module.exports = router;
