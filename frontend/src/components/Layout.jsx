import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/suppliers', label: 'Suppliers' },
  { to: '/fruits', label: 'Fruits' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/purchases', label: 'Purchases' },
  { to: '/sales', label: 'Sales' },
  { to: '/stock', label: 'Stock' },
  { to: '/reports', label: 'Reports' },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>Menu</button>
        <strong>Batloung Farm</strong>
      </header>

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div>
            <h1>Batloung Farm</h1>
            <p>Distribution Management</p>
          </div>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-footer">Maseru, Lesotho</p>
      </aside>
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
