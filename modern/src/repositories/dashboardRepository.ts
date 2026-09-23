import { getPrismaClient } from './prismaClient.js';

export async function getOpenCasesByStatus(): Promise<Record<string, number>> {
  const prisma = getPrismaClient();
  const groups = await prisma.case.groupBy({
    by: ['status'],
    where: { state: 'Open' },
    _count: { status: true },
  });
  return Object.fromEntries(groups.map((g) => [g.status, g._count.status]));
}

export async function getAtRiskCount(): Promise<number> {
  const prisma = getPrismaClient();
  return prisma.case.count({ where: { isAtRisk: true, state: 'Open' } });
}

export async function getBreachedCount(): Promise<number> {
  const prisma = getPrismaClient();
  return prisma.case.count({ where: { isBreached: true } });
}

export async function getCasesByChannel(): Promise<Record<string, number>> {
  const prisma = getPrismaClient();
  const groups = await prisma.case.groupBy({
    by: ['channel'],
    _count: { channel: true },
  });
  return Object.fromEntries(groups.map((g) => [g.channel, g._count.channel]));
}

export async function getAverageFirstResponseHours(): Promise<number | null> {
  const prisma = getPrismaClient();
  const cases = await prisma.case.findMany({
    where: { firstResponseAt: { not: null } },
    select: { dateCreated: true, firstResponseAt: true },
    take: 1000,
  });
  if (cases.length === 0) return null;
  const totalHours = cases.reduce((sum, c) => {
    const diff = (c.firstResponseAt!.getTime() - c.dateCreated.getTime()) / 3600000;
    return sum + diff;
  }, 0);
  return totalHours / cases.length;
}

export async function getTopCategories(limit = 5): Promise<Array<{ category: string; count: number }>> {
  const prisma = getPrismaClient();
  const groups = await prisma.case.groupBy({
    by: ['category'],
    where: { category: { not: null } },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
    take: limit,
  });
  return groups.map((g) => ({ category: g.category ?? 'unknown', count: g._count.category }));
}

export async function getCasesPerAgent(): Promise<Array<{ agentId: string; agentName: string; count: number }>> {
  const prisma = getPrismaClient();
  const groups = await prisma.case.groupBy({
    by: ['assignedUserId'],
    where: { assignedUserId: { not: null }, state: 'Open' },
    _count: { assignedUserId: true },
  });
  const agentIds = groups.map((g) => g.assignedUserId).filter(Boolean) as string[];
  const agents = await prisma.agentRef.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true },
  });
  const agentMap = new Map(agents.map((a) => [a.id, a.name]));
  return groups.map((g) => ({
    agentId: g.assignedUserId!,
    agentName: agentMap.get(g.assignedUserId!) ?? 'Unknown',
    count: g._count.assignedUserId,
  }));
}
