import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deriveStateFromStatus } from '../../src/domain/cases/status.js';
import type { CaseStatus } from '../../src/domain/cases/status.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(__dirname, '../../seed/legacy-cases.json');
const EXPECTED_FILE = join(__dirname, '../../seed/legacy-cases.expected.json');

interface LegacyCase {
  case_number: string;
  subject: string;
  status: string;
  state: string;
  priority: string;
  customer_email?: string;
  customer_phone?: string;
}

interface Expected {
  totalRows: number;
  statusCounts: Record<string, number>;
  legacyDefectCount: number;
}

const cases: LegacyCase[] = JSON.parse(readFileSync(SEED_FILE, 'utf-8'));
const expected: Expected = JSON.parse(readFileSync(EXPECTED_FILE, 'utf-8'));

describe('Seed fixture validation', () => {
  it('has exactly 50 cases', () => {
    expect(cases).toHaveLength(50);
    expect(cases).toHaveLength(expected.totalRows);
  });

  it('has correct per-status counts', () => {
    const counts: Record<string, number> = {};
    for (const c of cases) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    for (const [status, count] of Object.entries(expected.statusCounts)) {
      expect(counts[status]).toBe(count);
    }
  });

  it('has 35 closed-status/Open-state legacy defect cases', () => {
    const defects = cases.filter((c) => c.status.startsWith('Closed_') && c.state === 'Open');
    expect(defects).toHaveLength(35);
    expect(defects).toHaveLength(expected.legacyDefectCount);
  });

  it('CaseFlow derives Closed state for all Closed_* cases (fixing the defect)', () => {
    const closedCases = cases.filter((c) => c.status.startsWith('Closed_'));
    for (const c of closedCases) {
      const derivedState = deriveStateFromStatus(c.status as CaseStatus);
      expect(derivedState).toBe('Closed');
      expect(derivedState).not.toBe('Open');
    }
  });

  it('contains priya@riverahotels.com', () => {
    const has = cases.some((c) => c.customer_email === 'priya@riverahotels.com');
    expect(has).toBe(true);
  });

  it('contains 415-555-0142', () => {
    const has = cases.some((c) => c.customer_phone === '415-555-0142');
    expect(has).toBe(true);
  });

  it('all cases have valid statuses', () => {
    const valid = ['Open_New', 'Open_Assigned', 'Open_Pending Input', 'Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate'];
    for (const c of cases) {
      expect(valid).toContain(c.status);
    }
  });

  it('all cases have valid priorities', () => {
    const valid = ['P1', 'P2', 'P3'];
    for (const c of cases) {
      expect(valid).toContain(c.priority);
    }
  });
});
