import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTenant } from '../../context/TenantContext.jsx';
import { api } from '../../api/client.js';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [stats, setStats] = useState({ users: 0, cardSets: 0, readings: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/users').catch(() => ({ users: [] })),
      api.get('/card-sets').catch(() => ({ card_sets: [] })),
    ]).then(([usersData, setsData]) => {
      setStats({
        users: usersData.users?.length || 0,
        cardSets: setsData.card_sets?.length || 0,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="mb-1">Admin Dashboard</h1>
      <p className="text-muted mb-4">{tenant?.name || 'Oracle App Instance'}</p>

      <div className="grid grid-3 mb-4">
        <div className="card text-center">
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{stats.users}</div>
          <p className="text-sm text-muted">Users</p>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{stats.cardSets}</div>
          <p className="text-sm text-muted">Card Sets</p>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent)' }}>-</div>
          <p className="text-sm text-muted">Readings (Total)</p>
        </div>
      </div>

      <h2 className="mb-2">Quick Actions</h2>
      <div className="grid grid-2">
        <Link to="/admin/card-sets" className="card" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
          <h3>Manage Card Sets</h3>
          <p className="text-sm text-muted">Create and edit your oracle card decks</p>
        </Link>
        <Link to="/admin/readings" className="card" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
          <h3>Manage Readings</h3>
          <p className="text-sm text-muted">Configure reading templates and spreads</p>
        </Link>
        <Link to="/admin/theme" className="card" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
          <h3>Customize Theme</h3>
          <p className="text-sm text-muted">Colors, fonts, and branding</p>
        </Link>
        <Link to="/admin/webhooks" className="card" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
          <h3>API & Webhooks</h3>
          <p className="text-sm text-muted">Zapier integration and API keys</p>
        </Link>
      </div>
    </div>
  );
}
