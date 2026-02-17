import { randomBytes, createHash } from 'crypto';

export function generateApiKey() {
  const key = `oak_${randomBytes(32).toString('hex')}`;
  const prefix = key.substring(0, 12);
  const hash = hashApiKey(key);
  return { key, prefix, hash };
}

export function hashApiKey(key) {
  return createHash('sha256').update(key).digest('hex');
}
