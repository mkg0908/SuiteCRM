import prisma from './prismaClient.js';

const LIST_SELECT = {
  id: true,
  caseNumber: true,
  subject: true,
  priority: true,
  status: true,
  state: true,
  type: true,
  channel: true,
  category: true,
  assignedUserId: true,
  customerEmail: true,
  customerPhone: true,
  isAtRisk: true,
  isBreached: true,
  slaDueAt: true,
  dateCreated: true,
  dateModified: true,
};

const DETAIL_SELECT = {
  id: true,
  caseNumber: true,
  subject: true,
  description: true,
  priority: true,
  status: true,
  state: true,
  type: true,
  channel: true,
  category: true,
  accountId: true,
  assignedUserId: true,
  resolution: true,
  customerEmail: true,
  customerPhone: true,
  normalizedSubject: true,
  duplicateOf: true,
  slaDueAt: true,
  firstResponseAt: true,
  isAtRisk: true,
  isBreached: true,
  dateCreated: true,
  dateModified: true,
  updates: {
    select: {
      id: true,
      author: true,
      text: true,
      internal: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  auditEvents: {
    select: {
      id: true,
      user: true,
      field: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export interface CaseListParams {
  search?: string;
  status?: string;
  priority?: string;
  channel?: string;
  assignedUserId?: string;
  page: number;
  pageSize: number;
}

export async function listCases(params: CaseListParams) {
  const { search, status, priority, channel, assignedUserId, page, pageSize } = params;
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { caseNumber: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (channel) where.channel = channel;
  if (assignedUserId) where.assignedUserId = assignedUserId;

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { dateModified: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.case.count({ where }),
  ]);

  return { cases, total, page, pageSize };
}

export async function findByCaseNumber(caseNumber: string) {
  return prisma.case.findUnique({
    where: { caseNumber },
    select: DETAIL_SELECT,
  });
}

export async function createCase(data: {
  caseNumber: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  state: string;
  type?: string;
  channel?: string;
  category?: string;
  customerEmail?: string;
  customerPhone?: string;
  normalizedSubject?: string;
  accountId?: string;
  assignedUserId: string;
  slaDueAt?: Date;
  duplicateOf?: string;
}) {
  return prisma.case.create({ data, select: DETAIL_SELECT });
}

export async function updateCase(caseNumber: string, data: Record<string, unknown>) {
  return prisma.case.update({ where: { caseNumber }, data, select: DETAIL_SELECT });
}

export async function getNextCaseSequence(): Promise<number> {
  const lastCase = await prisma.case.findFirst({
    orderBy: { caseNumber: 'desc' },
    select: { caseNumber: true },
  });
  if (!lastCase) return 1001;
  const num = parseInt(lastCase.caseNumber.replace('CF-', ''), 10);
  return num + 1;
}

export async function findDuplicateCandidates(customerEmail: string, since: Date) {
  return prisma.case.findMany({
    where: {
      customerEmail: { equals: customerEmail, mode: 'insensitive' },
      state: 'Open',
      dateCreated: { gte: since },
    },
    select: {
      caseNumber: true,
      subject: true,
      normalizedSubject: true,
      customerEmail: true,
      dateCreated: true,
      status: true,
    },
  });
}
