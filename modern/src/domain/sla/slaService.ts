import type { Priority } from '../cases/status.js';

export const SLA_DURATIONS_MS: Record<Priority, number> = {
  P1: 2 * 60 * 60 * 1000,
  P2: 24 * 60 * 60 * 1000,
  P3: 72 * 60 * 60 * 1000,
};

export const AT_RISK_THRESHOLD = 0.75;

export interface SlaState {
  slaDueAt: Date;
  isAtRisk: boolean;
  isBreached: boolean;
}

export function calculateSlaDue(priority: Priority, createdAt: Date): Date {
  const duration = SLA_DURATIONS_MS[priority];
  return new Date(createdAt.getTime() + duration);
}

export function computeSlaState(
  priority: Priority,
  createdAt: Date,
  now: Date,
  firstResponseAt: Date | null,
  pausedDurationMs: number = 0,
): SlaState {
  const duration = SLA_DURATIONS_MS[priority];
  const effectiveDueAt = new Date(createdAt.getTime() + duration + pausedDurationMs);

  if (firstResponseAt && firstResponseAt <= effectiveDueAt) {
    return { slaDueAt: effectiveDueAt, isAtRisk: false, isBreached: false };
  }

  const elapsed = now.getTime() - createdAt.getTime() - pausedDurationMs;
  const percentElapsed = elapsed / duration;

  return {
    slaDueAt: effectiveDueAt,
    isAtRisk: percentElapsed >= AT_RISK_THRESHOLD,
    isBreached: now > effectiveDueAt,
  };
}

export function calculatePausedDuration(pauseStart: Date, resumeTime: Date): number {
  return resumeTime.getTime() - pauseStart.getTime();
}

export function recalculateSlaDueAfterResume(
  originalDueAt: Date,
  pauseStart: Date,
  resumeTime: Date,
): Date {
  const pausedMs = calculatePausedDuration(pauseStart, resumeTime);
  return new Date(originalDueAt.getTime() + pausedMs);
}
