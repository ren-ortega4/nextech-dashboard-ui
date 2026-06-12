import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          Nex<span>Tech</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/facturas" className={({ isActive }) => isActive ? 'active' : ''}>
            📄 Facturas
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div>{user?.name ?? user?.email}</div>
          <div style={{ fontSize: 11, marginBottom: 6, opacity: .7 }}>{user?.role}</div>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
