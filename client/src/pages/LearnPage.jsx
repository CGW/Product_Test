import { useState, useEffect } from 'react';
import { api } from '../api/client.js';

export default function LearnPage() {
  const [cardSets, setCardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    api.get('/card-sets').then(d => setCardSets(d.card_sets || [])).catch(() => {});
  }, []);

  const handleSelectSet = async (set) => {
    setSelectedSet(set);
    setSelectedCard(null);
    try {
      const data = await api.get(`/card-sets/${set.id}`);
      setCards(data.cards || []);
    } catch {
      setCards([]);
    }
  };

  return (
    <div>
      <h1 className="mb-3">Learn</h1>

      {!selectedSet ? (
        <>
          <p className="text-muted mb-3">Explore the oracle card sets and learn about each card's meaning.</p>
          <div className="grid grid-2">
            {cardSets.map(set => (
              <button key={set.id} className="card" onClick={() => handleSelectSet(set)}
                style={{ textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%' }}>
                {set.cover_image_url && (
                  <img src={set.cover_image_url} alt={set.name}
                    style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '0.75rem' }} />
                )}
                <h3>{set.name}</h3>
                <p className="text-sm text-muted">{set.description}</p>
                <p className="text-sm mt-2">{set.card_count} cards</p>
              </button>
            ))}
          </div>
          {cardSets.length === 0 && (
            <div className="empty-state">
              <h3>No card sets available yet</h3>
              <p className="text-muted">Check back soon!</p>
            </div>
          )}
        </>
      ) : !selectedCard ? (
        <>
          <button className="btn btn-secondary mb-3" onClick={() => { setSelectedSet(null); setCards([]); }}>
            &larr; Back to Sets
          </button>
          <h2 className="mb-1">{selectedSet.name}</h2>
          <p className="text-muted mb-3">{selectedSet.description}</p>

          <div className="grid grid-3">
            {cards.map(card => (
              <button key={card.id} className="card" onClick={() => setSelectedCard(card)}
                style={{ textAlign: 'center', cursor: 'pointer', border: 'none', padding: '1.5rem' }}>
                {card.image_url ? (
                  <img src={card.image_url} alt={card.title}
                    style={{ width: '100%', height: 180, objectFit: 'contain', borderRadius: 4, marginBottom: '0.75rem' }} />
                ) : (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    &#9734;
                  </div>
                )}
                <h3 style={{ fontSize: '1rem' }}>{card.title}</h3>
                {card.keywords && <p className="text-sm text-muted">{card.keywords}</p>}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="btn btn-secondary mb-3" onClick={() => setSelectedCard(null)}>
            &larr; Back to Cards
          </button>

          <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {selectedCard.image_url ? (
                <img src={selectedCard.image_url} alt={selectedCard.title}
                  style={{ maxHeight: 300, borderRadius: 'var(--radius)' }} />
              ) : (
                <div style={{ fontSize: '4rem', color: 'var(--color-primary)' }}>&#9734;</div>
              )}
            </div>

            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{selectedCard.title}</h2>
            {selectedCard.keywords && (
              <p className="text-center text-muted mb-3">{selectedCard.keywords}</p>
            )}

            <p className="mb-3">{selectedCard.description}</p>

            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(107, 70, 193, 0.1)', borderRadius: 'var(--radius)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Upright</h4>
                <p className="text-sm">{selectedCard.upright_meaning || 'No meaning provided'}</p>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(214, 158, 46, 0.1)', borderRadius: 'var(--radius)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>Reversed</h4>
                <p className="text-sm">{selectedCard.reversed_meaning || 'No meaning provided'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
