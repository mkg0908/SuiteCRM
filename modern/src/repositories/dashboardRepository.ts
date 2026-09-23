import prisma from './prismaClient.js';

export async function getOpenCasesByStatus() {
  const results = await prisma.case.groupBy({
    by: ['status'],
    where: { state: 'Open' },
    _count: { _all: true },
  });
  const statusCounts: Record<string, number> = {};
  for (const r of results) {
    statusCounts[r.status] = r._count._all;
  }
  return statusCounts;
}

export async function getAtRiskCount(): Promise<number> {
  return prisma.case.count({
    where: { state: 'Open', isAtRisk: true, isBreached: false },
  });
}

export async function getBreachedCount(): Promise<number> {
  return prisma.case.count({
    where: { state: 'Open', isBreached: true },
  });
}

export async function getCasesByChannel() {
  const results = await prisma.case.groupBy({
    by: ['channel'],
    _count: { _all: true },
  });
  const channelCounts: Record<string, number> = {};
  for (const r of results) {
    channelCounts[r.channel || 'Unknown'] = r._count._all;
  }
  return channelCounts;
}

export async function getAvgFirstResponseMs(): Promise<number | null> {
  const cases = await prisma.case.findMany({
    where: { firstResponseAt: { not: null } },
    select: { dateCreated: true, firstResponseAt: true },
    take: 1000,
  });
  if (cases.length === 0) return null;
  const totalMs = cases.reduce((sum, c) => {
    return sum + (c.firstResponseAt!.getTime() - c.dateCreated.getTime());
  }, 0);
  return totalMs / cases.length;
}

export async function getTopCategories(limit: number = 10) {
  const results = await prisma.case.groupBy({
    by: ['category'],
    where: { category: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { category: 'desc' } },
    take: limit,
  });
  return results.map(r => ({
    category: r.category!,
    count: r._count._all,
  }));
}

export async function getCasesPerAgent() {
  const results = await prisma.case.groupBy({
    by: ['assignedUserId'],
    where: { state: 'Open', assignedUserId: { not: null } },
    _count: { _all: true },
  });

  const agentIds = results.map(r => r.assignedUserId!);
  const agents = await prisma.agentRef.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true },
  });
  const agentMap = new Map(agents.map(a => [a.id, a.name]));

  return results.map(r => ({
    agentId: r.assignedUserId!,
    agentName: agentMap.get(r.assignedUserId!) || 'Unknown',
    count: r._count._all,
  }));
}
