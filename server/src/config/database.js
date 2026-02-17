import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure data directory exists
mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });

const db = new Database(env.DATABASE_PATH);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

export function initializeDatabase() {
  const schemaPath = resolve(__dirname, '../db/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database initialized successfully');
}

export default db;
