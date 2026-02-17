import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';

export default function AppShell() {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();

  const isAdmin = ['app_owner_admin', 'app_admin', 'oracle_card_admin'].includes(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="flex-between" style={{ maxWidth: 1200, margin: '0 auto', height: 60 }}>
          <NavLink to="/" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {tenant?.name || 'Oracle App'}
          </NavLink>

          <nav className="flex gap-2" style={{ alignItems: 'center' }}>
            <NavLink to="/readings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={navStyle}>Readings</NavLink>
            <NavLink to="/learn" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={navStyle}>Learn</NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={navStyle}>About</NavLink>
            <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={navStyle}>Chat</NavLink>

            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />

            {isAdmin && (
              <NavLink to="/admin" style={{ ...navStyle({}), fontSize: '0.8rem', opacity: 0.7 }}>Admin</NavLink>
            )}

            <div style={{ position: 'relative' }}>
              <button onClick={() => navigate('/account')} style={{
                background: 'none', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.85rem', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius)'
              }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'white' }}>
                    {user?.display_name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="hide-mobile">{user?.display_name}</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function navStyle({ isActive } = {}) {
  return {
    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius)',
    fontSize: '0.9rem',
    fontWeight: isActive ? 600 : 400,
    background: isActive ? 'rgba(107, 70, 193, 0.1)' : 'none',
  };
}
