import prisma from './prismaClient.js';

export async function createAuditEvent(data: {
  caseId: string;
  user: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  return prisma.auditEvent.create({
    data,
    select: { id: true, user: true, field: true, oldValue: true, newValue: true, createdAt: true },
  });
}

export async function listAuditEvents(caseId: string) {
  return prisma.auditEvent.findMany({
    where: { caseId },
    select: { id: true, user: true, field: true, oldValue: true, newValue: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}
