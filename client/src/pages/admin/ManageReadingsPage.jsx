import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';

export default function ManageReadingsPage() {
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', spread_type: 'custom', card_count: 3,
    position_labels: '', ai_prompt: '', is_published: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    api.get('/readings/templates').then(d => setTemplates(d.templates || [])).catch(() => {});
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const labels = form.position_labels.split(',').map(l => l.trim()).filter(Boolean);
      await api.post('/readings/templates', {
        ...form,
        position_labels: labels.length > 0 ? labels : undefined,
      });
      setShowCreate(false);
      resetForm();
      loadTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const labels = form.position_labels.split(',').map(l => l.trim()).filter(Boolean);
      await api.patch(`/readings/templates/${editingTemplate.id}`, {
        ...form,
        position_labels: labels.length > 0 ? labels : undefined,
      });
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (template) => {
    if (template.is_default) return alert('Cannot delete default templates');
    if (!confirm(`Delete "${template.name}"?`)) return;
    try {
      await api.delete(`/readings/templates/${template.id}`);
      loadTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (t) => {
    setEditingTemplate(t);
    setForm({
      name: t.name,
      description: t.description || '',
      spread_type: t.spread_type,
      card_count: t.card_count,
      position_labels: JSON.parse(t.position_labels || '[]').join(', '),
      ai_prompt: t.ai_prompt || '',
      is_published: !!t.is_published,
    });
    setShowCreate(false);
  };

  const resetForm = () => {
    setForm({ name: '', description: '', spread_type: 'custom', card_count: 3, position_labels: '', ai_prompt: '', is_published: true });
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <h1>Reading Templates</h1>
        <button className="btn btn-primary" onClick={() => { setShowCreate(!showCreate); setEditingTemplate(null); resetForm(); }}>
          {showCreate ? 'Cancel' : 'New Template'}
        </button>
      </div>

      <p className="text-muted mb-3">Define reading types with their spread layout, number of cards, and position labels.</p>

      {(showCreate || editingTemplate) && (
        <div className="card mb-3" style={{ maxWidth: 600 }}>
          <h3 className="mb-2">{editingTemplate ? 'Edit Template' : 'Create Reading Template'}</h3>
          <form onSubmit={editingTemplate ? handleUpdate : handleCreate}>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Celtic Cross" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Spread Type</label>
                <select value={form.spread_type} onChange={e => setForm({ ...form, spread_type: e.target.value })}>
                  <option value="single">Single Card</option>
                  <option value="three_card">Three Card</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="form-group">
                <label>Number of Cards</label>
                <input type="number" min="1" max="20" value={form.card_count} onChange={e => setForm({ ...form, card_count: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label>Position Labels (comma-separated)</label>
              <input type="text" value={form.position_labels} onChange={e => setForm({ ...form, position_labels: e.target.value })}
                placeholder="e.g. Past, Present, Future" />
            </div>
            <div className="form-group">
              <label>AI Prompt (optional - for agentic readings)</label>
              <textarea value={form.ai_prompt} onChange={e => setForm({ ...form, ai_prompt: e.target.value })} rows={3}
                placeholder="Describe the flow of this reading for an AI agent..." />
            </div>
            <div className="flex gap-1">
              <button type="submit" className="btn btn-primary">{editingTemplate ? 'Update' : 'Create'}</button>
              {editingTemplate && <button type="button" className="btn btn-secondary" onClick={() => { setEditingTemplate(null); resetForm(); }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-2">
        {templates.map(t => (
          <div key={t.id} className="card">
            <div className="flex-between mb-1">
              <h3 style={{ fontSize: '1rem' }}>{t.name}</h3>
              <div className="flex gap-1">
                {t.is_default && <span className="badge badge-info">Default</span>}
                <span className={`badge ${t.is_published ? 'badge-success' : 'badge-warning'}`}>
                  {t.is_published ? 'Active' : 'Draft'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted mb-1">{t.description}</p>
            <p className="text-sm mb-1">Spread: {t.spread_type} | Cards: {t.card_count}</p>
            <p className="text-sm mb-2">Labels: {JSON.parse(t.position_labels || '[]').join(', ')}</p>
            {t.ai_prompt && <p className="text-sm text-muted mb-2">AI: {t.ai_prompt.substring(0, 80)}...</p>}
            <div className="flex gap-1">
              <button className="btn btn-secondary btn-sm" onClick={() => startEdit(t)}>Edit</button>
              {!t.is_default && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
