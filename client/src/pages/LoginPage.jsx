import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const { tenant, theme, loadTenant } = useTenant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');
  const [loading, setLoading] = useState(false);

  const tenantSlug = searchParams.get('tenant') || 'mystic-moon';

  useEffect(() => {
    if (tenantSlug) {
      loadTenant(tenantSlug);
    }
  }, [tenantSlug, loadTenant]);

  useEffect(() => {
    if (user) {
      const levels = { app_owner_admin: 40, app_admin: 30, oracle_card_admin: 20, user: 10 };
      if (levels[user.role] >= 30) {
        navigate('/owner');
      } else if (user.role === 'oracle_card_admin') {
        navigate('/admin');
      } else if (!user.onboarding_completed) {
        navigate('/welcome');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleDevLogin = async (e) => {
    e.preventDefault();
    if (!devEmail) return;
    setLoading(true);
    setError('');
    try {
      const credential = JSON.stringify({
        email: devEmail,
        name: devName || devEmail.split('@')[0],
        google_id: `dev_${devEmail}`,
      });
      await login(credential, tenantSlug);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {theme?.logo_url && (
          <img src={theme.logo_url} alt="" style={{ height: 60, marginBottom: '1.5rem' }} />
        )}

        <h1 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
          {tenant?.name || 'Oracle App'}
        </h1>
        <p className="text-muted mb-4">{tenant?.business_name || 'Sign in to continue'}</p>

        {error && (
          <div style={{ background: '#742A2A', color: '#FED7D7', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Google Auth Button placeholder */}
        <div className="card mb-3">
          <button className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            onClick={() => {/* Google Sign In would go here */}}>
            Sign in with Google
          </button>
          <p className="text-sm text-muted mt-2">Google OAuth requires configuration with your Google Client ID</p>
        </div>

        {/* Dev mode login */}
        <div className="card" style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Development Login</h3>
          <form onSubmit={handleDevLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={devEmail} onChange={e => setDevEmail(e.target.value)}
                placeholder="e.g. oracle@mysticmoon.com" required />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={devName} onChange={e => setDevName(e.target.value)}
                placeholder="Display name" />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Dev Sign In'}
            </button>
          </form>
        </div>

        <p className="text-sm text-muted mt-3">
          Tenant: <strong>{tenantSlug}</strong>
        </p>
      </div>
    </div>
  );
}
