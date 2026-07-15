import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${request.method} ${request.path} was not found.`));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  request.log.error({ err: error }, 'Request failed');

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
    return;
  }
  if (error instanceof ZodError) {
    response.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'The request contains invalid data.', details: error.flatten() } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({ error: { code: 'CONFLICT', message: 'A record with this value already exists.' } });
    return;
  }

  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', ...(env.NODE_ENV !== 'production' && error instanceof Error ? { details: error.message } : {}) } });
};

