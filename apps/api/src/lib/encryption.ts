import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

// Standard 32-byte key fallback for local development
const DEV_KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const KEY_HEX = process.env.API_ENCRYPTION_KEY || DEV_KEY;

if (!process.env.API_ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: API_ENCRYPTION_KEY environment variable is not defined in production!');
}

const KEY = Buffer.from(KEY_HEX, 'hex');

if (KEY.length !== 32) {
  throw new Error('CRITICAL: API_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)!');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${tag}`;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  const [ivHex, encryptedHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
