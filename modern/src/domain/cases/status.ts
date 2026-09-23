/**
 * CaseFlow domain: legacy status values, priority labels, state derivation, transitions
 */

export const CASE_STATUSES = [
  'Open_New',
  'Open_Assigned',
  'Open_Pending Input',
  'Closed_Closed',
  'Closed_Rejected',
  'Closed_Duplicate',
] as const;

export type CaseStatus = typeof CASE_STATUSES[number];

export const CASE_PRIORITIES = ['P1', 'P2', 'P3'] as const;
export type CasePriority = typeof CASE_PRIORITIES[number];

export const CASE_STATES = ['Open', 'Closed'] as const;
export type CaseState = typeof CASE_STATES[number];

export const STATUS_LABELS: Record<CaseStatus, string> = {
  'Open_New': 'New',
  'Open_Assigned': 'Assigned',
  'Open_Pending Input': 'Pending Input',
  'Closed_Closed': 'Closed',
  'Closed_Rejected': 'Rejected',
  'Closed_Duplicate': 'Duplicate',
};

export const PRIORITY_LABELS: Record<CasePriority, string> = {
  P1: 'P1 - Critical',
  P2: 'P2 - High',
  P3: 'P3 - Normal',
};

/** Derive state from status - the ONLY authoritative state derivation */
export function deriveStateFromStatus(status: CaseStatus): CaseState {
  return status.startsWith('Closed_') ? 'Closed' : 'Open';
}

/** Allowed transitions matrix */
const TRANSITIONS: Partial<Record<CaseStatus, CaseStatus[]>> = {
  'Open_New': ['Open_Assigned', 'Closed_Rejected'],
  'Open_Assigned': ['Open_Pending Input', 'Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate'],
  'Open_Pending Input': ['Open_Assigned', 'Closed_Closed', 'Closed_Rejected'],
  'Closed_Closed': [],
  'Closed_Rejected': [],
  'Closed_Duplicate': [],
};

export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  const allowed = TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

export class TransitionConflictError extends Error {
  readonly code = 'transition_conflict';
  constructor(
    public readonly from: CaseStatus,
    public readonly to: CaseStatus,
  ) {
    super(`Transition from ${from} to ${to} is not allowed`);
    this.name = 'TransitionConflictError';
  }
}

export function assertValidTransition(from: CaseStatus, to: CaseStatus): void {
  if (!isValidTransition(from, to)) {
    throw new TransitionConflictError(from, to);
  }
}

/** Format a display case number from a sequence integer */
export function formatCaseNumber(sequence: number): string {
  return `CF-${String(sequence).padStart(4, '0')}`;
}

export function isValidStatus(value: unknown): value is CaseStatus {
  return CASE_STATUSES.includes(value as CaseStatus);
}

export function isValidPriority(value: unknown): value is CasePriority {
  return CASE_PRIORITIES.includes(value as CasePriority);
}
