import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireRole, requireTenantMatch } from '../middleware/requireRole.js';
import db from '../config/database.js';

const router = Router();

// List users in current tenant (Oracle Card Admin+)
router.get('/', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const users = db.prepare(`
    SELECT id, tenant_id, email, display_name, avatar_url, role, onboarding_completed, is_active, created_at
    FROM users WHERE tenant_id = ?
    ORDER BY created_at DESC
  `).all(req.tenant.id);
  res.json({ users });
});

// Get user details
router.get('/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const user = db.prepare(`
    SELECT id, tenant_id, email, display_name, avatar_url, role, onboarding_completed, onboarding_data, is_active, created_at
    FROM users WHERE id = ? AND tenant_id = ?
  `).get(req.params.id, req.tenant.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Get reading count
  const stats = db.prepare('SELECT COUNT(*) as reading_count FROM readings WHERE user_id = ? AND tenant_id = ?')
    .get(req.params.id, req.tenant.id);

  res.json({ user, stats });
});

// Update user (toggle active, change role)
router.patch('/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const fields = [];
  const values = [];
  if (req.body.is_active !== undefined) { fields.push('is_active = ?'); values.push(req.body.is_active ? 1 : 0); }
  if (req.body.display_name !== undefined) { fields.push('display_name = ?'); values.push(req.body.display_name); }

  if (fields.length > 0) {
    fields.push(`updated_at = datetime('now')`);
    values.push(req.params.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare(
    'SELECT id, tenant_id, email, display_name, avatar_url, role, onboarding_completed, is_active, created_at FROM users WHERE id = ?'
  ).get(req.params.id);
  res.json({ user: updated });
});

export default router;
