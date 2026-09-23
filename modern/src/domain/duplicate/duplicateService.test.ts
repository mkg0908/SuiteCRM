import { describe, it, expect } from 'vitest';
import { normalizeSubject, findDuplicate, type DuplicateCandidate } from './duplicateService.js';

describe('duplicate service', () => {
  describe('normalizeSubject', () => {
    it('lowercases', () => expect(normalizeSubject('Payment Page Down!')).toBe('payment page down'));
    it('removes punctuation', () => expect(normalizeSubject('payment page down!!')).toBe('payment page down'));
    it('normalizes whitespace', () => expect(normalizeSubject('payment  page   down')).toBe('payment page down'));
    it('case-insensitive punctuation-insensitive match', () => expect(normalizeSubject('Payment page down!')).toBe(normalizeSubject('payment page down')));
  });

  describe('findDuplicate', () => {
    const now = new Date('2026-09-23T12:00:00Z');
    const candidates: DuplicateCandidate[] = [{
      caseNumber: 'CF-1001', subject: 'Payment page down!', normalizedSubject: 'payment page down',
      customerEmail: 'priya@riverahotels.com', dateCreated: new Date('2026-09-23T10:00:00Z'), status: 'Open_Assigned',
    }];

    it('finds duplicate with matching normalized subject', () => {
      const result = findDuplicate('Payment page down', 'priya@riverahotels.com', now, candidates);
      expect(result).not.toBeNull();
      expect(result!.caseNumber).toBe('CF-1001');
    });

    it('finds duplicate with different case and punctuation', () => {
      expect(findDuplicate('PAYMENT PAGE DOWN!!', 'priya@riverahotels.com', now, candidates)).not.toBeNull();
    });

    it('does not find duplicate from different customer', () => {
      expect(findDuplicate('Payment page down', 'other@email.com', now, candidates)).toBeNull();
    });

    it('does not find duplicate outside 48h window', () => {
      expect(findDuplicate('Payment page down', 'priya@riverahotels.com', new Date('2026-09-26T12:00:00Z'), candidates)).toBeNull();
    });

    it('does not match closed cases', () => {
      expect(findDuplicate('Payment page down', 'priya@riverahotels.com', now, [{ ...candidates[0], status: 'Closed_Closed' }])).toBeNull();
    });
  });
});
