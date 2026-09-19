import { useEffect, useState } from 'react';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

export default function Feed() {
  const { usuario, esAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [texto, setTexto] = useState('');
  const [comentarioPorPost, setComentarioPorPost] = useState({});

  function cargar() {
    api.get('/feed').then((res) => setPosts(res.data));
  }
  useEffect(cargar, []);

  async function publicar() {
    if (!texto.trim()) return;
    await api.post('/feed', { texto });
    setTexto('');
    cargar();
  }

  async function comentar(postId) {
    const texto = comentarioPorPost[postId];
    if (!texto?.trim()) return;
    await api.post(`/feed/${postId}/comentarios`, { texto });
    setComentarioPorPost((c) => ({ ...c, [postId]: '' }));
    cargar();
  }

  async function borrar(postId) {
    await api.delete(`/feed/${postId}`);
    cargar();
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div className="disp" style={{ fontWeight: 800, fontSize: 19 }}>Feed</div>
      </div>

      <div className="content">
        <div className="card" style={{ display: 'flex', gap: 8 }}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Qué querés compartir?" />
          <button className="btn-primary" style={{ width: 'auto', padding: '0 16px' }} onClick={publicar}>Publicar</button>
        </div>

        {posts.map((post) => (
          <div key={post.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 38, height: 38, background: '#4A6FA5' }}>{post.autor.nombre.slice(0, 1).toUpperCase()}</div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{post.autor.nombre}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{new Date(post.fecha).toLocaleString('es-AR')}</div>
              </div>
              {esAdmin && (
                <button onClick={() => borrar(post.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 11, cursor: 'pointer' }}>
                  Borrar
                </button>
              )}
            </div>
            <div style={{ fontSize: 13 }}>{post.texto}</div>

            {post.comentarios.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                {post.comentarios.map((c) => (
                  <div key={c.id} style={{ fontSize: 12 }}>
                    <b>{c.autor.nombre}</b> {c.texto}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Comentar…"
                value={comentarioPorPost[post.id] || ''}
                onChange={(e) => setComentarioPorPost((c) => ({ ...c, [post.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && comentar(post.id)}
              />
              <button className="btn-outline" style={{ width: 'auto', padding: '0 14px' }} onClick={() => comentar(post.id)}>Enviar</button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
