import prisma from './prismaClient.js';

export async function createIntakeMessage(data: {
  caseId?: string;
  source: string;
  sender?: string;
  subject?: string;
  body?: string;
  classification?: string;
  rawTimestamp?: string;
}) {
  return prisma.intakeMessage.create({
    data,
    select: {
      id: true,
      caseId: true,
      source: true,
      sender: true,
      subject: true,
      classification: true,
      createdAt: true,
    },
  });
}
