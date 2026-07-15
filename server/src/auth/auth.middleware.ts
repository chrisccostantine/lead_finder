import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { tokenService } from './token.service.js';

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'UNAUTHORIZED', 'A valid bearer token is required.'));
  try {
    const payload = tokenService.verify(token);
    request.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'The access token is invalid or expired.'));
  }
}

