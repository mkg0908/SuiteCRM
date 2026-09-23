import { getPrismaClient } from './prismaClient.js';

export interface CreateUpdateInput {
  caseId: string;
  author: string;
  text: string;
  internal?: boolean;
  timestamp?: Date;
}

export async function createCaseUpdate(input: CreateUpdateInput) {
  const prisma = getPrismaClient();
  return prisma.caseUpdate.create({
    data: {
      caseId: input.caseId,
      author: input.author,
      text: input.text,
      internal: input.internal ?? false,
      timestamp: input.timestamp ?? new Date(),
    },
    select: { id: true, caseId: true, author: true, text: true, timestamp: true, internal: true },
  });
}

export async function getCaseUpdates(caseId: string) {
  const prisma = getPrismaClient();
  return prisma.caseUpdate.findMany({
    where: { caseId },
    orderBy: { timestamp: 'asc' },
    select: { id: true, caseId: true, author: true, text: true, timestamp: true, internal: true },
  });
}
