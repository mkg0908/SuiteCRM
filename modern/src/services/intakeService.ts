import { parseEmailText } from '../domain/intake/emailParser.js';
import { parseWhatsAppExport } from '../domain/intake/whatsappParser.js';
import { classifyMessage } from '../domain/intake/triageRules.js';
import * as intakeRepo from '../repositories/intakeRepository.js';
import { createCase, addUpdate } from './caseService.js';
import { logger } from '../observability/logger.js';
import type { IntakeSummary } from '../contracts/intakeSchemas.js';

export async function processEmailIntake(text: string, user: string): Promise<IntakeSummary> {
  const parsed = parseEmailText(text);
  let piiMasked = 0;

  const result = await createCase(
    {
      subject: parsed.subject || 'Untitled Email',
      description: parsed.body,
      priority: 'P2',
      channel: 'Email',
      customerEmail: parsed.from || undefined,
    },
    user,
  );

  await intakeRepo.createIntakeMessage({
    caseId: result.case.id,
    source: 'email',
    sender: parsed.from,
    subject: parsed.subject,
    body: parsed.body,
    classification: 'other',
  });

  if (parsed.from) piiMasked++;
  const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
  if (phoneMatch) piiMasked += phoneMatch.length;

  logger.info('Email intake processed');

  return {
    messagesRead: 1,
    casesCreated: 1,
    updatesAttached: 0,
    chatterSkipped: 0,
    spamHeld: 0,
    piiMasked,
  };
}

export async function processWhatsAppIntake(
  text: string,
  user: string,
): Promise<IntakeSummary> {
  const messages = parseWhatsAppExport(text);
  const summary: IntakeSummary = {
    messagesRead: messages.length,
    casesCreated: 0,
    updatesAttached: 0,
    chatterSkipped: 0,
    spamHeld: 0,
    piiMasked: 0,
  };

  const recentCases: Map<string, { caseNumber: string; caseId: string; topic: string }> =
    new Map();

  for (const msg of messages) {
    if (msg.isSystemLine) continue;

    const classification = classifyMessage(msg.text, msg.sender);

    await intakeRepo.createIntakeMessage({
      source: 'whatsapp',
      sender: msg.sender,
      subject: msg.text.substring(0, 100),
      body: msg.text,
      classification,
      rawTimestamp: msg.timestamp,
    });

    const emailMatches = msg.text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    );
    const phoneMatches = msg.text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
    if (emailMatches) summary.piiMasked += emailMatches.length;
    if (phoneMatches) summary.piiMasked += phoneMatches.length;

    switch (classification) {
      case 'spam':
        summary.spamHeld++;
        break;

      case 'chatter':
        summary.chatterSkipped++;
        break;

      case 'me_too': {
        const lastCase = Array.from(recentCases.values()).pop();
        if (lastCase) {
          await addUpdate(lastCase.caseNumber, `[${msg.sender}]: ${msg.text}`, false, user);
          summary.updatesAttached++;
        } else {
          summary.chatterSkipped++;
        }
        break;
      }

      case 'urgent': {
        const result = await createCase(
          {
            subject: msg.text.substring(0, 200),
            description: msg.text,
            priority: 'P1',
            channel: 'WhatsApp',
          },
          user,
        );
        recentCases.set(msg.sender, {
          caseNumber: result.case.caseNumber,
          caseId: result.case.id,
          topic: msg.text.substring(0, 200),
        });
        summary.casesCreated++;
        break;
      }

      case 'question': {
        const result = await createCase(
          {
            subject: msg.text.substring(0, 200),
            description: msg.text,
            priority: 'P2',
            channel: 'WhatsApp',
          },
          user,
        );
        recentCases.set(msg.sender, {
          caseNumber: result.case.caseNumber,
          caseId: result.case.id,
          topic: msg.text.substring(0, 200),
        });
        summary.casesCreated++;
        break;
      }

      case 'feature': {
        const result = await createCase(
          {
            subject: msg.text.substring(0, 200),
            description: msg.text,
            priority: 'P3',
            channel: 'WhatsApp',
          },
          user,
        );
        recentCases.set(msg.sender, {
          caseNumber: result.case.caseNumber,
          caseId: result.case.id,
          topic: msg.text.substring(0, 200),
        });
        summary.casesCreated++;
        break;
      }

      default: {
        const result = await createCase(
          {
            subject: msg.text.substring(0, 200),
            description: msg.text,
            priority: 'P2',
            channel: 'WhatsApp',
          },
          user,
        );
        recentCases.set(msg.sender, {
          caseNumber: result.case.caseNumber,
          caseId: result.case.id,
          topic: msg.text.substring(0, 200),
        });
        summary.casesCreated++;
        break;
      }
    }
  }

  logger.info('WhatsApp intake processed');
  return summary;
}
