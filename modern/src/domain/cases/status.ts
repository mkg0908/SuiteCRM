export const STATUSES = [
  'Open_New',
  'Open_Assigned',
  'Open_Pending Input',
  'Closed_Closed',
  'Closed_Rejected',
  'Closed_Duplicate',
] as const;

export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['P1', 'P2', 'P3'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  'Open_New': 'New',
  'Open_Assigned': 'Assigned',
  'Open_Pending Input': 'Pending Input',
  'Closed_Closed': 'Closed',
  'Closed_Rejected': 'Rejected',
  'Closed_Duplicate': 'Duplicate',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  P1: 'Critical',
  P2: 'High',
  P3: 'Normal',
};

export function deriveStateFromStatus(status: string): 'Open' | 'Closed' {
  const parts = status.split('_');
  const state = parts[0];
  if (state === 'Open' || state === 'Closed') return state;
  throw new Error(`Cannot derive state from status: ${status}`);
}

export function getStatusLabel(status: Status): string {
  return STATUS_LABELS[status];
}

export function getPriorityLabel(priority: Priority): string {
  return PRIORITY_LABELS[priority];
}

export function formatCaseNumber(sequence: number): string {
  return `CF-${String(sequence).padStart(4, '0')}`;
}

const TRANSITION_MATRIX: Record<string, string[]> = {
  'Open_New': ['Open_Assigned', 'Closed_Rejected', 'Closed_Duplicate'],
  'Open_Assigned': ['Open_Pending Input', 'Closed_Closed', 'Closed_Rejected'],
  'Open_Pending Input': ['Open_Assigned', 'Closed_Closed'],
  'Closed_Closed': ['Open_Assigned'],
  'Closed_Rejected': ['Open_Assigned'],
  'Closed_Duplicate': [],
};

export function isTransitionAllowed(from: Status, to: Status): boolean {
  const allowed = TRANSITION_MATRIX[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function getAllowedTransitions(from: Status): Status[] {
  return (TRANSITION_MATRIX[from] || []) as Status[];
}

export function isValidStatus(status: string): status is Status {
  return STATUSES.includes(status as Status);
}

export function isValidPriority(priority: string): priority is Priority {
  return PRIORITIES.includes(priority as Priority);
}
