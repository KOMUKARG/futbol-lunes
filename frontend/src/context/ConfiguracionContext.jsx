import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const ConfiguracionContext = createContext(null);

const DEFAULT_CONFIG = { escudoOscuroUrl: null, escudoBlancoUrl: null, calificacionesAbiertas: true };

// Configuración global de la app (escudos de los equipos, si las calificaciones trimestrales
// están abiertas). Se pide una sola vez que hay un usuario logueado.
export function ConfiguracionProvider({ children }) {
  const { usuario } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const recargarConfiguracion = useCallback(() => {
    return api.get('/configuracion').then((res) => setConfig(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (usuario) recargarConfiguracion();
  }, [usuario, recargarConfiguracion]);

  return (
    <ConfiguracionContext.Provider value={{ ...config, recargarConfiguracion }}>
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion() {
  return useContext(ConfiguracionContext);
}
