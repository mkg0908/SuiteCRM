import { getPrismaClient } from './prismaClient.js';

export interface CreateAuditEventInput {
  caseId: string;
  userId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  action: string;
  timestamp?: Date;
}

export async function createAuditEvent(input: CreateAuditEventInput) {
  const prisma = getPrismaClient();
  return prisma.auditEvent.create({
    data: {
      caseId: input.caseId,
      userId: input.userId,
      field: input.field,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      action: input.action,
      timestamp: input.timestamp ?? new Date(),
    },
    select: { id: true, caseId: true, userId: true, timestamp: true, field: true, oldValue: true, newValue: true, action: true },
  });
}

export async function getAuditEventsForCase(caseId: string) {
  const prisma = getPrismaClient();
  return prisma.auditEvent.findMany({
    where: { caseId },
    orderBy: { timestamp: 'asc' },
    select: { id: true, caseId: true, userId: true, timestamp: true, field: true, oldValue: true, newValue: true, action: true },
  });
}
