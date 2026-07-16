import type { Request, Response } from 'express';
import { leadService } from './lead.service.js';
import type { ListLeadsInput } from './lead.schemas.js';

export class LeadController {
  async list(request: Request, response: Response) {
    response.json(await leadService.list(request.query as unknown as ListLeadsInput));
  }

  async get(request: Request, response: Response) {
    response.json({ lead: await leadService.get(request.params.id!) });
  }

  async create(request: Request, response: Response) {
    response.status(201).json({ lead: await leadService.create(request.body, request.auth!.userId) });
  }

  async update(request: Request, response: Response) {
    response.json({ lead: await leadService.update(request.params.id!, request.body, request.auth!.userId) });
  }

  async archive(request: Request, response: Response) {
    response.json({ lead: await leadService.archive(request.params.id!) });
  }

  async duplicates(request: Request, response: Response) {
    response.json(await leadService.checkDuplicates(request.body));
  }

  async importCsv(request: Request, response: Response) {
    const result = await leadService.importCsv(request.body.csv, request.body.dryRun, request.body.skipDuplicates, request.auth!.userId);
    response.status(request.body.dryRun ? 200 : 201).json(result);
  }
}

export const leadController = new LeadController();
