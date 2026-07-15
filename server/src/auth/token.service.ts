import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';

interface TokenPayload { sub: string; role: Role }

export class TokenService {
  sign(userId: string, role: Role): string {
    return jwt.sign({ role }, env.JWT_SECRET, { subject: userId, expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
  }

  verify(token: string): TokenPayload {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || payload.role !== 'ADMIN') throw new Error('Invalid token payload');
    return { sub: payload.sub, role: payload.role };
  }
}

export const tokenService = new TokenService();

