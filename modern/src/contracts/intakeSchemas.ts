import { z } from 'zod';

export const EmailIntakeSchema = z.object({
  text: z.string().min(1).max(5 * 1024 * 1024),
});

export const WhatsAppIntakeSchema = z.object({
  text: z.string().min(1).max(5 * 1024 * 1024),
});

export type EmailIntakeInput = z.infer<typeof EmailIntakeSchema>;
export type WhatsAppIntakeInput = z.infer<typeof WhatsAppIntakeSchema>;

export const IntakeSummarySchema = z.object({
  messagesRead: z.number(),
  casesCreated: z.number(),
  updatesAttached: z.number(),
  chatterSkipped: z.number(),
  spamHeld: z.number(),
  piiMasked: z.number(),
});

export type IntakeSummary = z.infer<typeof IntakeSummarySchema>;
