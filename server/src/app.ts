import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { authRouter } from './auth/auth.routes.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.routes.js';
import { leadRouter } from './leads/lead.routes.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(pinoHttp({ level: env.LOG_LEVEL, redact: ['req.headers.authorization', 'req.body.password'] }));
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: false, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '3mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/leads', leadRouter);
app.use(notFoundHandler);
app.use(errorHandler);
