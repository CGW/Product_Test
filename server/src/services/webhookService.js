import { createHmac } from 'crypto';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

export async function fireWebhook(tenantId, eventType, payload) {
  const hooks = db.prepare(
    'SELECT * FROM webhooks WHERE tenant_id = ? AND event_type = ? AND is_active = 1'
  ).all(tenantId, eventType);

  for (const hook of hooks) {
    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      tenant_id: tenantId,
      data: payload,
    });

    const headers = { 'Content-Type': 'application/json' };
    if (hook.secret) {
      headers['X-Webhook-Signature'] = createHmac('sha256', hook.secret).update(body).digest('hex');
    }

    // Fire and forget with logging
    try {
      const response = await fetch(hook.url, { method: 'POST', headers, body });
      db.prepare(`
        INSERT INTO webhook_log (id, webhook_id, tenant_id, event_type, payload, response_status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId(), hook.id, tenantId, eventType, body, response.status);
    } catch (err) {
      db.prepare(`
        INSERT INTO webhook_log (id, webhook_id, tenant_id, event_type, payload, response_body)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId(), hook.id, tenantId, eventType, body, err.message);
    }
  }
}

export function createWebhook(tenantId, { eventType, url, secret }) {
  const id = generateId();
  db.prepare(`
    INSERT INTO webhooks (id, tenant_id, event_type, url, secret)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, tenantId, eventType, url, secret || null);
  return db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
}

export function listWebhooks(tenantId) {
  return db.prepare('SELECT * FROM webhooks WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
}

export function updateWebhook(id, tenantId, updates) {
  const fields = [];
  const values = [];
  if (updates.url !== undefined) { fields.push('url = ?'); values.push(updates.url); }
  if (updates.eventType !== undefined) { fields.push('event_type = ?'); values.push(updates.eventType); }
  if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
  if (updates.secret !== undefined) { fields.push('secret = ?'); values.push(updates.secret); }

  if (fields.length === 0) return db.prepare('SELECT * FROM webhooks WHERE id = ? AND tenant_id = ?').get(id, tenantId);

  fields.push('updated_at = datetime("now")');
  values.push(id, tenantId);
  db.prepare(`UPDATE webhooks SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`).run(...values);
  return db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
}

export function deleteWebhook(id, tenantId) {
  db.prepare('DELETE FROM webhooks WHERE id = ? AND tenant_id = ?').run(id, tenantId);
}

export function getWebhookLogs(tenantId, limit = 50) {
  return db.prepare(
    'SELECT * FROM webhook_log WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(tenantId, limit);
}
