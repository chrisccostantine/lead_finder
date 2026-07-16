import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { prisma } from '../lib/prisma.js';
import { recordsFromCsv } from './csv.js';
import { duplicateKeys, matchingReasons, type DuplicateKeys } from './duplicate-detection.js';
import { createLeadSchema, type CreateLeadInput, type DuplicateCheckInput, type ListLeadsInput, type UpdateLeadInput } from './lead.schemas.js';

type DatabaseClient = Prisma.TransactionClient;

function publicLead<T extends object>(lead: T) {
  const { businessNameKey: _businessNameKey, websiteKey: _websiteKey, emailKey: _emailKey, phoneKey: _phoneKey, ...result } = lead as T & DuplicateKeys;
  return result;
}

function prepareContacts(contacts: CreateLeadInput['contacts']) {
  return contacts.map((contact, index) => ({
    name: contact.name,
    jobTitle: contact.jobTitle,
    email: contact.email,
    phone: contact.phone,
    notes: contact.notes,
    isPrimary: contacts.some((item) => item.isPrimary) ? contact.isPrimary : index === 0,
  }));
}

function createData(input: CreateLeadInput) {
  const { contacts: _contacts, allowDuplicate: _allowDuplicate, ...fields } = input;
  return { ...fields, ...duplicateKeys(input) };
}

function csvRecord(record: Record<string, string>) {
  const normalized = new Map(Object.entries(record).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ''), value]));
  const get = (key: string) => normalized.get(key.toLowerCase()) || undefined;
  const enumValue = (key: string) => get(key)?.trim().toUpperCase().replace(/[ -]+/g, '_');
  return {
    businessName: get('businessname'),
    industry: get('industry'),
    description: get('description'),
    websiteUrl: get('websiteurl') ?? get('website'),
    email: get('email'),
    phone: get('phone'),
    country: get('country'),
    city: get('city'),
    address: get('address'),
    googleMapsUrl: get('googlemapsurl'),
    instagramUrl: get('instagramurl'),
    facebookUrl: get('facebookurl'),
    linkedinUrl: get('linkedinurl'),
    source: get('source'),
    sourceReference: get('sourcereference'),
    status: enumValue('status') || undefined,
    priority: enumValue('priority') || undefined,
    notes: get('notes'),
  };
}

export class LeadService {
  private async duplicates(input: DuplicateCheckInput, database: DatabaseClient = prisma) {
    const keys = duplicateKeys(input);
    const criteria: Prisma.LeadWhereInput[] = [{ businessNameKey: keys.businessNameKey }];
    if (keys.websiteKey) criteria.push({ websiteKey: keys.websiteKey });
    if (keys.emailKey) criteria.push({ emailKey: keys.emailKey });
    if (keys.phoneKey) criteria.push({ phoneKey: keys.phoneKey });

    const matches = await database.lead.findMany({
      where: { OR: criteria, ...(input.excludeId ? { id: { not: input.excludeId } } : {}) },
      select: { id: true, businessName: true, websiteUrl: true, email: true, phone: true, businessNameKey: true, websiteKey: true, emailKey: true, phoneKey: true, archivedAt: true },
      take: 20,
    });
    return matches.map((lead) => ({
      id: lead.id,
      businessName: lead.businessName,
      websiteUrl: lead.websiteUrl,
      email: lead.email,
      phone: lead.phone,
      archivedAt: lead.archivedAt,
      reasons: matchingReasons(keys, lead),
    })).filter((match) => match.reasons.length > 0);
  }

