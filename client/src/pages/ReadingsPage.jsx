import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ReadingsPage() {
  const navigate = useNavigate();
  const [cardSets, setCardSets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [readings, setReadings] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [question, setQuestion] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNewReading, setShowNewReading] = useState(false);

  useEffect(() => {
    api.get('/card-sets').then(d => setCardSets(d.card_sets || [])).catch(() => {});
    api.get('/readings/templates').then(d => setTemplates(d.templates || [])).catch(() => {});
    api.get('/readings').then(d => setReadings(d.readings || [])).catch(() => {});
  }, []);

  const handleCreateReading = async (e) => {
    e.preventDefault();
    if (!selectedSet) return;
    setCreating(true);
    try {
      const data = await api.post('/readings', {
        card_set_id: selectedSet,
        template_id: selectedTemplate || undefined,
        question: question || undefined,
      });
      navigate(`/readings/${data.reading.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <h1>Readings</h1>
        <button className="btn btn-primary" onClick={() => setShowNewReading(!showNewReading)}>
          {showNewReading ? 'Cancel' : 'New Reading'}
        </button>
      </div>

      {showNewReading && (
        <div className="card mb-4" style={{ maxWidth: 500 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Start a New Reading</h2>
          <form onSubmit={handleCreateReading}>
            <div className="form-group">
              <label>Choose a Card Set</label>
              <select value={selectedSet} onChange={e => setSelectedSet(e.target.value)} required>
                <option value="">Select a deck...</option>
                {cardSets.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.card_count} cards)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reading Type</label>
              <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                <option value="">Default (3-card spread)</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.card_count} cards)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Your Question (optional)</label>
              <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="What would you like guidance on?" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
              {creating ? 'Drawing cards...' : 'Draw Cards'}
            </button>
          </form>
        </div>
      )}

      {/* Past readings */}
      <h2 className="mb-2">Your Past Readings</h2>
      {readings.length === 0 ? (
        <div className="card empty-state">
          <h3>No readings yet</h3>
          <p className="text-muted">Start your first reading above</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {readings.map(r => (
            <Link key={r.id} to={`/readings/${r.id}`} className="card" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
              <div className="flex-between mb-1">
                <span className="badge badge-info">{r.spread_type.replace('_', ' ')}</span>
                <span className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{r.card_set_name}</h3>
              {r.question && <p className="text-sm text-muted">{r.question}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
