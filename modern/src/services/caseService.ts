import * as caseRepo from '../repositories/caseRepository.js';
import * as agentRepo from '../repositories/agentRepository.js';
import * as updateRepo from '../repositories/updateRepository.js';
import { recordAudit, recordMultipleAudits } from './auditService.js';
import { suggestNextOwner } from '../domain/assignment/assignmentService.js';
import {
  deriveStateFromStatus,
  isTransitionAllowed,
  isValidStatus,
  formatCaseNumber,
  type Status,
} from '../domain/cases/status.js';
import { calculateSlaDue } from '../domain/sla/slaService.js';
import { normalizeSubject, findDuplicate } from '../domain/duplicate/duplicateService.js';
import { maskContactFields, type Role } from '../domain/privacy/privacyMapper.js';
import { logger } from '../observability/logger.js';
import type { CaseCreateInput, CaseUpdateInput, CaseListQuery } from '../contracts/caseSchemas.js';

export class TransitionConflictError extends Error {
  public readonly code = 'transition_conflict';
  constructor(from: string, to: string) {
    super(`Status transition from '${from}' to '${to}' is not allowed`);
    this.name = 'TransitionConflictError';
  }
}

export class CaseNotFoundError extends Error {
  constructor(caseNumber: string) {
    super(`Case ${caseNumber} not found`);
    this.name = 'CaseNotFoundError';
  }
}

export async function listCases(query: CaseListQuery, role: Role) {
  const result = await caseRepo.listCases(query);
  return {
    ...result,
    cases: result.cases.map(c => maskContactFields(c, role)),
  };
}

export async function getCaseDetail(caseNumber: string, role: Role) {
  const caseDetail = await caseRepo.findByCaseNumber(caseNumber);
  if (!caseDetail) throw new CaseNotFoundError(caseNumber);
  return maskContactFields(caseDetail, role);
}

export async function createCase(input: CaseCreateInput, user: string) {
  const seq = await caseRepo.getNextCaseSequence();
  const caseNumber = formatCaseNumber(seq);

  const activeAgents = await agentRepo.listActiveAgents();
  const owner = suggestNextOwner(activeAgents);

  const status = 'Open_New' as Status;
  const state = deriveStateFromStatus(status);
  const now = new Date();
  const slaDueAt = calculateSlaDue(input.priority as 'P1' | 'P2' | 'P3', now);
  const normalized = input.subject ? normalizeSubject(input.subject) : undefined;

  const created = await caseRepo.createCase({
    caseNumber,
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    status,
    state,
    type: input.type,
    channel: input.channel,
    category: input.category,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    normalizedSubject: normalized,
    accountId: input.accountId,
    assignedUserId: owner.id,
    slaDueAt,
  });

  await recordMultipleAudits(created.id, user, [
    { field: 'created', oldValue: null, newValue: caseNumber },
    { field: 'status', oldValue: null, newValue: status },
    { field: 'assignedUserId', oldValue: null, newValue: owner.id },
    { field: 'priority', oldValue: null, newValue: input.priority },
  ]);

  logger.info('Case created', { caseNumber });

  let duplicateSuggestion = null;
  if (input.customerEmail) {
    const since = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const candidates = await caseRepo.findDuplicateCandidates(input.customerEmail, since);
    const dup = findDuplicate(
      input.subject,
      input.customerEmail,
      now,
      candidates.map(c => ({
        ...c,
        normalizedSubject: c.normalizedSubject || '',
        customerEmail: c.customerEmail || '',
      })),
    );
    if (dup && dup.caseNumber !== caseNumber) {
      duplicateSuggestion = dup.caseNumber;
    }
  }

  return { case: created, duplicateSuggestion };
}

export async function updateCase(caseNumber: string, input: CaseUpdateInput, user: string) {
  const existing = await caseRepo.findByCaseNumber(caseNumber);
  if (!existing) throw new CaseNotFoundError(caseNumber);

  const changes: Array<{ field: string; oldValue?: string | null; newValue?: string | null }> = [];
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && (existing as Record<string, unknown>)[key] !== value) {
      changes.push({
        field: key,
        oldValue: String((existing as Record<string, unknown>)[key] ?? ''),
        newValue: String(value),
      });
      data[key] = value;
    }
  }

  if (Object.keys(data).length === 0) return existing;

  if (data.subject) {
    data.normalizedSubject = normalizeSubject(data.subject as string);
  }

  const updated = await caseRepo.updateCase(caseNumber, data);
  await recordMultipleAudits(existing.id, user, changes);

  logger.info('Case updated', { caseNumber });
  return updated;
}

export async function changeStatus(caseNumber: string, targetStatus: string, user: string) {
  if (!isValidStatus(targetStatus)) {
    throw new Error(`Invalid status: ${targetStatus}`);
  }

  const existing = await caseRepo.findByCaseNumber(caseNumber);
  if (!existing) throw new CaseNotFoundError(caseNumber);

  if (!isTransitionAllowed(existing.status as Status, targetStatus as Status)) {
    throw new TransitionConflictError(existing.status, targetStatus);
  }

  const newState = deriveStateFromStatus(targetStatus);
  const data: Record<string, unknown> = {
    status: targetStatus,
    state: newState,
  };

  const updated = await caseRepo.updateCase(caseNumber, data);
  await recordAudit(existing.id, user, 'status', existing.status, targetStatus);

  logger.info('Case status changed', { caseNumber, from: existing.status, to: targetStatus });
  return updated;
}

export async function addUpdate(
  caseNumber: string,
  text: string,
  internal: boolean,
  user: string,
) {
  const existing = await caseRepo.findByCaseNumber(caseNumber);
  if (!existing) throw new CaseNotFoundError(caseNumber);

  const update = await updateRepo.createUpdate({
    caseId: existing.id,
    author: user,
    text,
    internal,
  });

  await recordAudit(existing.id, user, 'update_added', null, internal ? 'internal' : 'public');

  if (!existing.firstResponseAt) {
    await caseRepo.updateCase(caseNumber, { firstResponseAt: new Date() });
  }

  logger.info('Case update added', { caseNumber });
  return update;
}

export async function confirmDuplicate(
  caseNumber: string,
  duplicateOfCaseNumber: string,
  user: string,
) {
  const existing = await caseRepo.findByCaseNumber(caseNumber);
  if (!existing) throw new CaseNotFoundError(caseNumber);

  if (!isTransitionAllowed(existing.status as Status, 'Closed_Duplicate')) {
    throw new TransitionConflictError(existing.status, 'Closed_Duplicate');
  }

  const updated = await caseRepo.updateCase(caseNumber, {
    status: 'Closed_Duplicate',
    state: 'Closed',
    duplicateOf: duplicateOfCaseNumber,
  });

  await recordMultipleAudits(existing.id, user, [
    { field: 'status', oldValue: existing.status, newValue: 'Closed_Duplicate' },
    { field: 'duplicateOf', oldValue: null, newValue: duplicateOfCaseNumber },
  ]);

  logger.info('Case marked as duplicate', { caseNumber, duplicateOf: duplicateOfCaseNumber });
  return updated;
}
