import { initializeDatabase } from '../config/database.js';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';
import { createTenant } from '../services/tenantService.js';

// Initialize schema
initializeDatabase();

console.log('Seeding database...');

// Create system tenant for global admins
const systemTenantId = generateId();
db.prepare(`
  INSERT OR IGNORE INTO tenants (id, name, slug, business_name, is_active)
  VALUES (?, 'System', 'system', 'Oracle App Platform', 1)
`).run(systemTenantId);

// Create App Owner Admin
const adminId = generateId();
db.prepare(`
  INSERT OR IGNORE INTO users (id, tenant_id, email, display_name, role, onboarding_completed)
  VALUES (?, ?, 'admin@oracleapp.com', 'App Owner', 'app_owner_admin', 1)
`).run(adminId, systemTenantId);

// Create a demo tenant
const demoTenant = createTenant({
  name: 'Mystic Moon Oracle',
  slug: 'mystic-moon',
  businessName: 'Mystic Moon LLC',
  ownerEmail: 'oracle@mysticmoon.com',
});

console.log('Demo tenant created:', demoTenant.slug);

// Create demo Oracle Card Admin
const oracleAdminId = generateId();
db.prepare(`
  INSERT OR IGNORE INTO users (id, tenant_id, email, display_name, role, onboarding_completed)
  VALUES (?, ?, 'oracle@mysticmoon.com', 'Luna Starweaver', 'oracle_card_admin', 1)
`).run(oracleAdminId, demoTenant.id);

// Create a demo card set
const setId = generateId();
db.prepare(`
  INSERT INTO card_sets (id, tenant_id, name, description, is_published, card_count)
  VALUES (?, ?, 'Celestial Wisdom Deck', 'A mystical oracle deck inspired by celestial bodies and cosmic wisdom.', 1, 6)
`).run(setId, demoTenant.id);

// Create demo cards
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

console.log('Demo card set created with 6 cards');
console.log('Seed complete!');
console.log('');
console.log('Default accounts:');
console.log('  App Owner Admin: admin@oracleapp.com');
console.log('  Oracle Card Admin: oracle@mysticmoon.com (tenant: mystic-moon)');
