import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TenantSelectPage() {
  const [slug, setSlug] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (slug.trim()) {
      navigate(`/login?tenant=${slug.trim()}`);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Oracle App Platform</h1>
        <p className="text-muted mb-4">Enter your oracle app name to continue</p>

        <form onSubmit={handleSubmit} className="card" style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label>App Name (slug)</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
              placeholder="e.g. mystic-moon" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Continue
          </button>
        </form>

        <p className="text-sm text-muted mt-3">
          Or go directly: <a href="/login?tenant=mystic-moon" style={{ color: 'var(--color-primary)' }}>Demo: Mystic Moon</a>
        </p>
      </div>
    </div>
  );
}
