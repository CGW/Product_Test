import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireTenantMatch } from '../middleware/requireRole.js';
import { fireWebhook } from '../services/webhookService.js';
import { WEBHOOK_EVENTS } from '../constants/roles.js';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

const router = Router();

// Get onboarding questions for tenant
router.get('/questions', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const questions = db.prepare(
    'SELECT * FROM onboarding_questions WHERE tenant_id = ? ORDER BY sort_order'
  ).all(req.tenant.id);
  res.json({ questions });
});

// Get user's onboarding status
router.get('/status', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const user = db.prepare('SELECT onboarding_completed, onboarding_data FROM users WHERE id = ?').get(req.user.id);
  const responses = db.prepare(`
    SELECT oq.question_text, oq.question_type, orsp.answer
    FROM onboarding_responses orsp
    JOIN onboarding_questions oq ON orsp.question_id = oq.id
    WHERE orsp.user_id = ? AND orsp.tenant_id = ?
    ORDER BY oq.sort_order
  `).all(req.user.id, req.tenant.id);

  res.json({
    completed: !!user.onboarding_completed,
    data: JSON.parse(user.onboarding_data || '{}'),
    responses,
  });
});

// Submit onboarding answers
router.post('/submit', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers array required' });
  }

  const submit = db.transaction(() => {
    for (const { question_id, answer } of answers) {
      // Check if response already exists
      const existing = db.prepare(
        'SELECT id FROM onboarding_responses WHERE user_id = ? AND question_id = ?'
      ).get(req.user.id, question_id);

      if (existing) {
        db.prepare('UPDATE onboarding_responses SET answer = ? WHERE id = ?').run(answer, existing.id);
      } else {
        db.prepare(`
          INSERT INTO onboarding_responses (id, tenant_id, user_id, question_id, answer)
          VALUES (?, ?, ?, ?, ?)
        `).run(generateId(), req.tenant.id, req.user.id, question_id, answer);
      }
    }

    // Mark onboarding complete
    db.prepare(`UPDATE users SET onboarding_completed = 1, onboarding_data = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(JSON.stringify({ completed_at: new Date().toISOString() }), req.user.id);
  });

  submit();

  // Fire webhook
  fireWebhook(req.tenant.id, WEBHOOK_EVENTS.ONBOARDING_COMPLETED, {
    userId: req.user.id,
    email: req.user.email,
  }).catch(() => {});

  res.json({ message: 'Onboarding completed', completed: true });
});

export default router;
