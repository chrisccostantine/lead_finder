import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { auditController } from './audit.controller.js';
import { auditIdSchema, leadAuditParamsSchema, listAuditsSchema } from './audit.schemas.js';

export const auditRouter = Router();
auditRouter.use(requireAuth);
auditRouter.get('/', validateQuery(listAuditsSchema), asyncHandler(auditController.list.bind(auditController)));
auditRouter.post('/leads/:leadId', validateParams(leadAuditParamsSchema), asyncHandler(auditController.start.bind(auditController)));
auditRouter.get('/:id', validateParams(auditIdSchema), asyncHandler(auditController.get.bind(auditController)));
auditRouter.post('/:id/rerun', validateParams(auditIdSchema), asyncHandler(auditController.rerun.bind(auditController)));
