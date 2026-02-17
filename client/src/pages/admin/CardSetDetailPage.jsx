import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function CardSetDetailPage() {
  const { id } = useParams();
  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm, setCardForm] = useState({ title: '', description: '', keywords: '', upright_meaning: '', reversed_meaning: '' });

  useEffect(() => {
    loadSet();
  }, [id]);

  const loadSet = async () => {
    const data = await api.get(`/card-sets/${id}`);
    setSet(data.card_set);
    setCards(data.cards || []);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/card-sets/${id}/cards`, cardForm);
      setCardForm({ title: '', description: '', keywords: '', upright_meaning: '', reversed_meaning: '' });
      setShowAddCard(false);
      loadSet();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/card-sets/${id}/cards/${editingCard.id}`, cardForm);
      setEditingCard(null);
      setCardForm({ title: '', description: '', keywords: '', upright_meaning: '', reversed_meaning: '' });
      loadSet();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Delete this card?')) return;
    await api.delete(`/card-sets/${id}/cards/${cardId}`);
    loadSet();
  };

  const handleUploadCardImage = async (cardId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    await api.upload(`/card-sets/${id}/cards/${cardId}/image`, formData);
    loadSet();
  };

  const handleUploadCover = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    await api.upload(`/card-sets/${id}/cover`, formData);
    loadSet();
  };

  const handleUploadBack = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    await api.upload(`/card-sets/${id}/back`, formData);
    loadSet();
  };

  const startEdit = (card) => {
    setEditingCard(card);
    setCardForm({
      title: card.title,
      description: card.description || '',
      keywords: card.keywords || '',
      upright_meaning: card.upright_meaning || '',
      reversed_meaning: card.reversed_meaning || '',
    });
    setShowAddCard(false);
  };

  if (!set) return <div className="flex-center"><div className="spinner" /></div>;

  return (
    <div>
      <Link to="/admin/card-sets" style={{ fontSize: '0.9rem', opacity: 0.7 }}>&larr; Back to Card Sets</Link>

      <div className="flex-between mt-2 mb-3">
        <div>
          <h1>{set.name}</h1>
          <p className="text-muted">{set.description}</p>
        </div>
        <span className={`badge ${set.is_published ? 'badge-success' : 'badge-warning'}`}>
          {set.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Cover & Back images */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div>
          <p className="text-sm mb-1" style={{ fontWeight: 500 }}>Cover Image</p>
          {set.cover_image_url ? (
            <img src={set.cover_image_url} alt="Cover" style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 'var(--radius)' }} />
          ) : (
            <div style={{ width: 150, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', opacity: 0.5 }}>No cover</div>
          )}
          <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleUploadCover(e.target.files[0])} style={{ marginTop: '0.5rem', width: 150, fontSize: '0.8rem' }} />
        </div>
        <div>
          <p className="text-sm mb-1" style={{ fontWeight: 500 }}>Back of Card</p>
          {set.back_image_url ? (
            <img src={set.back_image_url} alt="Back" style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 'var(--radius)' }} />
          ) : (
            <div style={{ width: 150, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', opacity: 0.5 }}>No back</div>
          )}
          <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleUploadBack(e.target.files[0])} style={{ marginTop: '0.5rem', width: 150, fontSize: '0.8rem' }} />
        </div>
      </div>

      {/* Add/Edit Card Form */}
      <div className="flex-between mb-2">
        <h2>Cards ({cards.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => {
          setShowAddCard(!showAddCard);
          setEditingCard(null);
          setCardForm({ title: '', description: '', keywords: '', upright_meaning: '', reversed_meaning: '' });
        }}>
          {showAddCard ? 'Cancel' : 'Add Card'}
        </button>
      </div>

      {(showAddCard || editingCard) && (
        <div className="card mb-3">
          <h3 className="mb-2">{editingCard ? `Edit: ${editingCard.title}` : 'New Card'}</h3>
          <form onSubmit={editingCard ? handleUpdateCard : handleAddCard}>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" value={cardForm.title} onChange={e => setCardForm({ ...cardForm, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={cardForm.description} onChange={e => setCardForm({ ...cardForm, description: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>Keywords (comma-separated)</label>
              <input type="text" value={cardForm.keywords} onChange={e => setCardForm({ ...cardForm, keywords: e.target.value })} placeholder="e.g. hope, renewal, faith" />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Upright Meaning</label>
                <textarea value={cardForm.upright_meaning} onChange={e => setCardForm({ ...cardForm, upright_meaning: e.target.value })} rows={2} />
              </div>
              <div className="form-group">
                <label>Reversed Meaning</label>
                <textarea value={cardForm.reversed_meaning} onChange={e => setCardForm({ ...cardForm, reversed_meaning: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex gap-1">
              <button type="submit" className="btn btn-primary">{editingCard ? 'Update Card' : 'Add Card'}</button>
              {editingCard && <button type="button" className="btn btn-secondary" onClick={() => { setEditingCard(null); setCardForm({ title: '', description: '', keywords: '', upright_meaning: '', reversed_meaning: '' }); }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="card empty-state">
          <h3>No cards yet</h3>
          <p className="text-muted">Add your first oracle card above</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {cards.map(card => (
            <div key={card.id} className="card" style={{ textAlign: 'center' }}>
              {card.image_url ? (
                <img src={card.image_url} alt={card.title} style={{ width: '100%', height: 150, objectFit: 'contain', borderRadius: 4, marginBottom: '0.5rem' }} />
              ) : (
                <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>&#9734;</div>
              )}
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{card.title}</h3>
              <p className="text-sm text-muted mb-2">{card.description?.substring(0, 60)}</p>

              <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleUploadCardImage(card.id, e.target.files[0])}
                style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }} />

              <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => startEdit(card)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCard(card.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
