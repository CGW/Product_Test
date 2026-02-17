import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

export function createTenant({ name, slug, businessName, ownerEmail }) {
  const id = generateId();
  const tenantSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  db.prepare(`
    INSERT INTO tenants (id, name, slug, business_name, owner_email)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, tenantSlug, businessName || null, ownerEmail || null);

  // Create default theme
  const themeId = generateId();
  db.prepare(`
    INSERT INTO tenant_themes (id, tenant_id)
    VALUES (?, ?)
  `).run(themeId, id);

  // Create default reading templates
  const singleId = generateId();
  const threeCardId = generateId();
  db.prepare(`
    INSERT INTO reading_templates (id, tenant_id, name, description, spread_type, card_count, position_labels, is_default)
    VALUES (?, ?, 'Single Card', 'Draw a single card for guidance', 'single', 1, '["Your Card"]', 1)
  `).run(singleId, id);
  db.prepare(`
    INSERT INTO reading_templates (id, tenant_id, name, description, spread_type, card_count, position_labels, is_default)
    VALUES (?, ?, 'Three Card Spread', 'Past, Present, Future reading', 'three_card', 3, '["Past","Present","Future"]', 1)
  `).run(threeCardId, id);

  // Create default onboarding questions
  const q1Id = generateId();
  const q2Id = generateId();
  const q3Id = generateId();
  db.prepare(`
    INSERT INTO onboarding_questions (id, tenant_id, question_text, question_type, sort_order)
    VALUES (?, ?, 'What is your name?', 'text', 1)
  `).run(q1Id, id);
  db.prepare(`
    INSERT INTO onboarding_questions (id, tenant_id, question_text, question_type, options, sort_order)
    VALUES (?, ?, 'What brings you here?', 'select', '["Personal Growth","Spiritual Guidance","Curiosity","Other"]', 2)
  `).run(q2Id, id);
  db.prepare(`
    INSERT INTO onboarding_questions (id, tenant_id, question_text, question_type, options, sort_order)
    VALUES (?, ?, 'How familiar are you with oracle cards?', 'select', '["Brand New","Somewhat Familiar","Very Experienced"]', 3)
  `).run(q3Id, id);

  return getTenantById(id);
}

export function getTenantById(id) {
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
  if (tenant) {
    tenant.theme = db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(id);
  }
  return tenant;
}

export function getTenantBySlug(slug) {
  const tenant = db.prepare('SELECT * FROM tenants WHERE slug = ? AND is_active = 1').get(slug);
  if (tenant) {
    tenant.theme = db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(tenant.id);
  }
  return tenant;
}

export function listTenants() {
  return db.prepare('SELECT * FROM tenants ORDER BY created_at DESC').all();
}

export function updateTenant(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.businessName !== undefined) { fields.push('business_name = ?'); values.push(updates.businessName); }
  if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }

  if (fields.length === 0) return getTenantById(id);

  fields.push('updated_at = datetime("now")');
  values.push(id);

  db.prepare(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getTenantById(id);
}

export function updateTenantTheme(tenantId, themeUpdates) {
  const allowed = [
    'primary_color', 'secondary_color', 'background_color', 'surface_color',
    'text_color', 'accent_color', 'heading_font', 'body_font', 'logo_url',
    'about_photo_url', 'about_content', 'about_cta_text', 'about_cta_url', 'custom_css'
  ];

  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (themeUpdates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(themeUpdates[key]);
    }
  }

  if (fields.length === 0) return db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(tenantId);

  fields.push('updated_at = datetime("now")');
  values.push(tenantId);

  db.prepare(`UPDATE tenant_themes SET ${fields.join(', ')} WHERE tenant_id = ?`).run(...values);
  return db.prepare('SELECT * FROM tenant_themes WHERE tenant_id = ?').get(tenantId);
}
