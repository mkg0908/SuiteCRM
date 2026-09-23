import { describe, it, expect } from 'vitest';
import { deriveStateFromStatus, isTransitionAllowed, STATUSES } from '../../src/domain/cases/status.js';

describe('legacy parity characterization', () => {
  describe('status values preserved from legacy', () => {
    for (const status of ['Open_New', 'Open_Assigned', 'Open_Pending Input', 'Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate']) {
      it(`preserves legacy status value: ${status}`, () => expect(STATUSES).toContain(status));
    }
  });

  describe('state derivation matches legacy PHP behavior', () => {
    it('Open_New -> Open', () => expect(deriveStateFromStatus('Open_New')).toBe('Open'));
    it('Closed_Rejected -> Closed', () => expect(deriveStateFromStatus('Closed_Rejected')).toBe('Closed'));
    it('Open_Pending Input -> Open', () => expect(deriveStateFromStatus('Open_Pending Input')).toBe('Open'));
  });

  describe('allowed transitions', () => {
    const allowed: [string, string][] = [
      ['Open_New', 'Open_Assigned'], ['Open_New', 'Closed_Rejected'], ['Open_New', 'Closed_Duplicate'],
      ['Open_Assigned', 'Open_Pending Input'], ['Open_Assigned', 'Closed_Closed'], ['Open_Assigned', 'Closed_Rejected'],
      ['Open_Pending Input', 'Open_Assigned'], ['Open_Pending Input', 'Closed_Closed'],
      ['Closed_Closed', 'Open_Assigned'], ['Closed_Rejected', 'Open_Assigned'],
    ];
    for (const [from, to] of allowed) {
      it(`allows ${from} -> ${to}`, () => expect(isTransitionAllowed(from as any, to as any)).toBe(true));
    }
  });

  describe('rejected transitions', () => {
    const rejected: [string, string][] = [
      ['Open_New', 'Open_Pending Input'], ['Open_New', 'Closed_Closed'],
      ['Open_Assigned', 'Open_New'], ['Open_Assigned', 'Closed_Duplicate'],
      ['Open_Pending Input', 'Closed_Rejected'], ['Open_Pending Input', 'Open_New'],
      ['Closed_Duplicate', 'Open_Assigned'], ['Closed_Duplicate', 'Open_New'], ['Closed_Closed', 'Open_New'],
    ];
    for (const [from, to] of rejected) {
      it(`rejects ${from} -> ${to}`, () => expect(isTransitionAllowed(from as any, to as any)).toBe(false));
    }
  });
});