  async list(input: ListLeadsInput) {
    const where: Prisma.LeadWhereInput = {};
    const conditions: Prisma.LeadWhereInput[] = [];
    if (input.archived === 'active') where.archivedAt = null;
    if (input.archived === 'archived') where.archivedAt = { not: null };
    if (input.status) where.status = input.status;
    if (input.priority) where.priority = input.priority;
    if (input.industry) where.industry = { contains: input.industry, mode: 'insensitive' };
    if (input.country) where.country = { contains: input.country, mode: 'insensitive' };
    if (input.city) where.city = { contains: input.city, mode: 'insensitive' };
    if (input.source) where.source = { contains: input.source, mode: 'insensitive' };
    if (input.hasWebsite !== undefined) where.websiteUrl = input.hasWebsite ? { not: null } : null;
    if (input.hasEmail !== undefined) where.email = input.hasEmail ? { not: null } : null;
    if (input.hasSocialMedia !== undefined) {
      const socials: Prisma.LeadWhereInput[] = [{ instagramUrl: { not: null } }, { facebookUrl: { not: null } }, { linkedinUrl: { not: null } }];
      conditions.push(input.hasSocialMedia ? { OR: socials } : { AND: socials.map((item) => ({ NOT: item })) });
    }
    if (input.search) {
      conditions.push({ OR: [
        { businessName: { contains: input.search, mode: 'insensitive' } },
        { industry: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { city: { contains: input.search, mode: 'insensitive' } },
      ] });
    }
    if (input.createdFrom || input.createdTo) {
      const createdTo = input.createdTo ? new Date(input.createdTo) : undefined;
      createdTo?.setUTCHours(23, 59, 59, 999);
      where.createdAt = { gte: input.createdFrom, lte: createdTo };
    }
    if (conditions.length) where.AND = conditions;

    const [total, leads] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { [input.sortBy]: input.sortOrder },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] }, _count: { select: { statusHistory: true } } },
      }),
    ]);

    return { data: leads.map(publicLead), pagination: { page: input.page, pageSize: input.pageSize, total, totalPages: Math.max(1, Math.ceil(total / input.pageSize)) } };
  }

  async get(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        statusHistory: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
    return publicLead(lead);
  }

  async checkDuplicates(input: DuplicateCheckInput) {
    return { duplicates: await this.duplicates(input) };
  }

  async create(input: CreateLeadInput, userId: string) {
    const duplicates = await this.duplicates(input);
    if (duplicates.length && !input.allowDuplicate) throw new AppError(409, 'DUPLICATE_LEAD', 'Potential duplicate leads were found.', { duplicates });

    const lead = await prisma.$transaction(async (transaction) => transaction.lead.create({
      data: {
        ...createData(input),
        contacts: { create: prepareContacts(input.contacts) },
        statusHistory: { create: { userId, fromStatus: null, toStatus: input.status } },
      },
      include: { contacts: true, statusHistory: { include: { user: { select: { id: true, name: true } } } } },
    }));
    return publicLead(lead);
  }

  async update(id: string, input: UpdateLeadInput, userId: string) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.lead.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead not found.');

      const candidate = {
        businessName: input.businessName ?? existing.businessName,
        websiteUrl: input.websiteUrl === undefined ? existing.websiteUrl : input.websiteUrl,
        email: input.email === undefined ? existing.email : input.email,
        phone: input.phone === undefined ? existing.phone : input.phone,
        excludeId: id,
      };
      const identityChanged = input.businessName !== undefined || input.websiteUrl !== undefined || input.email !== undefined || input.phone !== undefined;
      if (identityChanged) {
        const duplicates = await this.duplicates(candidate, transaction);
        if (duplicates.length) throw new AppError(409, 'DUPLICATE_LEAD', 'This update would match another lead.', { duplicates });
      }

      const { contacts, ...fields } = input;
      const keys = duplicateKeys(candidate);
      if (contacts) await transaction.leadContact.deleteMany({ where: { leadId: id } });
      const lead = await transaction.lead.update({
        where: { id },
        data: {
          ...fields,
          ...keys,
          ...(contacts ? { contacts: { create: prepareContacts(contacts) } } : {}),
          ...(input.status && input.status !== existing.status ? { statusHistory: { create: { userId, fromStatus: existing.status, toStatus: input.status } } } : {}),
        },
        include: { contacts: true, statusHistory: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } } } } },
      });
      return publicLead(lead);
    });
  }

  async archive(id: string) {
    const existing = await prisma.lead.findUnique({ where: { id }, select: { id: true, archivedAt: true } });
    if (!existing) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
    if (existing.archivedAt) throw new AppError(409, 'LEAD_ALREADY_ARCHIVED', 'Lead is already archived.');
    return publicLead(await prisma.lead.update({ where: { id }, data: { archivedAt: new Date() } }));
  }

  async importCsv(csv: string, dryRun: boolean, skipDuplicates: boolean, userId: string) {
    let records: Record<string, string>[];
    try {
      records = recordsFromCsv(csv);
    } catch (error) {
      throw new AppError(422, 'INVALID_CSV', error instanceof Error ? error.message : 'CSV could not be parsed.');
    }
    if (records.length > 500) throw new AppError(422, 'CSV_LIMIT_EXCEEDED', 'A single import can contain at most 500 data rows.');

    const invalidRows: Array<{ row: number; errors: Record<string, string[] | undefined> }> = [];
    const duplicateRows: Array<{ row: number; businessName: string; matches: unknown[] }> = [];
    const accepted: Array<{ row: number; input: CreateLeadInput; keys: DuplicateKeys }> = [];

    for (const [index, record] of records.entries()) {
      const parsed = createLeadSchema.safeParse(csvRecord(record));
      const row = index + 2;
      if (!parsed.success) {
        invalidRows.push({ row, errors: parsed.error.flatten().fieldErrors });
        continue;
      }
      const keys = duplicateKeys(parsed.data);
      const batchMatches = accepted.flatMap((item) => {
        const reasons = matchingReasons(keys, item.keys);
        return reasons.length ? [{ id: null, businessName: item.input.businessName, reasons, sourceRow: item.row }] : [];
      });
      const databaseMatches = await this.duplicates(parsed.data);
      const matches = [...databaseMatches, ...batchMatches];
      if (matches.length) duplicateRows.push({ row, businessName: parsed.data.businessName, matches });
      else accepted.push({ row, input: parsed.data, keys });
    }

    const report = { totalRows: records.length, validRows: accepted.length, invalidRows, duplicateRows, importedRows: 0 };
    if (dryRun) return report;
    if (duplicateRows.length && !skipDuplicates) throw new AppError(409, 'IMPORT_DUPLICATES', 'Resolve or skip duplicate rows before importing.', report);

    await prisma.$transaction(async (transaction) => {
      for (const item of accepted) {
        await transaction.lead.create({
          data: {
            ...createData(item.input),
            contacts: { create: prepareContacts(item.input.contacts) },
            statusHistory: { create: { userId, fromStatus: null, toStatus: item.input.status } },
          },
        });
      }
    });
    return { ...report, importedRows: accepted.length };
  }
}

export const leadService = new LeadService();
