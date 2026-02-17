import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import db from '../config/database.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = db.prepare(
      'SELECT id, tenant_id, email, display_name, avatar_url, role, onboarding_completed, is_active FROM users WHERE id = ?'
    ).get(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = db.prepare(
      'SELECT id, tenant_id, email, display_name, avatar_url, role, onboarding_completed, is_active FROM users WHERE id = ?'
    ).get(payload.sub);
    if (user && user.is_active) {
      req.user = user;
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}
