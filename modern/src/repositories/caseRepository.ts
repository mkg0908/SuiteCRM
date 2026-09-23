/**
 * Case repository - projection-first, parameterized, paginated
 * No Prisma direct access outside this module
 */
import { getPrismaClient } from './prismaClient.js';
import { deriveStateFromStatus } from '../domain/cases/status.js';
import type { CaseStatus, CasePriority } from '../contracts/caseSchemas.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/** List projection - excludes PII fields */
const LIST_SELECT = {
  id: true,
  caseNumber: true,
  subject: true,
  priority: true,
  status: true,
  state: true,
  channel: true,
  category: true,
  type: true,
  dateCreated: true,
  dateModified: true,
  slaDueAt: true,
  firstResponseAt: true,
  isAtRisk: true,
  isBreached: true,
  duplicateOf: true,
  accountId: true,
  assignedUserId: true,
  assignedAgent: { select: { id: true, name: true, email: true, isActive: true } },
  account: { select: { id: true, name: true, domain: true } },
} as const;

const DETAIL_SELECT = {
  ...LIST_SELECT,
  description: true,
  resolution: true,
  customerEmail: true,
  customerPhone: true,
  normalizedSubject: true,
  updates: {
    orderBy: { timestamp: 'asc' as const },
    select: { id: true, caseId: true, author: true, text: true, timestamp: true, internal: true },
  },
  auditEvents: {
    orderBy: { timestamp: 'asc' as const },
    select: { id: true, caseId: true, userId: true, timestamp: true, field: true, oldValue: true, newValue: true, action: true },
  },
} as const;

export interface CaseListFilter {
  search?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  channel?: string;
  page?: number;
  pageSize?: number;
}

export async function listCases(filter: CaseListFilter = {}) {
  const prisma = getPrismaClient();
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filter.pageSize ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (filter.status) where['status'] = filter.status;
  if (filter.priority) where['priority'] = filter.priority;
  if (filter.channel) where['channel'] = filter.channel;
  if (filter.search) {
    where['OR'] = [
      { subject: { contains: filter.search, mode: 'insensitive' } },
      { caseNumber: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { dateModified: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.case.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getCaseByNumber(caseNumber: string) {
  const prisma = getPrismaClient();
  return prisma.case.findUnique({
    where: { caseNumber },
    select: DETAIL_SELECT,
  });
}

export async function getCaseById(id: string) {
  const prisma = getPrismaClient();
  return prisma.case.findUnique({
    where: { id },
    select: DETAIL_SELECT,
  });
}

export interface CreateCaseInput {
  caseNumber: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  channel?: string;
  category?: string;
  type?: string;
  accountId?: string;
  assignedUserId?: string;
  customerEmail?: string;
  customerPhone?: string;
  normalizedSubject?: string;
  slaDueAt?: Date;
}

export async function createCase(input: CreateCaseInput) {
  const prisma = getPrismaClient();
  const state = deriveStateFromStatus(input.status as CaseStatus);

  return prisma.case.create({
    data: {
      caseNumber: input.caseNumber,
      subject: input.subject,
      description: input.description,
      priority: input.priority as 'P1' | 'P2' | 'P3',
      status: input.status as 'Open_New',
      state: state as 'Open' | 'Closed',
      channel: (input.channel ?? 'Manual') as 'Email' | 'WhatsApp' | 'Phone' | 'Portal' | 'Manual',
      category: input.category,
      type: input.type,
      accountId: input.accountId,
      assignedUserId: input.assignedUserId,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      normalizedSubject: input.normalizedSubject,
      slaDueAt: input.slaDueAt,
    },
    select: DETAIL_SELECT,
  });
}

export interface UpdateCaseInput {
  subject?: string;
  description?: string;
  priority?: string;
  category?: string;
  type?: string;
  resolution?: string;
  accountId?: string;
  assignedUserId?: string;
  status?: string;
  state?: string;
  slaDueAt?: Date;
  firstResponseAt?: Date;
  isAtRisk?: boolean;
  isBreached?: boolean;
  duplicateOf?: string;
}

export async function updateCase(caseNumber: string, input: UpdateCaseInput) {
  const prisma = getPrismaClient();

  const updateData: Record<string, unknown> = { ...input };
  if (input.status) {
    updateData['state'] = deriveStateFromStatus(input.status as CaseStatus);
  }

  return prisma.case.update({
    where: { caseNumber },
    data: updateData as Parameters<typeof prisma.case.update>[0]['data'],
    select: DETAIL_SELECT,
  });
}

export async function getNextCaseSequence(): Promise<number> {
  const prisma = getPrismaClient();
  const latest = await prisma.case.findFirst({
    select: { displaySequence: true },
    orderBy: { displaySequence: 'desc' },
  });
  return (latest?.displaySequence ?? 1000) + 1;
}

export async function findDuplicateCandidate(
  customerEmail: string,
  normalizedSubject: string,
  withinHours: number = 48,
) {
  const prisma = getPrismaClient();
  const since = new Date(Date.now() - withinHours * 3600000);
  return prisma.case.findFirst({
    where: {
      customerEmail: { equals: customerEmail, mode: 'insensitive' },
      normalizedSubject: { equals: normalizedSubject, mode: 'insensitive' },
      dateCreated: { gte: since },
      state: 'Open',
    },
    select: { id: true, caseNumber: true, subject: true, status: true },
  });
}
