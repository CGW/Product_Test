import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccountPage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ display_name: name });
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    app_owner_admin: 'Platform Owner',
    app_admin: 'Platform Admin',
    oracle_card_admin: 'Oracle Card Admin',
    user: 'User',
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <h1 className="mb-3">Account Settings</h1>

      <div className="card mb-3">
        <h3 className="mb-2">Profile</h3>

        <div className="flex gap-2 mb-3" style={{ alignItems: 'center' }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%' }} />
          ) : (
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white',
            }}>
              {user?.display_name?.charAt(0)}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 600 }}>{user?.display_name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            <span className="badge badge-info">{roleLabels[user?.role] || user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Display Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>Email is managed by Google authentication</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {message && <p className="text-sm mt-2" style={{ color: message.startsWith('Error') ? '#FC8181' : '#68D391' }}>{message}</p>}
        </form>
      </div>

      <div className="card">
        <h3 className="mb-2">Session</h3>
        <button className="btn btn-danger" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}
