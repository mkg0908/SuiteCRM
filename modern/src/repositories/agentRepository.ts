import prisma from './prismaClient.js';

export async function listActiveAgents() {
  return prisma.agentRef.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, isActive: true },
  });
}

export async function findAgentById(id: string) {
  return prisma.agentRef.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, isActive: true },
  });
}
