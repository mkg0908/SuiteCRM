/**
 * CaseFlow legacy case import script
 * Reads modern/seed/legacy-cases.json, validates 50 rows, derives state from status
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPrismaClient, disconnectPrisma } from '../src/repositories/prismaClient.js';
import { deriveStateFromStatus, isValidStatus, isValidPriority, formatCaseNumber } from '../src/domain/cases/status.js';
import { computeSlaDueAt } from '../src/domain/sla/slaService.js';
import { normalizeSubject } from '../src/services/duplicateService.js';
import { redactPii } from '../src/observability/logger.js';
import type { CaseStatus } from '../src/domain/cases/status.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(__dirname, '../seed/legacy-cases.json');
const EXPECTED_FILE = join(__dirname, '../seed/legacy-cases.expected.json');

interface LegacyCase {
  case_number: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  state: string; // legacy - will be overridden
  channel?: string;
  category?: string;
  customer_email?: string;
  customer_phone?: string;
  account_name?: string;
  assigned_user_name?: string;
  date_created?: string;
  date_modified?: string;
}

interface ExpectedCounts {
  totalRows: number;
  statusCounts: Record<string, number>;
}

async function main() {
  console.log('Starting legacy case import...');

  // Load seed data
  let cases: LegacyCase[];
  try {
    cases = JSON.parse(readFileSync(SEED_FILE, 'utf-8')) as LegacyCase[];
  } catch (err) {
    console.error('Failed to read seed file:', SEED_FILE);
    process.exit(1);
  }

  // Validate exactly 50 rows
  if (cases.length !== 50) {
    console.error(`ERROR: Expected exactly 50 cases, got ${cases.length}`);
    process.exit(1);
  }

  // Load expected counts
  let expected: ExpectedCounts;
  try {
    expected = JSON.parse(readFileSync(EXPECTED_FILE, 'utf-8')) as ExpectedCounts;
  } catch (err) {
    console.error('Failed to read expected file:', EXPECTED_FILE);
    process.exit(1);
  }

  // Validate statuses and priorities
  const errors: string[] = [];
  for (const c of cases) {
    if (!isValidStatus(c.status)) {
      errors.push(`Unknown status: ${c.status} in case ${c.case_number}`);
    }
    if (!isValidPriority(c.priority)) {
      errors.push(`Unknown priority: ${c.priority} in case ${c.case_number}`);
    }
  }

  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }

  // Count per-status
  const actualCounts: Record<string, number> = {};
  for (const c of cases) {
    actualCounts[c.status] = (actualCounts[c.status] ?? 0) + 1;
  }

  // Compare with expected
  for (const [status, count] of Object.entries(expected.statusCounts)) {
    if (actualCounts[status] !== count) {
      console.error(`Status count mismatch for ${status}: expected ${count}, got ${actualCounts[status] ?? 0}`);
      process.exit(1);
    }
  }

  console.log('Validation passed. Importing cases...');

  const prisma = getPrismaClient();
  let imported = 0;
  let skipped = 0;

  for (const c of cases) {
    try {
      // Check if already imported (idempotent)
      const existing = await prisma.case.findUnique({ where: { caseNumber: c.case_number }, select: { id: true } });
      if (existing) {
        skipped++;
        continue;
      }

      const status = c.status as CaseStatus;
      // CRITICAL: derive state from status, ignoring legacy state value
      const state = deriveStateFromStatus(status);
      const dateCreated = c.date_created ? new Date(c.date_created) : new Date();
      const slaDueAt = computeSlaDueAt(c.priority, dateCreated);

      await prisma.case.create({
        data: {
          caseNumber: c.case_number,
          subject: c.subject,
          description: c.description,
          priority: c.priority as 'P1' | 'P2' | 'P3',
          status: status as 'Open_New',
          state: state as 'Open' | 'Closed',
          channel: (c.channel ?? 'Manual') as 'Email' | 'WhatsApp' | 'Phone' | 'Portal' | 'Manual',
          category: c.category,
          customerEmail: c.customer_email,
          customerPhone: c.customer_phone,
          normalizedSubject: normalizeSubject(c.subject),
          dateCreated,
          slaDueAt,
        },
      });
      imported++;
    } catch (err) {
      console.error(`Failed to import case ${c.case_number}:`, err instanceof Error ? err.message : err);
    }
  }

  // Emit PII-redacted validation report
  const report = {
    imported,
    skipped,
    total: cases.length,
    statusCounts: actualCounts,
    legacyDefectsCorrected: cases.filter(
      (c) => c.status.startsWith('Closed_') && c.state === 'Open',
    ).length,
  };

  console.log('Import complete:', JSON.stringify(report, null, 2));

  // Verify closed cases have correct state
  const closedWithOpenState = await prisma.case.count({
    where: { status: { in: ['Closed_Closed' as 'Closed_Closed', 'Closed_Rejected' as 'Closed_Rejected', 'Closed_Duplicate' as 'Closed_Duplicate'] }, state: 'Open' as 'Open' },
  });

  if (closedWithOpenState > 0) {
    console.error(`ERROR: ${closedWithOpenState} closed cases still have state=Open`);
    await disconnectPrisma();
    process.exit(1);
  }

  console.log('State verification passed - no Closed_* cases with Open state');
  await disconnectPrisma();
}

main().catch((err) => {
  console.error('Import failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
