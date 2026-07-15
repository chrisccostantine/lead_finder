import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error.js';

export function validateBody(schema: ZodType) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      next(new AppError(422, 'VALIDATION_ERROR', 'The request contains invalid data.', result.error.flatten()));
      return;
    }
    request.body = result.data;
    next();
  };
}

