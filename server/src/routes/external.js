import { Router } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import db from '../config/database.js';

const router = Router();

// All routes use API key auth
router.use(apiKeyAuth);

// List published card sets
router.get('/card-sets', (req, res) => {
  const sets = db.prepare(
    'SELECT id, name, description, cover_image_url, card_count, created_at FROM card_sets WHERE tenant_id = ? AND is_published = 1'
  ).all(req.tenant.id);
  res.json({ card_sets: sets });
});

// List users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, email, display_name, role, onboarding_completed, created_at
    FROM users WHERE tenant_id = ? AND role = 'user'
    ORDER BY created_at DESC
  `).all(req.tenant.id);
  res.json({ users });
});

// Get readings
router.get('/readings', (req, res) => {
  const readings = db.prepare(`
    SELECT r.id, r.user_id, r.card_set_id, r.spread_type, r.question, r.created_at,
           u.email as user_email, u.display_name as user_name,
           cs.name as card_set_name
    FROM readings r
    JOIN users u ON r.user_id = u.id
    JOIN card_sets cs ON r.card_set_id = cs.id
    WHERE r.tenant_id = ?
    ORDER BY r.created_at DESC
    LIMIT 100
  `).all(req.tenant.id);
  res.json({ readings });
});

// Get specific reading
router.get('/readings/:id', (req, res) => {
  const reading = db.prepare('SELECT * FROM readings WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
  if (!reading) return res.status(404).json({ error: 'Reading not found' });

  const cards = db.prepare(`
    SELECT rc.*, c.title, c.description, c.keywords
    FROM reading_cards rc
    JOIN cards c ON rc.card_id = c.id
    WHERE rc.reading_id = ?
    ORDER BY rc.position
  `).all(reading.id);

  res.json({ reading: { ...reading, cards } });
});

export default router;
