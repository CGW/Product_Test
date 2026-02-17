import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  DATABASE_PATH: process.env.DATABASE_PATH || resolve(__dirname, '../../data/oracle.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || resolve(__dirname, '../../uploads'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export default env;
