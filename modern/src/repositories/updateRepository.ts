import prisma from './prismaClient.js';

export async function createUpdate(data: {
  caseId: string;
  author: string;
  text: string;
  internal: boolean;
}) {
  return prisma.caseUpdate.create({
    data,
    select: { id: true, author: true, text: true, internal: true, createdAt: true },
  });
}

export async function listUpdates(caseId: string) {
  return prisma.caseUpdate.findMany({
    where: { caseId },
    select: { id: true, author: true, text: true, internal: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}
