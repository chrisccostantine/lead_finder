import type { Request, Response } from 'express';
import type { ListAuditsInput } from './audit.schemas.js';
import { auditService } from './audit.service.js';

export class AuditController {
  async list(request: Request, response: Response) { response.json(await auditService.list(request.query as unknown as ListAuditsInput)); }
  async get(request: Request, response: Response) { response.json({ audit: await auditService.get(request.params.id as string) }); }
  async start(request: Request, response: Response) { response.status(202).json({ audit: await auditService.start(request.params.leadId as string, request.auth!.userId) }); }
  async rerun(request: Request, response: Response) {
    const audit = await auditService.get(request.params.id as string);
    response.status(202).json({ audit: await auditService.start(audit.leadId, request.auth!.userId) });
  }
}

export const auditController = new AuditController();
