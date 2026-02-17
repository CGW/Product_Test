import db from '../config/database.js';

export function tenantContext(req, res, next) {
  // Resolve tenant from header, subdomain, or user's tenant
  let tenantSlug = req.headers['x-tenant-slug'];
  let tenantId = req.headers['x-tenant-id'];

  // Try subdomain
  if (!tenantSlug && !tenantId) {
    const host = req.hostname;
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost') {
      tenantSlug = parts[0];
    }
  }

  let tenant;
  if (tenantId) {
    tenant = db.prepare('SELECT * FROM tenants WHERE id = ? AND is_active = 1').get(tenantId);
  } else if (tenantSlug) {
    tenant = db.prepare('SELECT * FROM tenants WHERE slug = ? AND is_active = 1').get(tenantSlug);
  } else if (req.user?.tenant_id) {
    tenant = db.prepare('SELECT * FROM tenants WHERE id = ? AND is_active = 1').get(req.user.tenant_id);
  }

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  // Load theme
  const theme = db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(tenant.id);
  req.tenant = { ...tenant, theme };
  next();
}

export function optionalTenantContext(req, res, next) {
  let tenantSlug = req.headers['x-tenant-slug'];
  let tenantId = req.headers['x-tenant-id'];

  if (!tenantSlug && !tenantId) {
    const host = req.hostname;
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost') {
      tenantSlug = parts[0];
    }
  }

  let tenant;
  if (tenantId) {
    tenant = db.prepare('SELECT * FROM tenants WHERE id = ? AND is_active = 1').get(tenantId);
  } else if (tenantSlug) {
    tenant = db.prepare('SELECT * FROM tenants WHERE slug = ? AND is_active = 1').get(tenantSlug);
  }

  if (tenant) {
    const theme = db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(tenant.id);
    req.tenant = { ...tenant, theme };
  }

  next();
}
