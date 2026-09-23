import { parseEmail } from '../domain/intake/emailParser.js';
import { parseWhatsAppExport } from '../domain/intake/whatsappParser.js';
import { triageMessage } from '../domain/intake/triageRules.js';
import { createCase, getNextCaseSequence, getCaseByNumber } from '../repositories/caseRepository.js';
import { createCaseUpdate } from '../repositories/updateRepository.js';
import { createIntakeMessage } from '../repositories/intakeRepository.js';
import { writeAuditEvent } from './auditService.js';
import { normalizeSubject, findDuplicate } from './duplicateService.js';
import { computeSlaDueAt } from '../domain/sla/slaService.js';
import { formatCaseNumber } from '../domain/cases/status.js';
import { maskEmail, maskPhone } from '../domain/privacy/privacyMapper.js';
import type { UserRole } from '../contracts/sessionSchemas.js';
import { logger } from '../observability/logger.js';

export interface EmailIntakeInput {
  rawContent: string;
  requestUserId: string;
  role: UserRole;
  defaultAssignedUserId?: string;
}

export async function processEmailIntake(input: EmailIntakeInput) {
  const parsed = parseEmail(input.rawContent);
  const { subject, body } = parsed;

  const sequence = await getNextCaseSequence();
  const caseNumber = formatCaseNumber(sequence);
  const slaDueAt = computeSlaDueAt('P2', new Date()); // Default P2 for email

  const newCase = await createCase({
    caseNumber,
    subject,
    description: body,
    priority: 'P2',
    status: 'Open_New',
    channel: 'Email',
    normalizedSubject: normalizeSubject(subject),
    slaDueAt,
    assignedUserId: input.defaultAssignedUserId,
    customerEmail: parsed.from,
  });

  await createIntakeMessage({
    caseId: newCase.id,
    channel: 'Email',
    rawContent: '[REDACTED]', // Never store raw content with PII
    sender: parsed.from,
    status: 'processed',
  });

  await writeAuditEvent({
    caseId: newCase.id,
    userId: input.requestUserId,
    field: 'status',
    oldValue: null,
    newValue: 'Open_New',
    action: 'intake_email',
  });

  logger.info('Email intake processed', { caseNumber });

  const maskedEmail = parsed.from && input.role === 'agent' ? maskEmail(parsed.from) : parsed.from;

  return {
    casesCreated: 1,
    subject,
    channel: 'Email' as const,
    caseNumber,
    maskedEmail,
    maskedPhone: null,
  };
}

export interface WhatsAppIntakeInput {
  rawContent: string;
  requestUserId: string;
  role: UserRole;
  knownSenders?: Set<string>;
}

export async function processWhatsAppIntake(input: WhatsAppIntakeInput) {
  const { messages, skippedSystemLines } = parseWhatsAppExport(input.rawContent);

  let casesCreated = 0;
  let updatesAttached = 0;
  let chatterSkipped = 0;
  let spamHeld = 0;
  let piiMasked = 0;

  let lastCreatedCaseNumber: string | null = null;

  for (const msg of messages) {
    const knownSender = !input.knownSenders || input.knownSenders.has(msg.sender);
    const triage = triageMessage(msg.text, knownSender);

    if (triage.spamHold) {
      spamHeld++;
      continue;
    }

    if (!triage.createCase && !triage.attachToExisting) {
      chatterSkipped++;
      continue;
    }

    if (triage.attachToExisting && lastCreatedCaseNumber) {
      // Attach as update to most recent open case
      const existingCase = await getCaseByNumber(lastCreatedCaseNumber);
      if (existingCase) {
        await createCaseUpdate({
          caseId: existingCase.id,
          author: msg.sender,
          text: msg.text,
          internal: false,
          timestamp: msg.timestamp,
        });
        updatesAttached++;
        continue;
      }
    }

    if (triage.createCase) {
      const sequence = await getNextCaseSequence();
      const caseNumber = formatCaseNumber(sequence);
      const slaDueAt = computeSlaDueAt(triage.priority, msg.timestamp);

      const newCase = await createCase({
        caseNumber,
        subject: msg.text.slice(0, 200),
        description: msg.text,
        priority: triage.priority,
        status: 'Open_New',
        channel: 'WhatsApp',
        category: triage.category,
        normalizedSubject: normalizeSubject(msg.text.slice(0, 200)),
        slaDueAt,
      });

      await createIntakeMessage({
        caseId: newCase.id,
        channel: 'WhatsApp',
        rawContent: '[REDACTED]',
        sender: msg.sender,
        status: 'processed',
      });

      await writeAuditEvent({
        caseId: newCase.id,
        userId: input.requestUserId,
        field: 'status',
        oldValue: null,
        newValue: 'Open_New',
        action: 'intake_whatsapp',
      });

      casesCreated++;
      lastCreatedCaseNumber = caseNumber;

      // Count PII in sender name (simplified - count if looks like email/phone)
      if (msg.sender.includes('@') || /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(msg.sender)) {
        piiMasked++;
      }
    }
  }

  logger.info('WhatsApp intake processed', { messagesRead: messages.length, casesCreated });

  return {
    messagesRead: messages.length,
    casesCreated,
    updatesAttached,
    chatterSkipped,
    spamHeld,
    piiMasked,
  };
}
