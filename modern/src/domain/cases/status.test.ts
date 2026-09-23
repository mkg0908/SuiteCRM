import { describe, it, expect } from 'vitest';
import {
  deriveStateFromStatus,
  isValidTransition,
  assertValidTransition,
  TransitionConflictError,
  formatCaseNumber,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from './status.js';

describe('deriveStateFromStatus', () => {
  it('returns Open for Open_New', () => expect(deriveStateFromStatus('Open_New')).toBe('Open'));
  it('returns Open for Open_Assigned', () => expect(deriveStateFromStatus('Open_Assigned')).toBe('Open'));
  it('returns Open for Open_Pending Input', () => expect(deriveStateFromStatus('Open_Pending Input')).toBe('Open'));
  it('returns Closed for Closed_Closed', () => expect(deriveStateFromStatus('Closed_Closed')).toBe('Closed'));
  it('returns Closed for Closed_Rejected', () => expect(deriveStateFromStatus('Closed_Rejected')).toBe('Closed'));
  it('returns Closed for Closed_Duplicate', () => expect(deriveStateFromStatus('Closed_Duplicate')).toBe('Closed'));
});

describe('STATUS_LABELS', () => {
  it('maps all legacy statuses', () => {
    expect(STATUS_LABELS['Open_New']).toBe('New');
    expect(STATUS_LABELS['Open_Assigned']).toBe('Assigned');
    expect(STATUS_LABELS['Open_Pending Input']).toBe('Pending Input');
    expect(STATUS_LABELS['Closed_Closed']).toBe('Closed');
    expect(STATUS_LABELS['Closed_Rejected']).toBe('Rejected');
    expect(STATUS_LABELS['Closed_Duplicate']).toBe('Duplicate');
  });
});

describe('PRIORITY_LABELS', () => {
  it('maps all priorities', () => {
    expect(PRIORITY_LABELS['P1']).toContain('P1');
    expect(PRIORITY_LABELS['P2']).toContain('P2');
    expect(PRIORITY_LABELS['P3']).toContain('P3');
  });
});

describe('formatCaseNumber', () => {
  it('formats CF-1001', () => expect(formatCaseNumber(1001)).toBe('CF-1001'));
  it('formats CF-0001', () => expect(formatCaseNumber(1)).toBe('CF-0001'));
  it('formats CF-9999', () => expect(formatCaseNumber(9999)).toBe('CF-9999'));
});

describe('isValidTransition', () => {
  it('allows Open_New -> Open_Assigned', () => expect(isValidTransition('Open_New', 'Open_Assigned')).toBe(true));
  it('allows Open_Assigned -> Closed_Closed', () => expect(isValidTransition('Open_Assigned', 'Closed_Closed')).toBe(true));
  it('rejects Open_New -> Open_Pending Input (the known defect)', () => {
    expect(isValidTransition('Open_New', 'Open_Pending Input')).toBe(false);
  });
  it('rejects Closed_Closed -> Open_New', () => expect(isValidTransition('Closed_Closed', 'Open_New')).toBe(false));
  it('rejects Closed_Rejected -> anything', () => {
    expect(isValidTransition('Closed_Rejected', 'Open_New')).toBe(false);
    expect(isValidTransition('Closed_Rejected', 'Open_Assigned')).toBe(false);
  });
});

describe('assertValidTransition', () => {
  it('throws TransitionConflictError for Open_New -> Open_Pending Input', () => {
    expect(() => assertValidTransition('Open_New', 'Open_Pending Input')).toThrow(TransitionConflictError);
    try {
      assertValidTransition('Open_New', 'Open_Pending Input');
    } catch (e) {
      expect(e).toBeInstanceOf(TransitionConflictError);
      expect((e as TransitionConflictError).code).toBe('transition_conflict');
      expect((e as TransitionConflictError).from).toBe('Open_New');
      expect((e as TransitionConflictError).to).toBe('Open_Pending Input');
    }
  });
  it('does not throw for allowed transition', () => {
    expect(() => assertValidTransition('Open_New', 'Open_Assigned')).not.toThrow();
  });
});
