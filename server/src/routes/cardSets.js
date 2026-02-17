import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireRole, requireTenantMatch } from '../middleware/requireRole.js';
import { upload } from '../services/uploadService.js';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

const router = Router();

// List card sets for current tenant
router.get('/', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const isAdmin = ['app_owner_admin', 'app_admin', 'oracle_card_admin'].includes(req.user.role);
  let sets;

  if (isAdmin) {
    sets = db.prepare('SELECT * FROM card_sets WHERE tenant_id = ? ORDER BY created_at DESC').all(req.tenant.id);
  } else {
    sets = db.prepare('SELECT * FROM card_sets WHERE tenant_id = ? AND is_published = 1 ORDER BY name').all(req.tenant.id);
  }

  res.json({ card_sets: sets });
});

// Get card set with cards
router.get('/:id', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const set = db.prepare('SELECT * FROM card_sets WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
  if (!set) return res.status(404).json({ error: 'Card set not found' });

  const cards = db.prepare('SELECT * FROM cards WHERE card_set_id = ? ORDER BY position').all(set.id);
  res.json({ card_set: set, cards });
});

// Create card set (Oracle Card Admin+)
router.post('/', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = generateId();
  db.prepare(`
    INSERT INTO card_sets (id, tenant_id, name, description)
    VALUES (?, ?, ?, ?)
  `).run(id, req.tenant.id, name, description || null);

  const set = db.prepare('SELECT * FROM card_sets WHERE id = ?').get(id);
  res.status(201).json({ card_set: set });
});

// Update card set (Oracle Card Admin+)
router.patch('/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const set = db.prepare('SELECT * FROM card_sets WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
  if (!set) return res.status(404).json({ error: 'Card set not found' });

  const fields = [];
  const values = [];
  if (req.body.name !== undefined) { fields.push('name = ?'); values.push(req.body.name); }
  if (req.body.description !== undefined) { fields.push('description = ?'); values.push(req.body.description); }
  if (req.body.is_published !== undefined) { fields.push('is_published = ?'); values.push(req.body.is_published ? 1 : 0); }

  if (fields.length > 0) {
    fields.push('updated_at = datetime("now")');
    values.push(req.params.id);
    db.prepare(`UPDATE card_sets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM card_sets WHERE id = ?').get(req.params.id);
  res.json({ card_set: updated });
});

// Upload cover image for card set
router.post('/:id/cover', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'),
  upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image file required' });

    const url = `/uploads/${req.tenant.id}/${req.file.filename}`;
    db.prepare('UPDATE card_sets SET cover_image_url = ?, updated_at = datetime("now") WHERE id = ? AND tenant_id = ?')
      .run(url, req.params.id, req.tenant.id);

    res.json({ cover_image_url: url });
  }
);

// Upload back image for card set
router.post('/:id/back', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'),
  upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image file required' });

    const url = `/uploads/${req.tenant.id}/${req.file.filename}`;
    db.prepare('UPDATE card_sets SET back_image_url = ?, updated_at = datetime("now") WHERE id = ? AND tenant_id = ?')
      .run(url, req.params.id, req.tenant.id);

    res.json({ back_image_url: url });
  }
);

// Delete card set (Oracle Card Admin+)
router.delete('/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const set = db.prepare('SELECT * FROM card_sets WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
  if (!set) return res.status(404).json({ error: 'Card set not found' });

  db.prepare('DELETE FROM card_sets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Card set deleted' });
});

export default router;
