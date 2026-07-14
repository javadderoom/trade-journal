import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  plan: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_ACCESS_SECRET environment variable is not set. Refusing to start in production.');
  }
  console.warn('⚠️  JWT_ACCESS_SECRET not set — using INSECURE dev fallback. Do NOT use in production.');
}

const DEV_SECRET = 'dev-only-insecure-jwt-secret-do-not-use-in-production';
const SECRET = JWT_SECRET || DEV_SECRET;

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, SECRET, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });
};

export const generateRefreshToken = (): string => {
  // Opaque random token — stored in DB, not JWT
  return crypto.randomBytes(64).toString('hex');
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, SECRET) as AccessTokenPayload;
};
