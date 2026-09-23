import { z } from 'zod';

export const RoleSchema = z.enum(['agent', 'manager']);

export const SetRoleSchema = z.object({
  role: RoleSchema,
});

export type UserRole = z.infer<typeof RoleSchema>;
export type SetRole = z.infer<typeof SetRoleSchema>;
