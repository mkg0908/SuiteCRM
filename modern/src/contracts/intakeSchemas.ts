import { z } from 'zod';

export const IntakeMessageSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid().optional().nullable(),
  channel: z.enum(['Email', 'WhatsApp', 'Phone', 'Portal', 'Manual']),
  sender: z.string().optional().nullable(),
  processedAt: z.string().datetime(),
  status: z.string(),
});

export const EmailIntakeSummarySchema = z.object({
  casesCreated: z.number(),
  subject: z.string(),
  channel: z.literal('Email'),
  caseNumber: z.string().optional(),
  maskedEmail: z.string().optional().nullable(),
  maskedPhone: z.string().optional().nullable(),
});

export const WhatsAppIntakeSummarySchema = z.object({
  messagesRead: z.number(),
  casesCreated: z.number(),
  updatesAttached: z.number(),
  chatterSkipped: z.number(),
  spamHeld: z.number(),
  piiMasked: z.number(),
});

export type IntakeMessage = z.infer<typeof IntakeMessageSchema>;
export type EmailIntakeSummary = z.infer<typeof EmailIntakeSummarySchema>;
export type WhatsAppIntakeSummary = z.infer<typeof WhatsAppIntakeSummarySchema>;
