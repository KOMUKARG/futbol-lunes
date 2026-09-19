import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Escudo from '../components/Escudo';
import { useConfiguracion } from '../context/ConfiguracionContext';
import { comprimirImagen } from '../utils/comprimirImagen';

export default function EscudosConfig() {
  const { escudoOscuroUrl, escudoBlancoUrl, recargarConfiguracion } = useConfiguracion();
  const [subiendo, setSubiendo] = useState(null); // 'oscuro' | 'blanco' | null
  const inputOscuroRef = useRef(null);
  const inputBlancoRef = useRef(null);

  async function subirEscudo(color, archivo) {
    if (!archivo) return;
    setSubiendo(color);
    try {
      const imagen = await comprimirImagen(archivo, 300, 0.85);
      const campo = color === 'oscuro' ? 'escudoOscuroUrl' : 'escudoBlancoUrl';
      await api.patch('/configuracion', { [campo]: imagen });
      await recargarConfiguracion();
    } finally {
      setSubiendo(null);
    }
  }

  return (
    <div className="app-shell">
      <div className="header">
        <Link to="/admin/armado-equipos">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15171B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </div>
        </Link>
        <div className="disp" style={{ fontWeight: 800, fontSize: 18, flexGrow: 1 }}>Escudos de los equipos</div>
        <div style={{ background: 'var(--ink)', color: '#E8C87A', fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 16 }}>ADMIN</div>
      </div>

      <div className="content">
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>
          Subí una imagen para cada escudo. Se van a usar en todo el sitio en lugar del ícono genérico.
        </div>

        <PanelEscudo
          titulo="OSCUROS"
          color="oscuro"
          url={escudoOscuroUrl}
          subiendo={subiendo === 'oscuro'}
          onElegirArchivo={() => inputOscuroRef.current?.click()}
        />
        <input ref={inputOscuroRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { subirEscudo('oscuro', e.target.files?.[0]); e.target.value = ''; }} />

        <PanelEscudo
          titulo="BLANCOS"
          color="blanco"
          url={escudoBlancoUrl}
          subiendo={subiendo === 'blanco'}
          onElegirArchivo={() => inputBlancoRef.current?.click()}
        />
        <input ref={inputBlancoRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { subirEscudo('blanco', e.target.files?.[0]); e.target.value = ''; }} />

        <div style={{ background: '#EFF4F1', borderRadius: 12, padding: '12px 14px', fontSize: 11.5, color: '#3F5A48', lineHeight: 1.4 }}>
          Solo el administrador puede cambiar los escudos. El cambio se aplica al instante para todos.
        </div>
      </div>
    </div>
  );
}

function PanelEscudo({ titulo, color, url, subiendo, onElegirArchivo }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div className="disp" style={{ fontWeight: 800, fontSize: 16 }}>{titulo}</div>
      <div style={{
        width: 96, height: 96, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color === 'blanco' ? '#fff' : 'var(--ink)',
        border: color === 'blanco' ? '1.5px solid var(--border)' : 'none',
        overflow: 'hidden',
      }}>
        <Escudo color={color} url={url} size={url ? 96 : 52} />
      </div>
      <button className="btn-outline" style={{ width: '100%' }} onClick={onElegirArchivo} disabled={subiendo}>
        {subiendo ? 'Subiendo…' : 'Subir imagen del escudo'}
      </button>
      <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>PNG o JPG · se recomienda fondo transparente</div>
    </div>
  );
}
