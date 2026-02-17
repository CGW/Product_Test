import { Router } from 'express';
import { verifyGoogleToken, findOrCreateUser, signJwt, findUserById } from '../services/authService.js';
import { fireWebhook } from '../services/webhookService.js';
import { authenticate } from '../middleware/auth.js';
import { optionalTenantContext } from '../middleware/tenantContext.js';
import db from '../config/database.js';
import { WEBHOOK_EVENTS } from '../constants/roles.js';

const router = Router();

// Google OAuth login
router.post('/google', optionalTenantContext, async (req, res, next) => {
  try {
    const { credential, tenantSlug } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify Google token
    const googleData = await verifyGoogleToken(credential);

    // Resolve tenant
    let tenant = req.tenant;
    if (!tenant && tenantSlug) {
      tenant = db.prepare('SELECT * FROM tenants WHERE slug = ? AND is_active = 1').get(tenantSlug);
    }

    // Check if this is a global admin login (no tenant needed)
    const existingGlobalAdmin = db.prepare(
      "SELECT * FROM users WHERE google_id = ? AND role IN ('app_owner_admin', 'app_admin')"
    ).get(googleData.google_id);

    if (existingGlobalAdmin) {
      const token = signJwt(existingGlobalAdmin);
      return res.json({
        token,
        user: {
          id: existingGlobalAdmin.id,
          email: existingGlobalAdmin.email,
          display_name: existingGlobalAdmin.display_name,
          avatar_url: existingGlobalAdmin.avatar_url,
          role: existingGlobalAdmin.role,
          tenant_id: existingGlobalAdmin.tenant_id,
          onboarding_completed: existingGlobalAdmin.onboarding_completed,
        },
      });
    }

    // For Oracle Card Admin login - check if email is designated as admin for this tenant
    if (tenant) {
      const isDesignatedAdmin = tenant.owner_email === googleData.email;
      const existingUser = db.prepare(
        'SELECT * FROM users WHERE email = ? AND tenant_id = ?'
      ).get(googleData.email, tenant.id);

      let role = 'user';
      if (isDesignatedAdmin || (existingUser && existingUser.role === 'oracle_card_admin')) {
        role = 'oracle_card_admin';
      } else if (existingUser) {
        role = existingUser.role;
      }

      const user = findOrCreateUser(googleData, tenant.id, role);
      const isNewUser = !existingUser;
      const token = signJwt(user);

      // Fire webhook for new user registration
      if (isNewUser) {
        fireWebhook(tenant.id, WEBHOOK_EVENTS.USER_REGISTERED, {
          userId: user.id,
          email: user.email,
          displayName: user.display_name,
        }).catch(() => {});
      }

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          role: user.role,
          tenant_id: user.tenant_id,
          onboarding_completed: user.onboarding_completed,
        },
      });
    }

    return res.status(400).json({ error: 'Tenant context required for login' });
  } catch (err) {
    next(err);
  }
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Update current user profile
router.patch('/me', authenticate, (req, res) => {
  const { display_name } = req.body;
  if (display_name) {
    db.prepare('UPDATE users SET display_name = ?, updated_at = datetime("now") WHERE id = ?')
      .run(display_name, req.user.id);
  }
  const user = findUserById(req.user.id);
  res.json({ user });
});

export default router;
