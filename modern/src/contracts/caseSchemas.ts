import { z } from 'zod';

export const CaseStatusSchema = z.enum([
  'Open_New',
  'Open_Assigned',
  'Open_Pending Input',
  'Closed_Closed',
  'Closed_Rejected',
  'Closed_Duplicate',
]);

export const CasePrioritySchema = z.enum(['P1', 'P2', 'P3']);

export const CaseStateSchema = z.enum(['Open', 'Closed']);

export const CaseChannelSchema = z.enum(['Email', 'WhatsApp', 'Phone', 'Portal', 'Manual']);

export const AccountRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  domain: z.string().optional().nullable(),
});

export const AgentRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  userId: z.string(),
  timestamp: z.string().datetime(),
  field: z.string(),
  oldValue: z.string().optional().nullable(),
  newValue: z.string().optional().nullable(),
  action: z.string(),
});

export const CaseUpdateSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  author: z.string(),
  text: z.string(),
  timestamp: z.string().datetime(),
  internal: z.boolean(),
});

export const CaseSchema = z.object({
  id: z.string().uuid(),
  caseNumber: z.string(),
  subject: z.string(),
  description: z.string().optional().nullable(),
  priority: CasePrioritySchema,
  status: CaseStatusSchema,
  state: CaseStateSchema,
  type: z.string().optional().nullable(),
  channel: CaseChannelSchema,
  category: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
  dateCreated: z.string().datetime(),
  dateModified: z.string().datetime(),
  slaDueAt: z.string().datetime().optional().nullable(),
  firstResponseAt: z.string().datetime().optional().nullable(),
  isAtRisk: z.boolean(),
  isBreached: z.boolean(),
  duplicateOf: z.string().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
});

/** List projection - omits PII fields */
export const CaseListItemSchema = CaseSchema.omit({
  description: true,
  resolution: true,
  customerEmail: true as never,
  customerPhone: true as never,
}).extend({
  assignedAgent: AgentRefSchema.optional().nullable(),
  account: AccountRefSchema.optional().nullable(),
});

export const CreateCaseSchema = z.object({
  subject: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: CasePrioritySchema,
  channel: CaseChannelSchema.default('Manual'),
  category: z.string().optional(),
  type: z.string().optional(),
  accountId: z.string().uuid().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
});

export const UpdateCaseSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  priority: CasePrioritySchema.optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  resolution: z.string().optional(),
  accountId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
});

export const StatusTransitionSchema = z.object({
  status: CaseStatusSchema,
  userId: z.string().min(1),
});

export const CreateCaseUpdateSchema = z.object({
  author: z.string().min(1),
  text: z.string().min(1),
  internal: z.boolean().default(false),
});

export const CaseListQuerySchema = z.object({
  search: z.string().optional(),
  status: CaseStatusSchema.optional(),
  priority: CasePrioritySchema.optional(),
  channel: CaseChannelSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export type CasePriority = z.infer<typeof CasePrioritySchema>;
export type CaseState = z.infer<typeof CaseStateSchema>;
export type Case = z.infer<typeof CaseSchema>;
export type CaseListItem = z.infer<typeof CaseListItemSchema>;
export type CreateCase = z.infer<typeof CreateCaseSchema>;
export type UpdateCase = z.infer<typeof UpdateCaseSchema>;
export type CaseUpdate = z.infer<typeof CaseUpdateSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AccountRef = z.infer<typeof AccountRefSchema>;
export type AgentRef = z.infer<typeof AgentRefSchema>;
