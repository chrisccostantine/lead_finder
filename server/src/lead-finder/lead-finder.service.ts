import type { Prisma, SearchProvider } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { leadService } from '../leads/lead.service.js';
import { prisma } from '../lib/prisma.js';
import { getProvider, providerMetadata } from './provider.registry.js';
import type { ProviderLead } from './provider.types.js';
import type { SearchInput } from './lead-finder.schemas.js';

interface ReviewedResult extends ProviderLead { existingLeadId?: string; duplicateReasons: string[] }

export class LeadFinderService {
  providers() { return providerMetadata(); }

  async search(input: SearchInput, userId: string) {
    const metadata = providerMetadata().find((item) => item.id === input.provider);
    if (!metadata?.available) throw new AppError(503, 'PROVIDER_UNAVAILABLE', `${metadata?.name ?? input.provider} is not configured.`);
    const { provider, ...criteria } = input;
    const job = await prisma.searchJob.create({ data: { userId, provider, criteria: criteria as Prisma.InputJsonValue, status: 'QUEUED' } });
    await prisma.searchJob.update({ where: { id: job.id }, data: { status: 'RUNNING', startedAt: new Date() } });
    try {
      const output = await getProvider(provider).searchBusinesses(criteria);
      const reviewed: ReviewedResult[] = [];
      for (const result of output.results) {
        const { duplicates } = await leadService.checkDuplicates({ businessName: result.businessName, websiteUrl: result.websiteUrl ?? null, email: result.email ?? null, phone: result.phone ?? null });
        reviewed.push({ ...result, existingLeadId: duplicates[0]?.id, duplicateReasons: duplicates[0]?.reasons ?? [] });
      }
      const duplicateResults = reviewed.filter((result) => result.existingLeadId).length;
      const completed = await prisma.searchJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', results: reviewed as unknown as Prisma.InputJsonValue, totalResults: reviewed.length, duplicateResults, completedAt: new Date() } });
      await prisma.apiUsageLog.create({ data: { userId, provider, endpoint: provider === 'GOOGLE_PLACES' ? 'places:searchText' : 'mock:search', requestCount: output.requestCount, resultCount: reviewed.length, success: true } });
      return { job: { ...completed, results: reviewed }, warnings: output.warnings };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Provider search failed.';
      await Promise.all([prisma.searchJob.update({ where: { id: job.id }, data: { status: 'FAILED', errorDetails: message, completedAt: new Date() } }), prisma.apiUsageLog.create({ data: { userId, provider, endpoint: provider === 'GOOGLE_PLACES' ? 'places:searchText' : 'mock:search', success: false } })]);
      throw new AppError(502, 'PROVIDER_ERROR', message);
    }
  }

  async getJob(id: string, userId: string) {
    const job = await prisma.searchJob.findFirst({ where: { id, userId } });
    if (!job) throw new AppError(404, 'SEARCH_JOB_NOT_FOUND', 'Search job not found.');
    return job;
  }

  async history(userId: string) { return prisma.searchJob.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 25, select: { id: true, provider: true, criteria: true, status: true, totalResults: true, importedResults: true, duplicateResults: true, errorDetails: true, createdAt: true, completedAt: true } }); }

  async importResults(id: string, resultIds: string[], userId: string) {
    const job = await this.getJob(id, userId); const results = job.results as unknown as ReviewedResult[];
    const selected = results.filter((result) => resultIds.includes(result.resultId));
    if (!selected.length) throw new AppError(422, 'NO_RESULTS_SELECTED', 'No matching search results were selected.');
    let imported = 0; let duplicates = 0;
    for (const result of selected) {
      if (result.existingLeadId) { duplicates += 1; continue; }
      try {
        await leadService.create({ businessName: result.businessName, industry: result.businessTypes[0] ?? null, websiteUrl: result.websiteUrl ?? null, email: result.email ?? null, phone: result.phone ?? null, country: result.country ?? null, city: result.city ?? null, address: result.address ?? null, googleMapsUrl: result.googleMapsUrl ?? null, source: job.provider, sourceReference: result.providerReference, description: null, instagramUrl: null, facebookUrl: null, linkedinUrl: null, status: 'NEW', priority: 'MEDIUM', notes: null, contacts: [], allowDuplicate: false }, userId);
        imported += 1;
      } catch (error) {
        if (error instanceof AppError && error.code === 'DUPLICATE_LEAD') duplicates += 1; else throw error;
      }
    }
    await prisma.searchJob.update({ where: { id }, data: { importedResults: { increment: imported }, duplicateResults: { increment: duplicates } } });
    return { selected: selected.length, imported, duplicates };
  }

  async templates(userId: string) { return prisma.savedSearchTemplate.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }); }
  async saveTemplate(userId: string, input: { name: string; provider: SearchProvider; criteria: Prisma.InputJsonValue }) { return prisma.savedSearchTemplate.upsert({ where: { userId_name: { userId, name: input.name } }, create: { userId, ...input }, update: { provider: input.provider, criteria: input.criteria } }); }
  async deleteTemplate(id: string, userId: string) { const result = await prisma.savedSearchTemplate.deleteMany({ where: { id, userId } }); if (!result.count) throw new AppError(404, 'TEMPLATE_NOT_FOUND', 'Template not found.'); }
  async usage(userId: string) { const rows = await prisma.apiUsageLog.groupBy({ by: ['provider'], where: { userId }, _sum: { requestCount: true, resultCount: true }, _count: { _all: true } }); return rows.map((row) => ({ provider: row.provider, calls: row._sum.requestCount ?? 0, results: row._sum.resultCount ?? 0, events: row._count._all })); }
}
export const leadFinderService = new LeadFinderService();
