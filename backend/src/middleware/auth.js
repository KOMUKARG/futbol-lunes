const { verificarToken } = require('../utils/jwt');

// Exige un JWT válido en el header Authorization: Bearer <token>
function requiereAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Falta el token.' });
  }

  try {
    req.usuario = verificarToken(token); // { id, email, rol }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// Exige además que el usuario autenticado tenga rol admin
function requiereAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Esta acción es solo para administradores.' });
  }
  next();
}

module.exports = { requiereAuth, requiereAdmin };
