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

export function validateQuery(schema: ZodType) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.query);
    if (!result.success) return next(new AppError(422, 'VALIDATION_ERROR', 'The query contains invalid data.', result.error.flatten()));
    request.query = result.data as Request['query'];
    next();
  };
}

export function validateParams(schema: ZodType) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.params);
    if (!result.success) return next(new AppError(422, 'VALIDATION_ERROR', 'The route parameters are invalid.', result.error.flatten()));
    request.params = result.data as Request['params'];
    next();
  };
}
