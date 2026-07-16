import { z } from 'zod';

export const LEAD_STATUSES = ['NEW', 'REVIEWED', 'QUALIFIED', 'NOT_QUALIFIED', 'READY_FOR_OUTREACH', 'CONTACTED', 'REPLIED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'WON', 'LOST'] as const;
export const LEAD_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const optionalText = (max: number) => z.union([z.string().trim().max(max), z.null()]).optional().transform((value) => value || null);
const optionalEmail = z.union([z.string().trim().email().max(254), z.literal(''), z.null()]).optional().transform((value) => value || null);
const optionalUrl = z.union([z.string().trim().url().max(2048), z.literal(''), z.null()]).optional().transform((value) => value || null);

export const leadContactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  jobTitle: optionalText(120),
  email: optionalEmail,
  phone: optionalText(40),
  isPrimary: z.boolean().default(false),
  notes: optionalText(2000),
}).strict();

const leadFields = {
  businessName: z.string().trim().min(2).max(160),
  industry: optionalText(120),
  description: optionalText(5000),
  websiteUrl: optionalUrl,
  email: optionalEmail,
  phone: optionalText(40),
  country: optionalText(100),
  city: optionalText(100),
  address: optionalText(500),
  googleMapsUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  source: optionalText(100),
  sourceReference: optionalText(255),
  status: z.enum(LEAD_STATUSES).default('NEW'),
  priority: z.enum(LEAD_PRIORITIES).default('MEDIUM'),
  notes: optionalText(10_000),
  contacts: z.array(leadContactSchema).max(20).default([]),
};

export const createLeadSchema = z.object({
  ...leadFields,
  allowDuplicate: z.boolean().default(false),
}).strict();

export const updateLeadSchema = z.object(leadFields).partial().strict();

const queryBoolean = z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean().optional());

export const listLeadsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  industry: z.string().trim().max(120).optional(),
  country: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  source: z.string().trim().max(100).optional(),
  hasWebsite: queryBoolean,
  hasEmail: queryBoolean,
  hasSocialMedia: queryBoolean,
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  archived: z.enum(['active', 'archived', 'all']).default('active'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'businessName', 'status', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

export const leadIdSchema = z.object({ id: z.string().uuid() }).strict();

export const duplicateCheckSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  websiteUrl: optionalUrl,
  email: optionalEmail,
  phone: optionalText(40),
  excludeId: z.string().uuid().optional(),
}).strict();

export const importLeadsSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
  dryRun: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
}).strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsInput = z.infer<typeof listLeadsSchema>;
export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>;
