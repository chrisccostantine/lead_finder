import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { prisma } from '../lib/prisma.js';
import { analyzeWebsite } from './audit-analyzer.js';
import type { ListAuditsInput } from './audit.schemas.js';
import { validatePublicUrl } from './safe-url.js';

const auditInclude = { lead: { select: { id: true, businessName: true, websiteUrl: true } } } as const;

export class AuditService {
  private schedule(id: string) {
    setImmediate(() => { void this.run(id); });
  }

  async start(leadId: string, userId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, websiteUrl: true, archivedAt: true } });
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
    if (lead.archivedAt) throw new AppError(409, 'LEAD_ARCHIVED', 'Archived leads cannot be audited.');
    if (!lead.websiteUrl) throw new AppError(422, 'WEBSITE_REQUIRED', 'Add a website URL to this lead before starting an audit.');
    try { await validatePublicUrl(lead.websiteUrl); } catch (error) { throw new AppError(422, 'UNSAFE_WEBSITE_URL', error instanceof Error ? error.message : 'This website URL cannot be audited safely.'); }
    const active = await prisma.websiteAudit.findFirst({ where: { leadId, status: { in: ['PENDING', 'RUNNING'] } }, orderBy: { createdAt: 'desc' }, include: auditInclude });
    if (active) return active;
    const audit = await prisma.websiteAudit.create({ data: { leadId, requestedById: userId, url: lead.websiteUrl }, include: auditInclude });
    this.schedule(audit.id);
    return audit;
  }

  async run(id: string) {
    const claimed = await prisma.websiteAudit.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'RUNNING', startedAt: new Date(), failureReason: null } });
    if (!claimed.count) return;
    const audit = await prisma.websiteAudit.findUnique({ where: { id }, select: { url: true } });
    if (!audit) return;
    try {
      const result = await analyzeWebsite(audit.url);
      const rawMetrics = JSON.parse(JSON.stringify(result.rawMetrics)) as Prisma.InputJsonValue;
      await prisma.websiteAudit.update({ where: { id }, data: { status: 'COMPLETED', ...result, strengths: result.strengths as Prisma.InputJsonValue, problems: result.problems as unknown as Prisma.InputJsonValue, recommendedActions: result.recommendedActions as Prisma.InputJsonValue, rawMetrics, completedAt: new Date() } });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The website audit failed unexpectedly.';
      await prisma.websiteAudit.update({ where: { id }, data: { status: 'FAILED', failureReason: reason.slice(0, 2000), completedAt: new Date() } }).catch(() => undefined);
    }
  }

  async resumeIncomplete() {
    await prisma.websiteAudit.updateMany({ where: { status: 'RUNNING' }, data: { status: 'PENDING', failureReason: 'The worker restarted; the audit was safely queued again.' } });
    const pending = await prisma.websiteAudit.findMany({ where: { status: 'PENDING' }, select: { id: true }, orderBy: { createdAt: 'asc' }, take: 1000 });
    pending.forEach(({ id }) => this.schedule(id));
  }

  async list(input: ListAuditsInput) {
    const where = { ...(input.leadId ? { leadId: input.leadId } : {}), ...(input.status ? { status: input.status } : {}) };
    const [total, data] = await prisma.$transaction([
      prisma.websiteAudit.count({ where }),
      prisma.websiteAudit.findMany({ where, include: auditInclude, orderBy: { createdAt: 'desc' }, skip: (input.page - 1) * input.pageSize, take: input.pageSize }),
    ]);
    return { data, pagination: { page: input.page, pageSize: input.pageSize, total, totalPages: Math.max(1, Math.ceil(total / input.pageSize)) } };
  }

  async get(id: string) {
    const audit = await prisma.websiteAudit.findUnique({ where: { id }, include: auditInclude });
    if (!audit) throw new AppError(404, 'AUDIT_NOT_FOUND', 'Website audit not found.');
    return audit;
  }
}

export const auditService = new AuditService();
