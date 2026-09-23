import { getPrismaClient } from './prismaClient.js';

export interface CreateIntakeMessageInput {
  caseId?: string;
  channel: string;
  rawContent: string;
  sender?: string;
  status?: string;
}

export async function createIntakeMessage(input: CreateIntakeMessageInput) {
  const prisma = getPrismaClient();
  return prisma.intakeMessage.create({
    data: {
      caseId: input.caseId ?? null,
      channel: input.channel as 'Email' | 'WhatsApp' | 'Phone' | 'Portal' | 'Manual',
      rawContent: input.rawContent,
      sender: input.sender ?? null,
      status: input.status ?? 'processed',
    },
    select: { id: true, caseId: true, channel: true, sender: true, processedAt: true, status: true },
  });
}
