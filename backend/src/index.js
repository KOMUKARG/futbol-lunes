require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`⚽ API de Fútbol de los Lunes corriendo en http://localhost:${PORT}`);
});
