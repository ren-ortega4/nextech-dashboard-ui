import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../store';
import { triggerSync } from '../api';
import { useState } from 'react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await triggerSync();
      show(`Sync completado: ${res.synced} órdenes actualizadas`, 'success');
    } catch {
      show('Error al sincronizar', 'error');
    } finally {
      setSyncing(false);
    }
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
          <button onClick={handleSync} disabled={syncing} style={{ display: 'block', marginBottom: 4 }}>
            {syncing ? 'Sincronizando…' : '🔄 Sync WooCommerce'}
          </button>
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
