import { z } from 'zod';
export const searchInputSchema = z.object({ provider: z.enum(['MOCK', 'GOOGLE_PLACES']), keyword: z.string().trim().min(2).max(120), category: z.string().trim().max(80).optional(), country: z.string().trim().max(100).optional(), city: z.string().trim().max(100).optional(), radius: z.number().min(100).max(50_000).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), minimumRating: z.number().min(0).max(5).optional(), hasWebsite: z.boolean().optional(), hasPhone: z.boolean().optional(), hasEmail: z.boolean().optional(), maximumResults: z.number().int().min(1).max(60).default(20) }).strict();
export const importResultsSchema = z.object({ resultIds: z.array(z.string().uuid()).min(1).max(60) }).strict();
export const idSchema = z.object({ id: z.string().uuid() }).strict();
export const templateSchema = z.object({ name: z.string().trim().min(2).max(100), provider: z.enum(['MOCK', 'GOOGLE_PLACES']), criteria: searchInputSchema.omit({ provider: true }) }).strict();
export type SearchInput = z.infer<typeof searchInputSchema>;
