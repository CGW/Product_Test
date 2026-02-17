import app from './app.js';
import env from './config/env.js';
import { initializeDatabase } from './config/database.js';
import db from './config/database.js';
import { generateId } from './utils/idGenerator.js';
import { createTenant } from './services/tenantService.js';

// Initialize database schema
initializeDatabase();

// Auto-seed if database is empty (first run on new deploy)
const existing = db.prepare("SELECT id FROM tenants WHERE slug = 'system'").get();
if (!existing) {
  console.log('Empty database detected, seeding...');

  const systemTenantId = generateId();
  db.prepare(`
    INSERT INTO tenants (id, name, slug, business_name, is_active)
    VALUES (?, 'System', 'system', 'Oracle App Platform', 1)
  `).run(systemTenantId);

  const adminId = generateId();
  db.prepare(`
    INSERT INTO users (id, tenant_id, email, display_name, role, onboarding_completed)
    VALUES (?, ?, 'admin@oracleapp.com', 'App Owner', 'app_owner_admin', 1)
  `).run(adminId, systemTenantId);

  const demoTenant = createTenant({
    name: 'Mystic Moon Oracle',
    slug: 'mystic-moon',
    businessName: 'Mystic Moon LLC',
    ownerEmail: 'oracle@mysticmoon.com',
  });

  const oracleAdminId = generateId();
  db.prepare(`
    INSERT INTO users (id, tenant_id, email, display_name, role, onboarding_completed)
    VALUES (?, ?, 'oracle@mysticmoon.com', 'Luna Starweaver', 'oracle_card_admin', 1)
  `).run(oracleAdminId, demoTenant.id);

  const setId = generateId();
  db.prepare(`
    INSERT INTO card_sets (id, tenant_id, name, description, is_published, card_count)
    VALUES (?, ?, 'Celestial Wisdom Deck', 'A mystical oracle deck inspired by celestial bodies and cosmic wisdom.', 1, 6)
  `).run(setId, demoTenant.id);

  const demoCards = [
    { title: 'The Sun', description: 'Radiance, vitality, and joy.', keywords: 'joy,success,vitality', upright: 'Success, radiance, abundance', reversed: 'Temporary setback, dimmed enthusiasm' },
    { title: 'The Moon', description: 'Intuition, mystery, and the subconscious.', keywords: 'intuition,mystery,dreams', upright: 'Intuition, illusion, subconscious', reversed: 'Confusion, fear, misinterpretation' },
    { title: 'The Star', description: 'Hope, inspiration, and renewal.', keywords: 'hope,inspiration,healing', upright: 'Hope, faith, renewal', reversed: 'Lack of faith, discouragement' },
    { title: 'The Comet', description: 'Sudden change and transformation.', keywords: 'change,speed,awakening', upright: 'Sudden insight, rapid change', reversed: 'Chaos, unpreparedness' },
    { title: 'The Eclipse', description: 'Endings that lead to new beginnings.', keywords: 'endings,rebirth,shadow', upright: 'Transformation, release, rebirth', reversed: 'Resistance to change, stagnation' },
    { title: 'The Constellation', description: 'Connection, patterns, and destiny.', keywords: 'connection,pattern,fate', upright: 'Alignment, purpose, interconnection', reversed: 'Feeling lost, disconnection' },
  ];

  demoCards.forEach((card, i) => {
    db.prepare(`
      INSERT INTO cards (id, card_set_id, tenant_id, title, description, position, keywords, upright_meaning, reversed_meaning)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), setId, demoTenant.id, card.title, card.description, i, card.keywords, card.upright, card.reversed);
  });

  console.log('Database seeded with demo data');
}

// Start server
app.listen(env.PORT, () => {
  console.log(`Oracle App Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
