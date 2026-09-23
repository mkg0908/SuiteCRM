const DUPLICATE_WINDOW_MS = 48 * 60 * 60 * 1000;

export function normalizeSubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface DuplicateCandidate {
  caseNumber: string;
  subject: string;
  normalizedSubject: string;
  customerEmail: string;
  dateCreated: Date;
  status: string;
}

export function findDuplicate(
  newSubject: string,
  newCustomerEmail: string,
  newCreatedAt: Date,
  existingCases: DuplicateCandidate[],
): DuplicateCandidate | null {
  const normalizedNew = normalizeSubject(newSubject);
  const emailLower = newCustomerEmail.toLowerCase();

  for (const existing of existingCases) {
    if (existing.status.startsWith('Closed')) continue;
    if (existing.customerEmail.toLowerCase() !== emailLower) continue;
    const timeDiff = Math.abs(newCreatedAt.getTime() - existing.dateCreated.getTime());
    if (timeDiff > DUPLICATE_WINDOW_MS) continue;
    if (existing.normalizedSubject === normalizedNew) {
      return existing;
    }
  }

  return null;
}
