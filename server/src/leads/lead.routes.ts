import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { leadController } from './lead.controller.js';
import { createLeadSchema, duplicateCheckSchema, importLeadsSchema, leadIdSchema, listLeadsSchema, updateLeadSchema } from './lead.schemas.js';

export const leadRouter = Router();

leadRouter.use(requireAuth);
leadRouter.get('/', validateQuery(listLeadsSchema), asyncHandler(leadController.list.bind(leadController)));
leadRouter.post('/', validateBody(createLeadSchema), asyncHandler(leadController.create.bind(leadController)));
leadRouter.post('/check-duplicates', validateBody(duplicateCheckSchema), asyncHandler(leadController.duplicates.bind(leadController)));
leadRouter.post('/import', validateBody(importLeadsSchema), asyncHandler(leadController.importCsv.bind(leadController)));
leadRouter.get('/:id', validateParams(leadIdSchema), asyncHandler(leadController.get.bind(leadController)));
leadRouter.patch('/:id', validateParams(leadIdSchema), validateBody(updateLeadSchema), asyncHandler(leadController.update.bind(leadController)));
leadRouter.delete('/:id', validateParams(leadIdSchema), asyncHandler(leadController.archive.bind(leadController)));
leadRouter.post('/:id/archive', validateParams(leadIdSchema), asyncHandler(leadController.archive.bind(leadController)));
