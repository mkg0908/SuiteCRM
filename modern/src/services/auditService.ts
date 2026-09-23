import { createAuditEvent } from '../repositories/auditRepository.js';

export async function recordAudit(
  caseId: string,
  user: string,
  field: string,
  oldValue: string | null | undefined,
  newValue: string | null | undefined,
) {
  return createAuditEvent({
    caseId,
    user,
    field,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  });
}

export async function recordMultipleAudits(
  caseId: string,
  user: string,
  changes: Array<{ field: string; oldValue?: string | null; newValue?: string | null }>,
) {
  return Promise.all(
    changes.map(change => recordAudit(caseId, user, change.field, change.oldValue, change.newValue)),
  );
}
