import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

// Standard 32-byte key fallback for local development
const DEV_KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const rawKey = process.env.API_ENCRYPTION_KEY || DEV_KEY;

if (!process.env.API_ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: API_ENCRYPTION_KEY environment variable is not defined in production! Falling back to default development key.');
}

let KEY: Buffer;
if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
  KEY = Buffer.from(rawKey, 'hex');
} else {
  // Securely hash the input key using SHA-256 to guarantee a valid 32-byte buffer
  KEY = crypto.createHash('sha256').update(rawKey).digest();
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: API_ENCRYPTION_KEY is not a valid 64-character hex string. Derived a 32-byte key using SHA-256.');
  }
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
