import { z } from 'zod';

export const RoleSchema = z.object({
  role: z.enum(['agent', 'manager']),
});

export type RoleInput = z.infer<typeof RoleSchema>;
