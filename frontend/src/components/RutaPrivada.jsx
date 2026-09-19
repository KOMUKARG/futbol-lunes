import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Envuelve páginas que requieren sesión iniciada; soloAdmin además exige rol admin.
export default function RutaPrivada({ children, soloAdmin = false }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/" replace />;

  return children;
}
