const express = require('express');
const prisma = require('../db');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');

const router = express.Router();

const AUTOR_SELECT = { select: { id: true, nombre: true, foto: true } };

// GET /api/feed — muro cronológico (más nuevo primero), sección 4.6
router.get('/', requiereAuth, async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      autor: AUTOR_SELECT,
      comentarios: { include: { autor: AUTOR_SELECT }, orderBy: { fecha: 'asc' } },
    },
  });
  res.json(posts);
});

// POST /api/feed — cualquier jugador puede publicar, libre (sin horario restringido)
router.post('/', requiereAuth, async (req, res) => {
  const { texto, imagenUrl } = req.body;
  if (!texto && !imagenUrl) {
    return res.status(400).json({ error: 'El post necesita texto o una imagen.' });
  }
  const post = await prisma.post.create({
    data: { autorId: req.usuario.id, texto, imagenUrl },
    include: { autor: AUTOR_SELECT },
  });
  res.status(201).json(post);
});

// POST /api/feed/:id/comentarios
router.post('/:id/comentarios', requiereAuth, async (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: 'El comentario no puede estar vacío.' });

  const comentario = await prisma.comentario.create({
    data: { postId: req.params.id, autorId: req.usuario.id, texto },
    include: { autor: AUTOR_SELECT },
  });
  res.status(201).json(comentario);
});

// DELETE /api/feed/:id — solo Admin: moderación de contenido inapropiado
router.delete('/:id', requiereAuth, requiereAdmin, async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = router;
