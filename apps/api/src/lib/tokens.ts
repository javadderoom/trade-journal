import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  plan: string;
  role: string;
}

const DEV_SECRET = 'dev-only-insecure-jwt-secret-do-not-use-in-production';

function getSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_ACCESS_SECRET environment variable is not set. Please configure it in your Vercel Dashboard.');
    }
    return DEV_SECRET;
  }
  return secret;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });
};

export const generateRefreshToken = (): string => {
  // Opaque random token — stored in DB, not JWT
  return crypto.randomBytes(64).toString('hex');
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getSecret()) as AccessTokenPayload;
};
