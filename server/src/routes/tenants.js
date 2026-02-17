import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import * as tenantService from '../services/tenantService.js';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

const router = Router();

// List all tenants (App Admin+)
router.get('/', authenticate, requireRole('app_admin'), (req, res) => {
  const tenants = tenantService.listTenants();
  res.json({ tenants });
});

// Create a new tenant / Oracle_App_Instance (App Admin+)
router.post('/', authenticate, requireRole('app_admin'), (req, res, next) => {
  try {
    const { name, slug, business_name, owner_email } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const tenant = tenantService.createTenant({
      name,
      slug,
      businessName: business_name,
      ownerEmail: owner_email,
    });

    // If owner_email provided, create an Oracle_Card_Admin user for them
    if (owner_email) {
      const userId = generateId();
      db.prepare(`
        INSERT INTO users (id, tenant_id, email, display_name, role, onboarding_completed)
        VALUES (?, ?, ?, ?, 'oracle_card_admin', 1)
      `).run(userId, tenant.id, owner_email, name);
    }

    res.status(201).json({ tenant });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A tenant with this slug already exists' });
    }
    next(err);
  }
});

// Get tenant by ID (App Admin+)
router.get('/:id', authenticate, requireRole('app_admin'), (req, res) => {
  const tenant = tenantService.getTenantById(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  // Include user count
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_users,
      SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
      SUM(CASE WHEN role = 'oracle_card_admin' THEN 1 ELSE 0 END) as admin_count
    FROM users WHERE tenant_id = ?
  `).get(req.params.id);

  res.json({ tenant, stats });
});

// Update tenant (App Admin+)
router.patch('/:id', authenticate, requireRole('app_admin'), (req, res) => {
  const tenant = tenantService.updateTenant(req.params.id, {
    name: req.body.name,
    businessName: req.body.business_name,
    isActive: req.body.is_active,
  });
  res.json({ tenant });
});

// Toggle tenant active/inactive (App Admin+)
router.post('/:id/toggle-active', authenticate, requireRole('app_admin'), (req, res) => {
  const tenant = tenantService.getTenantById(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const updated = tenantService.updateTenant(req.params.id, { isActive: !tenant.is_active });
  res.json({ tenant: updated });
});

export default router;
