import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(80),
  password: z.string().min(10).max(128),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

