import type { Request, Response } from 'express';
import { leadFinderService } from './lead-finder.service.js';
export class LeadFinderController {
  providers(_request: Request, response: Response) { response.json({ providers: leadFinderService.providers() }); }
  async search(request: Request, response: Response) { response.status(201).json(await leadFinderService.search(request.body, request.auth!.userId)); }
  async job(request: Request, response: Response) { response.json({ job: await leadFinderService.getJob(request.params.id as string, request.auth!.userId) }); }
  async history(request: Request, response: Response) { response.json({ jobs: await leadFinderService.history(request.auth!.userId) }); }
  async importResults(request: Request, response: Response) { response.status(201).json(await leadFinderService.importResults(request.params.id as string, request.body.resultIds, request.auth!.userId)); }
  async templates(request: Request, response: Response) { response.json({ templates: await leadFinderService.templates(request.auth!.userId) }); }
  async saveTemplate(request: Request, response: Response) { response.status(201).json({ template: await leadFinderService.saveTemplate(request.auth!.userId, request.body) }); }
  async deleteTemplate(request: Request, response: Response) { await leadFinderService.deleteTemplate(request.params.id as string, request.auth!.userId); response.status(204).end(); }
  async usage(request: Request, response: Response) { response.json({ usage: await leadFinderService.usage(request.auth!.userId) }); }
}
export const leadFinderController = new LeadFinderController();
