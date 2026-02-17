import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { api } from '../api/client.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [recentReadings, setRecentReadings] = useState([]);
  const [cardSets, setCardSets] = useState([]);

  useEffect(() => {
    api.get('/readings').then(d => setRecentReadings(d.readings?.slice(0, 3) || [])).catch(() => {});
    api.get('/card-sets').then(d => setCardSets(d.card_sets || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 style={{ marginBottom: '0.25rem' }}>Welcome back, {user?.display_name}</h1>
        <p className="text-muted">What would you like to explore today?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-3 mb-4">
        <Link to="/readings" className="card" style={{ textAlign: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--color-text)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#9734;</div>
          <h3>New Reading</h3>
          <p className="text-sm text-muted">Draw oracle cards for guidance</p>
        </Link>

        <Link to="/learn" className="card" style={{ textAlign: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--color-text)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#9733;</div>
          <h3>Learn</h3>
          <p className="text-sm text-muted">Explore card meanings and spreads</p>
        </Link>

        <Link to="/chat" className="card" style={{ textAlign: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--color-text)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#9993;</div>
          <h3>Chat</h3>
          <p className="text-sm text-muted">Message your oracle guide</p>
        </Link>
      </div>

      {/* Recent Readings */}
      <div className="mb-4">
        <div className="flex-between mb-2">
          <h2>Recent Readings</h2>
          <Link to="/readings" style={{ fontSize: '0.9rem' }}>View All</Link>
        </div>
        {recentReadings.length === 0 ? (
          <div className="card empty-state">
            <h3>No readings yet</h3>
            <p className="text-muted">Start your first oracle card reading</p>
            <Link to="/readings" className="btn btn-primary mt-2" style={{ display: 'inline-flex' }}>Begin a Reading</Link>
          </div>
        ) : (
          <div className="grid grid-3">
            {recentReadings.map(r => (
              <Link key={r.id} to={`/readings/${r.id}`} className="card" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
                <div className="flex-between mb-1">
                  <span className="badge badge-info">{r.spread_type.replace('_', ' ')}</span>
                  <span className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <h3 style={{ fontSize: '1rem' }}>{r.card_set_name}</h3>
                {r.question && <p className="text-sm text-muted">{r.question}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Available Card Sets */}
      {cardSets.length > 0 && (
        <div>
          <h2 className="mb-2">Available Decks</h2>
          <div className="grid grid-3">
            {cardSets.map(set => (
              <div key={set.id} className="card">
                {set.cover_image_url && (
                  <img src={set.cover_image_url} alt={set.name}
                    style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '0.75rem' }} />
                )}
                <h3 style={{ fontSize: '1rem' }}>{set.name}</h3>
                <p className="text-sm text-muted">{set.description}</p>
                <p className="text-sm mt-2">{set.card_count} cards</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
