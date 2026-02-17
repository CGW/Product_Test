import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function createReading({ tenantId, userId, cardSetId, templateId, question }) {
  // Validate card set belongs to tenant and is published
  const cardSet = db.prepare(
    'SELECT * FROM card_sets WHERE id = ? AND tenant_id = ? AND is_published = 1'
  ).get(cardSetId, tenantId);

  if (!cardSet) {
    throw Object.assign(new Error('Card set not found or not published'), { status: 404 });
  }

  // Get template
  let template;
  if (templateId) {
    template = db.prepare(
      'SELECT * FROM reading_templates WHERE id = ? AND tenant_id = ?'
    ).get(templateId, tenantId);
  }

  if (!template) {
    // Default to three card
    template = {
      spread_type: 'three_card',
      card_count: 3,
      position_labels: '["Past","Present","Future"]',
    };
  }

  const positionLabels = JSON.parse(template.position_labels);
  const drawCount = template.card_count;

  // Get all cards in set
  const cards = db.prepare(
    'SELECT * FROM cards WHERE card_set_id = ? ORDER BY position'
  ).all(cardSetId);

  if (cards.length < drawCount) {
    throw Object.assign(new Error(`Card set has only ${cards.length} cards but reading requires ${drawCount}`), { status: 400 });
  }

  // Shuffle and draw
  const shuffled = fisherYatesShuffle([...cards]);
  const drawn = shuffled.slice(0, drawCount);

  // Create reading in transaction
  const readingId = generateId();

  const insertReading = db.transaction(() => {
    db.prepare(`
      INSERT INTO readings (id, tenant_id, user_id, card_set_id, template_id, spread_type, question)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(readingId, tenantId, userId, cardSetId, templateId || null, template.spread_type, question || null);

    for (let i = 0; i < drawn.length; i++) {
      const isReversed = Math.random() < 0.5 ? 1 : 0;
      db.prepare(`
        INSERT INTO reading_cards (id, reading_id, card_id, position, is_reversed, position_label)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId(), readingId, drawn[i].id, i, isReversed, positionLabels[i] || `Position ${i + 1}`);
    }
  });

  insertReading();
  return getReadingById(readingId);
}

export function getReadingById(readingId) {
  const reading = db.prepare('SELECT * FROM readings WHERE id = ?').get(readingId);
  if (!reading) return null;

  reading.cards = db.prepare(`
    SELECT rc.*, c.title, c.description, c.image_url, c.keywords, c.upright_meaning, c.reversed_meaning
    FROM reading_cards rc
    JOIN cards c ON rc.card_id = c.id
    WHERE rc.reading_id = ?
    ORDER BY rc.position
  `).all(readingId);

  return reading;
}

export function getUserReadings(tenantId, userId) {
  const readings = db.prepare(`
    SELECT r.*, cs.name as card_set_name
    FROM readings r
    JOIN card_sets cs ON r.card_set_id = cs.id
    WHERE r.tenant_id = ? AND r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(tenantId, userId);

  return readings;
}

export function listReadingTemplates(tenantId) {
  return db.prepare(
    'SELECT * FROM reading_templates WHERE tenant_id = ? AND is_published = 1 ORDER BY is_default DESC, name'
  ).all(tenantId);
}

export function createReadingTemplate(tenantId, data) {
  const id = generateId();
  db.prepare(`
    INSERT INTO reading_templates (id, tenant_id, name, description, spread_type, card_count, position_labels, ai_prompt, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, tenantId, data.name, data.description || null,
    data.spread_type || 'custom', data.card_count || 3,
    JSON.stringify(data.position_labels || []), data.ai_prompt || null,
    data.is_published !== undefined ? (data.is_published ? 1 : 0) : 1
  );
  return db.prepare('SELECT * FROM reading_templates WHERE id = ?').get(id);
}

export function updateReadingTemplate(id, tenantId, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.spread_type !== undefined) { fields.push('spread_type = ?'); values.push(data.spread_type); }
  if (data.card_count !== undefined) { fields.push('card_count = ?'); values.push(data.card_count); }
  if (data.position_labels !== undefined) { fields.push('position_labels = ?'); values.push(JSON.stringify(data.position_labels)); }
  if (data.ai_prompt !== undefined) { fields.push('ai_prompt = ?'); values.push(data.ai_prompt); }
  if (data.is_published !== undefined) { fields.push('is_published = ?'); values.push(data.is_published ? 1 : 0); }

  if (fields.length === 0) return db.prepare('SELECT * FROM reading_templates WHERE id = ? AND tenant_id = ?').get(id, tenantId);

  fields.push('updated_at = datetime("now")');
  values.push(id, tenantId);

  db.prepare(`UPDATE reading_templates SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`).run(...values);
  return db.prepare('SELECT * FROM reading_templates WHERE id = ?').get(id);
}

export function deleteReadingTemplate(id, tenantId) {
  const template = db.prepare('SELECT * FROM reading_templates WHERE id = ? AND tenant_id = ?').get(id, tenantId);
  if (!template) throw Object.assign(new Error('Template not found'), { status: 404 });
  if (template.is_default) throw Object.assign(new Error('Cannot delete default templates'), { status: 400 });
  db.prepare('DELETE FROM reading_templates WHERE id = ? AND tenant_id = ?').run(id, tenantId);
}
