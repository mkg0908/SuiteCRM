import { z } from 'zod';

export const CaseCreateSchema = z.object({
  subject: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3']),
  type: z.string().optional(),
  channel: z.enum(['Email', 'WhatsApp', 'Phone', 'Web']).optional(),
  category: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  accountId: z.string().uuid().optional(),
});

export const CaseUpdateSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  resolution: z.string().optional(),
});

export const CaseStatusChangeSchema = z.object({
  status: z.enum([
    'Open_New',
    'Open_Assigned',
    'Open_Pending Input',
    'Closed_Closed',
    'Closed_Rejected',
    'Closed_Duplicate',
  ]),
});

export const CaseUpdateCreateSchema = z.object({
  text: z.string().min(1),
  internal: z.boolean().optional().default(false),
});

export const CaseListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  channel: z.enum(['Email', 'WhatsApp', 'Phone', 'Web']).optional(),
  assignedUserId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CaseCreateInput = z.infer<typeof CaseCreateSchema>;
export type CaseUpdateInput = z.infer<typeof CaseUpdateSchema>;
export type CaseStatusChangeInput = z.infer<typeof CaseStatusChangeSchema>;
export type CaseUpdateCreateInput = z.infer<typeof CaseUpdateCreateSchema>;
export type CaseListQuery = z.infer<typeof CaseListQuerySchema>;
