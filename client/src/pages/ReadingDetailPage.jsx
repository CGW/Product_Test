import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ReadingDetailPage() {
  const { id } = useParams();
  const [reading, setReading] = useState(null);
  const [notes, setNotes] = useState('');
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    api.get(`/readings/${id}`).then(d => {
      setReading(d.reading);
      setNotes(d.reading.notes || '');
    }).catch(() => {});
  }, [id]);

  const handleFlip = (cardIndex) => {
    setFlippedCards(prev => ({ ...prev, [cardIndex]: !prev[cardIndex] }));
  };

  const handleSaveNotes = async () => {
    await api.patch(`/readings/${id}`, { notes });
  };

  if (!reading) {
    return <div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner" /></div>;
  }

  return (
    <div>
      <Link to="/readings" style={{ fontSize: '0.9rem', opacity: 0.7 }}>&larr; Back to Readings</Link>

      <div className="mb-3 mt-2">
        <div className="flex-between">
          <h1>{reading.spread_type.replace('_', ' ')} Reading</h1>
          <span className="text-sm text-muted">{new Date(reading.created_at).toLocaleString()}</span>
        </div>
        {reading.question && <p className="text-muted mt-2">"{reading.question}"</p>}
      </div>

      {/* Cards spread */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
        marginBottom: '2rem',
      }}>
        {reading.cards?.map((card, i) => (
          <div key={card.id} style={{ textAlign: 'center', maxWidth: 220 }}>
            <p className="text-sm mb-1" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {card.position_label}
            </p>

            <div
              onClick={() => handleFlip(i)}
              style={{
                cursor: 'pointer',
                perspective: '1000px',
                width: 200,
                height: 300,
                marginBottom: '0.75rem',
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s',
                transform: flippedCards[i] ? 'rotateY(180deg)' : 'rotateY(0)',
              }}>
                {/* Card back */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  borderRadius: 'var(--radius)',
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow)',
                }}>
                  <span style={{ fontSize: '3rem', opacity: 0.3 }}>&#9734;</span>
                </div>

                {/* Card front */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(card.is_reversed ? { transform: 'rotateY(180deg) rotate(180deg)' } : {}),
                }}>
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.title}
                      style={{ width: '80%', height: 'auto', maxHeight: '60%', objectFit: 'contain', borderRadius: 4, marginBottom: '0.5rem' }} />
                  ) : (
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>&#9734;</div>
                  )}
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{card.title}</h3>
                  {card.is_reversed ? (
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Reversed</span>
                  ) : null}
                </div>
              </div>
            </div>

            <p className="text-sm" style={{ fontWeight: 500 }}>{card.title}</p>
            {card.is_reversed && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Reversed</span>}
          </div>
        ))}
      </div>

      {/* Card details */}
      <div className="grid grid-2 mb-4">
        {reading.cards?.map(card => (
          <div key={card.id} className="card">
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              {card.position_label}: {card.title}
              {card.is_reversed && <span className="badge badge-warning ml-2" style={{ marginLeft: '0.5rem' }}>Reversed</span>}
            </h3>
            <p className="text-sm mb-1">{card.description}</p>
            {card.keywords && <p className="text-sm text-muted">Keywords: {card.keywords}</p>}
            <p className="text-sm mt-2">
              <strong>Meaning:</strong> {card.is_reversed ? card.reversed_meaning : card.upright_meaning}
            </p>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="card">
        <h3 className="mb-2">Your Notes</h3>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Record your thoughts and reflections about this reading..."
          rows={4} style={{ marginBottom: '0.75rem' }} />
        <button className="btn btn-secondary" onClick={handleSaveNotes}>Save Notes</button>
      </div>
    </div>
  );
}
