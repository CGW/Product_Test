import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';

export default function AdminShell({ owner }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = owner ? [
    { to: '/owner', label: 'Tenants', end: true },
  ] : [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/card-sets', label: 'Card Sets' },
    { to: '/admin/readings', label: 'Readings' },
    { to: '/admin/theme', label: 'Theme' },
    { to: '/admin/about-editor', label: 'About Page' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/webhooks', label: 'Webhooks & API' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--color-surface)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '1.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
            {owner ? 'Platform Admin' : 'Admin Panel'}
          </h2>
          <p className="text-sm text-muted">{tenant?.name || 'Oracle App'}</p>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.6rem 1.5rem',
                fontSize: '0.9rem',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                background: isActive ? 'rgba(107, 70, 193, 0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {!owner && (
            <NavLink to="/" style={{ display: 'block', padding: '0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text)', opacity: 0.7 }}>
              Back to App
            </NavLink>
          )}
          <NavLink to={owner ? '/owner/account' : '/admin/account'} style={{ display: 'block', padding: '0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text)', opacity: 0.7 }}>
            Account Settings
          </NavLink>
          <button onClick={handleLogout} style={{
            background: 'none', color: 'var(--color-text)', opacity: 0.7, fontSize: '0.85rem', padding: '0.5rem 0',
          }}>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 240 }}>
        <header style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '1rem',
        }}>
          <span className="text-sm">{user?.display_name}</span>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'white' }}>
              {user?.display_name?.charAt(0)}
            </div>
          )}
        </header>

        <main style={{ padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
