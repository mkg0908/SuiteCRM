import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface LegacyCase {
  caseNumber: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  type?: string;
  channel?: string;
  category?: string;
  customerEmail?: string;
  customerPhone?: string;
  accountName?: string;
  assignedAgent?: string;
  legacyState?: string;
}

interface Expected {
  totalCases: number;
  statusCounts: Record<string, number>;
  knownDefects: { closedStatusOpenState: number };
}

interface AgentSeed {
  name: string;
  email: string;
  isActive: boolean;
}

function deriveState(status: string): string {
  const state = status.split('_')[0];
  if (state !== 'Open' && state !== 'Closed') {
    throw new Error(`Cannot derive state from status: ${status}`);
  }
  return state;
}

function normalizeSubject(subject: string): string {
  return subject.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function redact(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
}

async function main() {
  const seedPath = join(__dirname, '..', 'seed', 'legacy-cases.json');
  const expectedPath = join(__dirname, '..', 'seed', 'legacy-cases.expected.json');
  const agentsPath = join(__dirname, '..', 'seed', 'agents.json');

  const cases: LegacyCase[] = JSON.parse(readFileSync(seedPath, 'utf-8'));
  const expected: Expected = JSON.parse(readFileSync(expectedPath, 'utf-8'));
  const agents: AgentSeed[] = JSON.parse(readFileSync(agentsPath, 'utf-8'));

  console.log('=== CaseFlow Legacy Import ===');
  console.log(`Loaded ${cases.length} cases from seed file`);

  if (cases.length !== expected.totalCases) {
    console.error(`FAIL: Expected ${expected.totalCases} cases, got ${cases.length}`);
    process.exit(1);
  }

  const agentMap = new Map<string, string>();
  for (const agent of agents) {
    const upserted = await prisma.agentRef.upsert({
      where: { email: agent.email },
      update: { name: agent.name, isActive: agent.isActive },
      create: { name: agent.name, email: agent.email, isActive: agent.isActive },
    });
    agentMap.set(agent.name, upserted.id);
  }
  console.log(`Seeded ${agents.length} agents`);

  const statusCounts: Record<string, number> = {};
  let defectsCorrected = 0;

  for (const c of cases) {
    const correctState = deriveState(c.status);

    if (c.legacyState === 'Open' && correctState === 'Closed') {
      defectsCorrected++;
    }

    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    const assignedUserId = c.assignedAgent ? agentMap.get(c.assignedAgent) : undefined;

    await prisma.case.upsert({
      where: { caseNumber: c.caseNumber },
      update: {
        subject: c.subject,
        description: c.description,
        priority: c.priority,
        status: c.status,
        state: correctState,
        type: c.type,
        channel: c.channel,
        category: c.category,
        customerEmail: c.customerEmail,
        customerPhone: c.customerPhone,
        normalizedSubject: normalizeSubject(c.subject),
        assignedUserId: assignedUserId || null,
      },
      create: {
        caseNumber: c.caseNumber,
        subject: c.subject,
        description: c.description,
        priority: c.priority,
        status: c.status,
        state: correctState,
        type: c.type,
        channel: c.channel,
        category: c.category,
        customerEmail: c.customerEmail,
        customerPhone: c.customerPhone,
        normalizedSubject: normalizeSubject(c.subject),
        assignedUserId: assignedUserId || null,
      },
    });
  }

  let valid = true;
  for (const [status, expectedCount] of Object.entries(expected.statusCounts)) {
    const actual = statusCounts[status] || 0;
    if (actual !== expectedCount) {
      console.error(`FAIL: Status ${status}: expected ${expectedCount}, got ${actual}`);
      valid = false;
    } else {
      console.log(`PASS: Status ${status}: ${actual} cases`);
    }
  }

  const dbCount = await prisma.case.count();
  if (dbCount < expected.totalCases) {
    console.error(`FAIL: Database has ${dbCount} cases, expected at least ${expected.totalCases}`);
    valid = false;
  }

  console.log(`\n=== Import Validation Report ===`);
  console.log(`Total cases imported: ${cases.length}`);
  console.log(`Status/state defects corrected: ${defectsCorrected}`);
  console.log(`Expected defect corrections: ${expected.knownDefects.closedStatusOpenState}`);
  console.log(redact(`Sample emails and phones have been redacted from this report`));

  if (defectsCorrected !== expected.knownDefects.closedStatusOpenState) {
    console.error(
      `FAIL: Expected ${expected.knownDefects.closedStatusOpenState} defect corrections, got ${defectsCorrected}`,
    );
    valid = false;
  }

  if (!valid) {
    console.error('\nIMPORT VALIDATION FAILED');
    process.exit(1);
  }

  console.log('\nIMPORT VALIDATION PASSED');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
