import { createAuditEvent } from '../repositories/auditRepository.js';

export interface AuditParams {
  caseId: string;
  userId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  action: string;
}

export async function writeAuditEvent(params: AuditParams) {
  return createAuditEvent({
    caseId: params.caseId,
    userId: params.userId,
    field: params.field,
    oldValue: params.oldValue,
    newValue: params.newValue,
    action: params.action,
  });
}
