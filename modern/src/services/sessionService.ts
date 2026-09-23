import type { UserRole } from '../contracts/sessionSchemas.js';

export function isValidRole(role: unknown): role is UserRole {
  return role === 'agent' || role === 'manager';
}

export function getSessionRole(session: Record<string, unknown>): UserRole | null {
  const role = session['role'];
  if (isValidRole(role)) return role;
  return null;
}

export function setSessionRole(session: Record<string, unknown>, role: UserRole): void {
  session['role'] = role;
}
