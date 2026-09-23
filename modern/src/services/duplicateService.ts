import { findDuplicateCandidate } from '../repositories/caseRepository.js';

/** Normalize subject for duplicate matching - case-insensitive, punctuation-stripped */
export function normalizeSubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function findDuplicate(customerEmail: string, subject: string, withinHours = 48) {
  const normalized = normalizeSubject(subject);
  return findDuplicateCandidate(customerEmail, normalized, withinHours);
}
