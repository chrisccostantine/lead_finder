import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { authController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Try again later.' } } });

authRouter.get('/setup-status', asyncHandler(authController.setupStatus.bind(authController)));
authRouter.post('/register', authRateLimit, validateBody(registerSchema), asyncHandler(authController.register.bind(authController)));
authRouter.post('/login', authRateLimit, validateBody(loginSchema), asyncHandler(authController.login.bind(authController)));
authRouter.get('/me', requireAuth, asyncHandler(authController.me.bind(authController)));

