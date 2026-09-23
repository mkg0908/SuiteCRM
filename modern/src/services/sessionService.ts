import type { Request } from 'express';

export type SessionRole = 'agent' | 'manager';

export function getSessionRole(req: Request): SessionRole {
  const session = req.session as unknown as Record<string, unknown>;
  return (session?.role as SessionRole) || 'agent';
}

export function setSessionRole(req: Request, role: SessionRole): void {
  const session = req.session as unknown as Record<string, unknown>;
  session.role = role;
}
