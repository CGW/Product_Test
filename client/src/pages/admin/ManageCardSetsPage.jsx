import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function ManageCardSetsPage() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = () => {
    api.get('/card-sets').then(d => setSets(d.card_sets || [])).catch(() => {});
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data = await api.post('/card-sets', { name, description });
      navigate(`/admin/card-sets/${data.card_set.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (set) => {
    await api.patch(`/card-sets/${set.id}`, { is_published: !set.is_published });
    loadSets();
  };

  const handleDelete = async (set) => {
    if (!confirm(`Delete "${set.name}"? This cannot be undone.`)) return;
    await api.delete(`/card-sets/${set.id}`);
    loadSets();
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <h1>Card Sets</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Card Set'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-3" style={{ maxWidth: 500 }}>
          <h3 className="mb-2">Create Card Set</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Celestial Wisdom Deck" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe this card set..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Card Set'}
            </button>
          </form>
        </div>
      )}

      {sets.length === 0 ? (
        <div className="card empty-state">
          <h3>No card sets yet</h3>
          <p className="text-muted">Create your first oracle card set above</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {sets.map(set => (
            <div key={set.id} className="card">
              <div className="flex-between mb-2">
                <Link to={`/admin/card-sets/${set.id}`} style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {set.name}
                </Link>
                <span className={`badge ${set.is_published ? 'badge-success' : 'badge-warning'}`}>
                  {set.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              {set.cover_image_url && (
                <img src={set.cover_image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '0.75rem' }} />
              )}

              <p className="text-sm text-muted mb-2">{set.description}</p>
              <p className="text-sm mb-2">{set.card_count} cards</p>

              <div className="flex gap-1">
                <Link to={`/admin/card-sets/${set.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                <button className="btn btn-secondary btn-sm" onClick={() => handleTogglePublish(set)}>
                  {set.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(set)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
