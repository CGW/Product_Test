import { ROLE_LEVELS } from '../constants/roles.js';

export function requireRole(minimumRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const requiredLevel = ROLE_LEVELS[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireTenantMatch(req, res, next) {
  if (!req.user || !req.tenant) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // App owner and app admins can access any tenant
  if (ROLE_LEVELS[req.user.role] >= ROLE_LEVELS['app_admin']) {
    return next();
  }

  // Oracle card admins and users must match their tenant
  if (req.user.tenant_id !== req.tenant.id) {
    return res.status(403).json({ error: 'Access denied to this tenant' });
  }

  next();
}
