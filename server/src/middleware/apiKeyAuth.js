import db from '../config/database.js';
import { hashApiKey } from '../utils/apiKeyGenerator.js';

export function apiKeyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'API key required' });
  }

  const key = authHeader.slice(7);
  const keyHash = hashApiKey(key);

  const apiKey = db.prepare(`
    SELECT ak.*, t.id as t_id, t.slug as t_slug, t.name as t_name, t.is_active as t_active
    FROM api_keys ak
    JOIN tenants t ON ak.tenant_id = t.id
    WHERE ak.key_hash = ? AND ak.is_active = 1
  `).get(keyHash);

  if (!apiKey || !apiKey.t_active) {
    return res.status(401).json({ error: 'Invalid or inactive API key' });
  }

  // Update last used
  db.prepare('UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?').run(apiKey.id);

  req.tenant = { id: apiKey.tenant_id, slug: apiKey.t_slug, name: apiKey.t_name };
  req.apiKey = apiKey;
  next();
}
