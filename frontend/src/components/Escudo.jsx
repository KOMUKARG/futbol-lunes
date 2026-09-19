// Escudo de un equipo (Oscuros/Blancos). Si el admin subió una imagen, se muestra esa;
// si no, se dibuja un escudo genérico negro (oscuro) o blanco (blanco) como placeholder.
export default function Escudo({ color, url, size = 14 }) {
  if (url) {
    return (
      <img
        src={url}
        alt={color === 'blanco' ? 'Escudo Blancos' : 'Escudo Oscuros'}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
      />
    );
  }

  const esBlanco = color === 'blanco';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        d="M12 2.5 4.5 5.8v5.4c0 5.3 3.2 9.3 7.5 10.8 4.3-1.5 7.5-5.5 7.5-10.8V5.8L12 2.5z"
        fill={esBlanco ? '#fff' : '#15171B'}
        stroke={esBlanco ? '#15171B' : 'none'}
        strokeWidth={esBlanco ? 1.4 : 0}
      />
    </svg>
  );
}
