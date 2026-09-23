/**
 * CaseFlow SLA Service - P1/P2/P3 due times, at-risk, breach, and Pending Input pause
 */

export const SLA_HOURS: Record<string, number> = {
  P1: 2,
  P2: 24,
  P3: 72,
};

export const AT_RISK_THRESHOLD = 0.75; // 75% elapsed = at risk

export interface SlaResult {
  slaDueAt: Date;
  isAtRisk: boolean;
  isBreached: boolean;
}

export interface PauseEvent {
  pausedAt: Date;
  resumedAt?: Date;
}

/** Calculate initial SLA due time from case creation */
export function computeSlaDueAt(priority: string, createdAt: Date): Date {
  const hours = SLA_HOURS[priority] ?? SLA_HOURS['P3'];
  const due = new Date(createdAt);
  due.setHours(due.getHours() + hours);
  return due;
}

/** Compute total paused duration in milliseconds */
function computePausedMs(pauseEvents: PauseEvent[], now: Date): number {
  let totalMs = 0;
  for (const event of pauseEvents) {
    const end = event.resumedAt ?? now;
    totalMs += end.getTime() - event.pausedAt.getTime();
  }
  return totalMs;
}

/**
 * Evaluate current SLA status.
 * Paused duration is excluded from elapsed time.
 */
export function evaluateSla(
  priority: string,
  createdAt: Date,
  now: Date,
  pauseEvents: PauseEvent[] = [],
  firstResponseAt?: Date | null,
): SlaResult {
  const totalHours = SLA_HOURS[priority] ?? SLA_HOURS['P3'];
  const totalMs = totalHours * 60 * 60 * 1000;

  const pausedMs = computePausedMs(pauseEvents, now);
  const slaDueAt = new Date(createdAt.getTime() + totalMs + pausedMs);

  const elapsedMs = now.getTime() - createdAt.getTime() - pausedMs;
  const elapsedFraction = elapsedMs / totalMs;

  const isBreached = now > slaDueAt;
  const isAtRisk = !isBreached && elapsedFraction >= AT_RISK_THRESHOLD;

  return { slaDueAt, isAtRisk, isBreached };
}

/** Recalculate SLA due time after Pending Input pause ends */
export function recalculateSlaAfterPause(
  priority: string,
  originalDueAt: Date,
  pausedAt: Date,
  resumedAt: Date,
): Date {
  const pauseDurationMs = resumedAt.getTime() - pausedAt.getTime();
  return new Date(originalDueAt.getTime() + pauseDurationMs);
}

export function recordFirstResponse(firstResponseAt: Date | null | undefined, now: Date): Date {
  return firstResponseAt ?? now;
}
