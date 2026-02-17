import multer from 'multer';
import { mkdirSync } from 'fs';
import { resolve, extname } from 'path';
import { generateId } from '../utils/idGenerator.js';
import env from '../config/env.js';

// Ensure upload directory exists
mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const tenantDir = resolve(env.UPLOAD_DIR, req.tenant?.id || 'global');
    mkdirSync(tenantDir, { recursive: true });
    cb(null, tenantDir);
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${generateId()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export function getFileUrl(req, filename, tenantId) {
  return `/uploads/${tenantId}/${filename}`;
}
