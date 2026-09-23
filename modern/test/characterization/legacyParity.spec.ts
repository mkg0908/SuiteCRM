/**
 * Characterization tests encoding legacy Cases/AOP_Case_Updates expectations
 * These tests define the parity contract BEFORE runtime implementation
 */

import { describe, it, expect } from 'vitest';
import {
  CASE_STATUSES,
  CASE_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  deriveStateFromStatus,
  isValidTransition,
  assertValidTransition,
  TransitionConflictError,
  formatCaseNumber,
} from '../../src/domain/cases/status.js';
import parityNotes from '../fixtures/parity-notes.json';

describe('Legacy Status Values (from modules/Cases/vardefs.php)', () => {
  it('preserves all 6 legacy status values exactly', () => {
    const legacyStatuses = parityNotes.preservedStatuses;
    legacyStatuses.forEach((s: string) => {
      expect(CASE_STATUSES).toContain(s);
    });
    expect(CASE_STATUSES).toHaveLength(6);
  });

  it('includes Open_New', () => expect(CASE_STATUSES).toContain('Open_New'));
  it('includes Open_Assigned', () => expect(CASE_STATUSES).toContain('Open_Assigned'));
  it('includes Open_Pending Input (with space)', () => expect(CASE_STATUSES).toContain('Open_Pending Input'));
  it('includes Closed_Closed', () => expect(CASE_STATUSES).toContain('Closed_Closed'));
  it('includes Closed_Rejected', () => expect(CASE_STATUSES).toContain('Closed_Rejected'));
  it('includes Closed_Duplicate', () => expect(CASE_STATUSES).toContain('Closed_Duplicate'));
});

describe('Legacy Priority Values', () => {
  it('preserves P1, P2, P3 priorities', () => {
    expect(CASE_PRIORITIES).toContain('P1');
    expect(CASE_PRIORITIES).toContain('P2');
    expect(CASE_PRIORITIES).toContain('P3');
    expect(CASE_PRIORITIES).toHaveLength(3);
  });
});

describe('Status Label Mapping', () => {
  it('has labels for all 6 statuses', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(6);
  });
});

describe('Priority Label Mapping', () => {
  it('has labels for all 3 priorities', () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(3);
  });
});

describe('State Derivation (the legacy defect prevention)', () => {
  it('derives Open state from all Open_* statuses', () => {
    expect(deriveStateFromStatus('Open_New')).toBe('Open');
    expect(deriveStateFromStatus('Open_Assigned')).toBe('Open');
    expect(deriveStateFromStatus('Open_Pending Input')).toBe('Open');
  });

  it('derives Closed state from all Closed_* statuses', () => {
    expect(deriveStateFromStatus('Closed_Closed')).toBe('Closed');
    expect(deriveStateFromStatus('Closed_Rejected')).toBe('Closed');
    expect(deriveStateFromStatus('Closed_Duplicate')).toBe('Closed');
  });

  it('PREVENTS the legacy defect: Closed_* with state=Open is impossible', () => {
    // The legacy defect: 35 cases had Closed_* status with state=Open
    // CaseFlow MUST derive state from status, making this impossible
    const closedStatuses = ['Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate'] as const;
    closedStatuses.forEach((s) => {
      expect(deriveStateFromStatus(s)).toBe('Closed');
      expect(deriveStateFromStatus(s)).not.toBe('Open');
    });
  });
});

describe('Allowed Transition Matrix', () => {
  // From parity notes
  it('allows Open_New -> Open_Assigned', () => expect(isValidTransition('Open_New', 'Open_Assigned')).toBe(true));
  it('allows Open_New -> Closed_Rejected', () => expect(isValidTransition('Open_New', 'Closed_Rejected')).toBe(true));
  it('allows Open_Assigned -> Open_Pending Input', () => expect(isValidTransition('Open_Assigned', 'Open_Pending Input')).toBe(true));
  it('allows Open_Assigned -> Closed_Closed', () => expect(isValidTransition('Open_Assigned', 'Closed_Closed')).toBe(true));
  it('allows Open_Assigned -> Closed_Rejected', () => expect(isValidTransition('Open_Assigned', 'Closed_Rejected')).toBe(true));
  it('allows Open_Assigned -> Closed_Duplicate', () => expect(isValidTransition('Open_Assigned', 'Closed_Duplicate')).toBe(true));
  it('allows Open_Pending Input -> Open_Assigned', () => expect(isValidTransition('Open_Pending Input', 'Open_Assigned')).toBe(true));
  it('allows Open_Pending Input -> Closed_Closed', () => expect(isValidTransition('Open_Pending Input', 'Closed_Closed')).toBe(true));
  it('allows Open_Pending Input -> Closed_Rejected', () => expect(isValidTransition('Open_Pending Input', 'Closed_Rejected')).toBe(true));
});

describe('Rejected Transitions', () => {
  it('rejects Open_New -> Open_Pending Input (the known bad transition)', () => {
    expect(isValidTransition('Open_New', 'Open_Pending Input')).toBe(false);
  });
  it('rejects Closed_* -> any Open_* (no reopening)', () => {
    expect(isValidTransition('Closed_Closed', 'Open_New')).toBe(false);
    expect(isValidTransition('Closed_Rejected', 'Open_Assigned')).toBe(false);
    expect(isValidTransition('Closed_Duplicate', 'Open_Pending Input')).toBe(false);
  });
  it('assertValidTransition throws TransitionConflictError for invalid transitions', () => {
    expect(() => assertValidTransition('Open_New', 'Open_Pending Input')).toThrow(TransitionConflictError);
  });
  it('TransitionConflictError has code=transition_conflict', () => {
    try {
      assertValidTransition('Open_New', 'Open_Pending Input');
    } catch (e) {
      expect((e as TransitionConflictError).code).toBe('transition_conflict');
    }
  });
});

describe('CF Case Number Formatting', () => {
  it('formats CF-1001 from sequence 1001', () => expect(formatCaseNumber(1001)).toBe('CF-1001'));
  it('formats CF-0001 from sequence 1', () => expect(formatCaseNumber(1)).toBe('CF-0001'));
});

describe('Threaded Update Parity (from CaseUpdatesHook.php)', () => {
  const preservedFields = parityNotes.preservedFields;

  it('defines author field', () => {
    expect(preservedFields.author).toBeDefined();
  });
  it('defines text field', () => {
    expect(preservedFields.text).toBeDefined();
  });
  it('defines timestamp field', () => {
    expect(preservedFields.timestamp).toBeDefined();
  });
  it('defines internal flag field', () => {
    expect(preservedFields.internal).toBeDefined();
  });
});
