const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-este-secreto-en-produccion';

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '30d' } // pensado para que la sesión dure toda la temporada sin relogin constante
  );
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { firmarToken, verificarToken };
