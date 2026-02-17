import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import env from '../config/env.js';
import db from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(credential) {
  // In development without Google Client ID, allow a mock flow
  if (!env.GOOGLE_CLIENT_ID || env.NODE_ENV === 'development') {
    // For dev: credential can be a JSON string with email, name, picture
    try {
      const mockData = JSON.parse(credential);
      return {
        google_id: mockData.google_id || `dev_${Date.now()}`,
        email: mockData.email,
        name: mockData.name || mockData.email.split('@')[0],
        picture: mockData.picture || null,
      };
    } catch {
      // Fall through to real Google verification
    }
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  return {
    google_id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

export function findOrCreateUser(googleData, tenantId, role = 'user') {
  // Look up by google_id first
  let user = db.prepare(
    'SELECT * FROM users WHERE google_id = ? AND tenant_id = ?'
  ).get(googleData.google_id, tenantId);

  if (user) {
    // Update avatar if changed
    if (googleData.picture && googleData.picture !== user.avatar_url) {
      db.prepare('UPDATE users SET avatar_url = ?, updated_at = datetime("now") WHERE id = ?')
        .run(googleData.picture, user.id);
    }
    return user;
  }

  // Look up by email in tenant
  user = db.prepare(
    'SELECT * FROM users WHERE email = ? AND tenant_id = ?'
  ).get(googleData.email, tenantId);

  if (user) {
    // Link google_id to existing account
    db.prepare('UPDATE users SET google_id = ?, avatar_url = ?, updated_at = datetime("now") WHERE id = ?')
      .run(googleData.google_id, googleData.picture, user.id);
    return { ...user, google_id: googleData.google_id };
  }

  // Create new user
  const id = generateId();
  db.prepare(`
    INSERT INTO users (id, tenant_id, google_id, email, display_name, avatar_url, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, tenantId, googleData.google_id, googleData.email, googleData.name, googleData.picture, role);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function signJwt(user) {
  return jwt.sign(
    {
      sub: user.id,
      tid: user.tenant_id,
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function findUserById(userId) {
  return db.prepare(
    'SELECT id, tenant_id, email, display_name, avatar_url, role, onboarding_completed, onboarding_data, is_active, created_at FROM users WHERE id = ?'
  ).get(userId);
}
