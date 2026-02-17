import { nanoid } from 'nanoid';

export function generateId(size = 21) {
  return nanoid(size);
}
