import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

const DEV_KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const rawKey = process.env.API_ENCRYPTION_KEY;
  if (!rawKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_ENCRYPTION_KEY environment variable is not set. Please configure it in your Vercel Dashboard.');
    }
    console.warn('⚠️  API_ENCRYPTION_KEY not set — using INSECURE dev fallback.');
    cachedKey = crypto.createHash('sha256').update(DEV_KEY).digest();
    return cachedKey;
  }

  if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    cachedKey = Buffer.from(rawKey, 'hex');
  } else {
    cachedKey = crypto.createHash('sha256').update(rawKey).digest();
    console.warn('⚠️  API_ENCRYPTION_KEY is not a valid 64-character hex string. Derived a 32-byte key using SHA-256.');
  }
  return cachedKey;
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
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
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
