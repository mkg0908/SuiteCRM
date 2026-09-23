import { v4 as uuidv4 } from 'uuid';
import {
  listCases,
  getCaseByNumber,
  createCase,
  updateCase,
  getNextCaseSequence,
  type CaseListFilter,
} from '../repositories/caseRepository.js';
import { createCaseUpdate } from '../repositories/updateRepository.js';
import { writeAuditEvent } from './auditService.js';
import { normalizeSubject } from './duplicateService.js';
import { assertValidTransition, deriveStateFromStatus, formatCaseNumber } from '../domain/cases/status.js';
import type { CaseStatus } from '../domain/cases/status.js';
import { computeSlaDueAt } from '../domain/sla/slaService.js';
import { logger } from '../observability/logger.js';
import type { CreateCase, UpdateCase } from '../contracts/caseSchemas.js';

export async function getCases(filter: CaseListFilter) {
  return listCases(filter);
}

export async function getCaseDetail(caseNumber: string) {
  return getCaseByNumber(caseNumber);
}

export async function createNewCase(
  input: CreateCase,
  assignedUserId: string,
  requestUserId: string,
) {
  const sequence = await getNextCaseSequence();
  const caseNumber = formatCaseNumber(sequence);
  const slaDueAt = computeSlaDueAt(input.priority, new Date());

  const newCase = await createCase({
    caseNumber,
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    status: 'Open_New',
    channel: input.channel ?? 'Manual',
    category: input.category,
    type: input.type,
    accountId: input.accountId,
    assignedUserId,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    normalizedSubject: normalizeSubject(input.subject),
    slaDueAt,
  });

  await writeAuditEvent({
    caseId: newCase.id,
    userId: requestUserId,
    field: 'status',
    oldValue: null,
    newValue: 'Open_New',
    action: 'create',
  });

  logger.info('Case created', { caseNumber });
  return newCase;
}

export async function editCase(
  caseNumber: string,
  input: UpdateCase,
  requestUserId: string,
) {
  const existing = await getCaseByNumber(caseNumber);
  if (!existing) throw new Error('Case not found');

  const updated = await updateCase(caseNumber, input);

  // Write audit events for changed fields
  const auditableFields = ['subject', 'priority', 'category', 'type', 'resolution', 'assignedUserId'] as const;
  for (const field of auditableFields) {
    const oldVal = String((existing as Record<string, unknown>)[field] ?? '');
    const newVal = String((input as Record<string, unknown>)[field] ?? oldVal);
    if (newVal !== oldVal && (input as Record<string, unknown>)[field] !== undefined) {
      await writeAuditEvent({
        caseId: existing.id,
        userId: requestUserId,
        field,
        oldValue: oldVal || null,
        newValue: newVal || null,
        action: 'update',
      });
    }
  }

  return updated;
}

export async function transitionCaseStatus(
  caseNumber: string,
  newStatus: CaseStatus,
  requestUserId: string,
) {
  const existing = await getCaseByNumber(caseNumber);
  if (!existing) throw new Error('Case not found');

  // Will throw TransitionConflictError if invalid
  assertValidTransition(existing.status as CaseStatus, newStatus);

  const updated = await updateCase(caseNumber, { status: newStatus });

  await writeAuditEvent({
    caseId: existing.id,
    userId: requestUserId,
    field: 'status',
    oldValue: existing.status,
    newValue: newStatus,
    action: 'status_change',
  });

  logger.info('Case status changed', { caseNumber, from: existing.status, to: newStatus });
  return updated;
}

export async function addCaseUpdate(
  caseNumber: string,
  input: { author: string; text: string; internal: boolean },
  requestUserId: string,
) {
  const existing = await getCaseByNumber(caseNumber);
  if (!existing) throw new Error('Case not found');

  const update = await createCaseUpdate({
    caseId: existing.id,
    author: input.author,
    text: input.text,
    internal: input.internal,
  });

  await writeAuditEvent({
    caseId: existing.id,
    userId: requestUserId,
    field: 'updates',
    oldValue: null,
    newValue: input.text.slice(0, 100),
    action: 'update_added',
  });

  return update;
}
