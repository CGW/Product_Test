import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireRole, requireTenantMatch } from '../middleware/requireRole.js';
import * as readingService from '../services/readingService.js';
import { fireWebhook } from '../services/webhookService.js';
import { WEBHOOK_EVENTS } from '../constants/roles.js';
import db from '../config/database.js';

const router = Router();

// List reading templates for tenant
router.get('/templates', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const isAdmin = ['app_owner_admin', 'app_admin', 'oracle_card_admin'].includes(req.user.role);
  let templates;
  if (isAdmin) {
    templates = db.prepare('SELECT * FROM reading_templates WHERE tenant_id = ? ORDER BY is_default DESC, name').all(req.tenant.id);
  } else {
    templates = readingService.listReadingTemplates(req.tenant.id);
  }
  res.json({ templates });
});

// Create reading template (Oracle Card Admin+)
router.post('/templates', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res, next) => {
  try {
    const template = readingService.createReadingTemplate(req.tenant.id, req.body);
    res.status(201).json({ template });
  } catch (err) { next(err); }
});

// Update reading template
router.patch('/templates/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res, next) => {
  try {
    const template = readingService.updateReadingTemplate(req.params.id, req.tenant.id, req.body);
    res.json({ template });
  } catch (err) { next(err); }
});

// Delete reading template
router.delete('/templates/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res, next) => {
  try {
    readingService.deleteReadingTemplate(req.params.id, req.tenant.id);
    res.json({ message: 'Template deleted' });
  } catch (err) { next(err); }
});

// List user's readings
router.get('/', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const readings = readingService.getUserReadings(req.tenant.id, req.user.id);
  res.json({ readings });
});

// Create a new reading (draw cards)
router.post('/', authenticate, tenantContext, requireTenantMatch, async (req, res, next) => {
  try {
    const { card_set_id, template_id, question } = req.body;
    if (!card_set_id) return res.status(400).json({ error: 'card_set_id is required' });

    const reading = readingService.createReading({
      tenantId: req.tenant.id,
      userId: req.user.id,
      cardSetId: card_set_id,
      templateId: template_id,
      question,
    });

    // Fire webhook
    fireWebhook(req.tenant.id, WEBHOOK_EVENTS.READING_COMPLETED, {
      readingId: reading.id,
      userId: req.user.id,
      spreadType: reading.spread_type,
      cardSetId: reading.card_set_id,
    }).catch(() => {});

    res.status(201).json({ reading });
  } catch (err) { next(err); }
});

// Get reading detail
router.get('/:id', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const reading = readingService.getReadingById(req.params.id);
  if (!reading || reading.tenant_id !== req.tenant.id) {
    return res.status(404).json({ error: 'Reading not found' });
  }

  // Users can only see their own readings
  if (req.user.role === 'user' && reading.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ reading });
});

// Update reading notes
router.patch('/:id', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const reading = db.prepare('SELECT * FROM readings WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
  if (!reading) return res.status(404).json({ error: 'Reading not found' });
  if (req.user.role === 'user' && reading.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (req.body.notes !== undefined) {
    db.prepare('UPDATE readings SET notes = ? WHERE id = ?').run(req.body.notes, req.params.id);
  }

  const updated = readingService.getReadingById(req.params.id);
  res.json({ reading: updated });
});

export default router;
