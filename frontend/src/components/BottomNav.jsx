import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/inscripcion', label: 'Inscripción' },
  { to: '/historial', label: 'Historial' },
  { to: '/feed', label: 'Feed' },
  { to: '/perfil', label: 'Perfil' },
];

export default function BottomNav() {
  return (
    <nav className="navbar">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `navitem${isActive ? ' active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
