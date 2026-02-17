import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireRole, requireTenantMatch } from '../middleware/requireRole.js';
import { upload } from '../services/uploadService.js';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

const router = Router();

// Add card to set
router.post('/:setId/cards', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const set = db.prepare('SELECT * FROM card_sets WHERE id = ? AND tenant_id = ?').get(req.params.setId, req.tenant.id);
  if (!set) return res.status(404).json({ error: 'Card set not found' });

  const { title, description, keywords, upright_meaning, reversed_meaning } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  // Get next position
  const maxPos = db.prepare('SELECT MAX(position) as max FROM cards WHERE card_set_id = ?').get(req.params.setId);
  const position = (maxPos?.max ?? -1) + 1;

  const id = generateId();
  db.prepare(`
    INSERT INTO cards (id, card_set_id, tenant_id, title, description, position, keywords, upright_meaning, reversed_meaning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.setId, req.tenant.id, title, description || null, position,
    keywords || null, upright_meaning || null, reversed_meaning || null);

  // Update card count
  db.prepare(`UPDATE card_sets SET card_count = card_count + 1, updated_at = datetime('now') WHERE id = ?`).run(req.params.setId);

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(201).json({ card });
});

// Update card
router.patch('/:setId/cards/:cardId', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND card_set_id = ? AND tenant_id = ?')
    .get(req.params.cardId, req.params.setId, req.tenant.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const fields = [];
  const values = [];
  const allowed = ['title', 'description', 'keywords', 'upright_meaning', 'reversed_meaning', 'position'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (fields.length > 0) {
    fields.push(`updated_at = datetime('now')`);
    values.push(req.params.cardId);
    db.prepare(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.cardId);
  res.json({ card: updated });
});

// Upload card image
router.post('/:setId/cards/:cardId/image', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'),
  upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image file required' });

    const url = `/uploads/${req.tenant.id}/${req.file.filename}`;
    db.prepare(`UPDATE cards SET image_url = ?, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`)
      .run(url, req.params.cardId, req.tenant.id);

    res.json({ image_url: url });
  }
);

// Reorder cards in set
router.patch('/:setId/cards-reorder', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const { card_ids } = req.body;
  if (!Array.isArray(card_ids)) return res.status(400).json({ error: 'card_ids array required' });

  const reorder = db.transaction(() => {
    for (let i = 0; i < card_ids.length; i++) {
      db.prepare('UPDATE cards SET position = ? WHERE id = ? AND card_set_id = ? AND tenant_id = ?')
        .run(i, card_ids[i], req.params.setId, req.tenant.id);
    }
  });
  reorder();

  const cards = db.prepare('SELECT * FROM cards WHERE card_set_id = ? ORDER BY position').all(req.params.setId);
  res.json({ cards });
});

// Delete card
router.delete('/:setId/cards/:cardId', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND card_set_id = ? AND tenant_id = ?')
    .get(req.params.cardId, req.params.setId, req.tenant.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.cardId);
  db.prepare(`UPDATE card_sets SET card_count = card_count - 1, updated_at = datetime('now') WHERE id = ?`).run(req.params.setId);

  res.json({ message: 'Card deleted' });
});

export default router;
