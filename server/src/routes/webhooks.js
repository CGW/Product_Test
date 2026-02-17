import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireRole, requireTenantMatch } from '../middleware/requireRole.js';
import * as webhookService from '../services/webhookService.js';
import { generateApiKey, hashApiKey } from '../utils/apiKeyGenerator.js';
import { generateId } from '../utils/idGenerator.js';
import db from '../config/database.js';
import { WEBHOOK_EVENTS } from '../constants/roles.js';

const router = Router();

// === WEBHOOKS ===

// List webhooks
router.get('/', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const webhooks = webhookService.listWebhooks(req.tenant.id);
  res.json({ webhooks });
});

// Create webhook
router.post('/', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const { event_type, url, secret } = req.body;
  if (!event_type || !url) return res.status(400).json({ error: 'event_type and url are required' });

  const validEvents = Object.values(WEBHOOK_EVENTS);
  if (!validEvents.includes(event_type)) {
    return res.status(400).json({ error: `Invalid event type. Valid types: ${validEvents.join(', ')}` });
  }

  const webhook = webhookService.createWebhook(req.tenant.id, { eventType: event_type, url, secret });
  res.status(201).json({ webhook });
});

// Update webhook
router.patch('/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const webhook = webhookService.updateWebhook(req.params.id, req.tenant.id, {
    url: req.body.url,
    eventType: req.body.event_type,
    isActive: req.body.is_active,
    secret: req.body.secret,
  });
  res.json({ webhook });
});

// Delete webhook
router.delete('/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  webhookService.deleteWebhook(req.params.id, req.tenant.id);
  res.json({ message: 'Webhook deleted' });
});

// Test webhook
router.post('/:id/test', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), async (req, res) => {
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
  if (!webhook) return res.status(404).json({ error: 'Webhook not found' });

  try {
    const body = JSON.stringify({
      event: 'test',
      timestamp: new Date().toISOString(),
      tenant_id: req.tenant.id,
      data: { message: 'This is a test webhook from your Oracle App' },
    });

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    res.json({ success: true, status: response.status });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Get webhook logs
router.get('/logs', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const logs = webhookService.getWebhookLogs(req.tenant.id);
  res.json({ logs });
});

// === API KEYS ===

// List API keys (shows prefix only)
router.get('/api-keys', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const keys = db.prepare(
    'SELECT id, tenant_id, key_prefix, label, is_active, last_used_at, created_at FROM api_keys WHERE tenant_id = ? ORDER BY created_at DESC'
  ).all(req.tenant.id);
  res.json({ api_keys: keys });
});

// Generate new API key (returns full key once)
router.post('/api-keys', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  const { label } = req.body;
  const { key, prefix, hash } = generateApiKey();
  const id = generateId();

  db.prepare(`
    INSERT INTO api_keys (id, tenant_id, key_hash, key_prefix, label)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.tenant.id, hash, prefix, label || 'Default');

  res.status(201).json({
    api_key: {
      id,
      key, // Only returned once
      key_prefix: prefix,
      label: label || 'Default',
      message: 'Save this key now. It will not be shown again.',
    },
  });
});

// Revoke API key
router.delete('/api-keys/:id', authenticate, tenantContext, requireTenantMatch, requireRole('oracle_card_admin'), (req, res) => {
  db.prepare('DELETE FROM api_keys WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenant.id);
  res.json({ message: 'API key revoked' });
});

export default router;
