import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';

export const healthRouter = Router();

healthRouter.get('/', asyncHandler(async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ status: 'ok', service: 'scalora-growth-engine-api', timestamp: new Date().toISOString() });
}));

