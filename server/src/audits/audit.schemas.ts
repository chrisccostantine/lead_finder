import { z } from 'zod';

export const auditIdSchema = z.object({ id: z.string().uuid() }).strict();
export const leadAuditParamsSchema = z.object({ leadId: z.string().uuid() }).strict();
export const listAuditsSchema = z.object({
  leadId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export type ListAuditsInput = z.infer<typeof listAuditsSchema>;
