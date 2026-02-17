import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requireTenantMatch } from '../middleware/requireRole.js';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

const router = Router();

// Get chat conversations for current user
router.get('/conversations', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  // Get distinct conversation partners
  const conversations = db.prepare(`
    SELECT DISTINCT
      CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as partner_id,
      MAX(created_at) as last_message_at
    FROM chat_messages
    WHERE tenant_id = ? AND (sender_id = ? OR recipient_id = ?)
    GROUP BY partner_id
    ORDER BY last_message_at DESC
  `).all(req.user.id, req.tenant.id, req.user.id, req.user.id);

  // Get partner details
  const result = conversations.map(c => {
    const partner = db.prepare('SELECT id, display_name, avatar_url, role FROM users WHERE id = ?').get(c.partner_id);
    const unread = db.prepare(
      'SELECT COUNT(*) as count FROM chat_messages WHERE tenant_id = ? AND sender_id = ? AND recipient_id = ? AND is_read = 0'
    ).get(req.tenant.id, c.partner_id, req.user.id);
    return { partner, last_message_at: c.last_message_at, unread_count: unread.count };
  });

  res.json({ conversations: result });
});

// Get messages with a specific user
router.get('/messages/:partnerId', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const messages = db.prepare(`
    SELECT cm.*, u.display_name as sender_name, u.avatar_url as sender_avatar
    FROM chat_messages cm
    JOIN users u ON cm.sender_id = u.id
    WHERE cm.tenant_id = ?
      AND ((cm.sender_id = ? AND cm.recipient_id = ?) OR (cm.sender_id = ? AND cm.recipient_id = ?))
    ORDER BY cm.created_at ASC
    LIMIT 100
  `).all(req.tenant.id, req.user.id, req.params.partnerId, req.params.partnerId, req.user.id);

  // Mark as read
  db.prepare(`
    UPDATE chat_messages SET is_read = 1
    WHERE tenant_id = ? AND sender_id = ? AND recipient_id = ? AND is_read = 0
  `).run(req.tenant.id, req.params.partnerId, req.user.id);

  res.json({ messages });
});

// Send a message
router.post('/messages', authenticate, tenantContext, requireTenantMatch, (req, res) => {
  const { recipient_id, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Message content required' });

  // If no recipient specified, send to the Oracle Card Admin
  let recipientId = recipient_id;
  if (!recipientId) {
    const admin = db.prepare(
      "SELECT id FROM users WHERE tenant_id = ? AND role = 'oracle_card_admin' LIMIT 1"
    ).get(req.tenant.id);
    if (admin) recipientId = admin.id;
  }

  if (!recipientId) return res.status(400).json({ error: 'No recipient found' });

  const id = generateId();
  db.prepare(`
    INSERT INTO chat_messages (id, tenant_id, sender_id, recipient_id, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.tenant.id, req.user.id, recipientId, content);

  const message = db.prepare(`
    SELECT cm.*, u.display_name as sender_name
    FROM chat_messages cm
    JOIN users u ON cm.sender_id = u.id
    WHERE cm.id = ?
  `).get(id);

  res.status(201).json({ message });
});

export default router;
