import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCargando(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUsuario(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setCargando(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem('token');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, login, logout, cargando, esAdmin: usuario?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
