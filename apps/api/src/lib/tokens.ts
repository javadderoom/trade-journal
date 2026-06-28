import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  plan: string;
  role: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'default_jwt_secret_key_for_development_purposes_only', {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });
};

export const generateRefreshToken = (): string => {
  // Opaque random token — stored in DB, not JWT
  return crypto.randomBytes(64).toString('hex');
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'default_jwt_secret_key_for_development_purposes_only') as AccessTokenPayload;
};
