import { describe, it, expect } from 'vitest';
import {
  deriveStateFromStatus,
  getStatusLabel,
  getPriorityLabel,
  formatCaseNumber,
  isTransitionAllowed,
  isValidStatus,
  isValidPriority,
} from './status.js';

describe('status domain', () => {
  describe('deriveStateFromStatus', () => {
    it('derives Open from Open_New', () => expect(deriveStateFromStatus('Open_New')).toBe('Open'));
    it('derives Open from Open_Assigned', () => expect(deriveStateFromStatus('Open_Assigned')).toBe('Open'));
    it('derives Open from Open_Pending Input', () => expect(deriveStateFromStatus('Open_Pending Input')).toBe('Open'));
    it('derives Closed from Closed_Closed', () => expect(deriveStateFromStatus('Closed_Closed')).toBe('Closed'));
    it('derives Closed from Closed_Rejected', () => expect(deriveStateFromStatus('Closed_Rejected')).toBe('Closed'));
    it('derives Closed from Closed_Duplicate', () => expect(deriveStateFromStatus('Closed_Duplicate')).toBe('Closed'));
    it('throws on unknown status', () => expect(() => deriveStateFromStatus('Invalid_Status')).toThrow());
  });

  describe('getStatusLabel', () => {
    it('returns New for Open_New', () => expect(getStatusLabel('Open_New')).toBe('New'));
    it('returns Pending Input', () => expect(getStatusLabel('Open_Pending Input')).toBe('Pending Input'));
    it('returns Rejected', () => expect(getStatusLabel('Closed_Rejected')).toBe('Rejected'));
  });

  describe('getPriorityLabel', () => {
    it('returns Critical for P1', () => expect(getPriorityLabel('P1')).toBe('Critical'));
    it('returns High for P2', () => expect(getPriorityLabel('P2')).toBe('High'));
    it('returns Normal for P3', () => expect(getPriorityLabel('P3')).toBe('Normal'));
  });

  describe('formatCaseNumber', () => {
    it('formats CF-1001', () => expect(formatCaseNumber(1001)).toBe('CF-1001'));
    it('pads to 4 digits', () => expect(formatCaseNumber(1)).toBe('CF-0001'));
    it('handles large numbers', () => expect(formatCaseNumber(10001)).toBe('CF-10001'));
  });

  describe('isTransitionAllowed', () => {
    it('allows New -> Assigned', () => expect(isTransitionAllowed('Open_New', 'Open_Assigned')).toBe(true));
    it('allows New -> Rejected', () => expect(isTransitionAllowed('Open_New', 'Closed_Rejected')).toBe(true));
    it('allows New -> Duplicate', () => expect(isTransitionAllowed('Open_New', 'Closed_Duplicate')).toBe(true));
    it('rejects New -> Pending Input', () => expect(isTransitionAllowed('Open_New', 'Open_Pending Input')).toBe(false));
    it('allows Assigned -> Pending Input', () => expect(isTransitionAllowed('Open_Assigned', 'Open_Pending Input')).toBe(true));
    it('allows Assigned -> Closed', () => expect(isTransitionAllowed('Open_Assigned', 'Closed_Closed')).toBe(true));
    it('allows Closed -> Assigned (reopen)', () => expect(isTransitionAllowed('Closed_Closed', 'Open_Assigned')).toBe(true));
    it('rejects Duplicate -> anything', () => expect(isTransitionAllowed('Closed_Duplicate', 'Open_Assigned')).toBe(false));
    it('allows Pending Input -> Assigned', () => expect(isTransitionAllowed('Open_Pending Input', 'Open_Assigned')).toBe(true));
    it('allows Pending Input -> Closed', () => expect(isTransitionAllowed('Open_Pending Input', 'Closed_Closed')).toBe(true));
  });

  describe('isValidStatus', () => {
    it('validates Open_New', () => expect(isValidStatus('Open_New')).toBe(true));
    it('rejects garbage', () => expect(isValidStatus('NotAStatus')).toBe(false));
  });

  describe('isValidPriority', () => {
    it('validates P1', () => expect(isValidPriority('P1')).toBe(true));
    it('rejects P4', () => expect(isValidPriority('P4')).toBe(false));
  });
});
