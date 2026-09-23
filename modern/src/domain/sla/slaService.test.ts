import { describe, it, expect } from 'vitest';
import { computeSlaDueAt, evaluateSla, SLA_HOURS, recalculateSlaAfterPause } from './slaService.js';

const base = new Date('2024-01-01T10:00:00Z');

describe('SLA_HOURS', () => {
  it('P1 = 2 hours', () => expect(SLA_HOURS['P1']).toBe(2));
  it('P2 = 24 hours', () => expect(SLA_HOURS['P2']).toBe(24));
  it('P3 = 72 hours', () => expect(SLA_HOURS['P3']).toBe(72));
});

describe('computeSlaDueAt', () => {
  it('P1 due in 2 hours', () => {
    const due = computeSlaDueAt('P1', base);
    expect(due.getTime()).toBe(base.getTime() + 2 * 3600000);
  });
  it('P2 due in 24 hours', () => {
    const due = computeSlaDueAt('P2', base);
    expect(due.getTime()).toBe(base.getTime() + 24 * 3600000);
  });
  it('P3 due in 72 hours', () => {
    const due = computeSlaDueAt('P3', base);
    expect(due.getTime()).toBe(base.getTime() + 72 * 3600000);
  });
});

describe('evaluateSla', () => {
  it('not at risk before 75% elapsed', () => {
    const now = new Date(base.getTime() + 1 * 3600000); // 1h into 2h P1
    const result = evaluateSla('P1', base, now);
    expect(result.isAtRisk).toBe(false);
    expect(result.isBreached).toBe(false);
  });

  it('at risk after 75% elapsed', () => {
    const now = new Date(base.getTime() + 1.6 * 3600000); // 1.6h into 2h P1 = 80%
    const result = evaluateSla('P1', base, now);
    expect(result.isAtRisk).toBe(true);
    expect(result.isBreached).toBe(false);
  });

  it('breached after due time', () => {
    const now = new Date(base.getTime() + 3 * 3600000); // 3h > 2h P1
    const result = evaluateSla('P1', base, now);
    expect(result.isBreached).toBe(true);
    expect(result.isAtRisk).toBe(false);
  });

  it('Pending Input pause does not count toward elapsed time', () => {
    // P1 = 2h. Paused for 2h. Now 3h after creation but only 1h of real time
    const pausedAt = new Date(base.getTime() + 0.5 * 3600000);
    const resumedAt = new Date(base.getTime() + 2.5 * 3600000);
    const now = new Date(base.getTime() + 3 * 3600000); // 3h total, 1h real
    const result = evaluateSla('P1', base, now, [{ pausedAt, resumedAt }]);
    expect(result.isBreached).toBe(false); // only 1h real elapsed out of 2h SLA
  });
});

describe('recalculateSlaAfterPause', () => {
  it('extends due time by pause duration', () => {
    const originalDue = new Date(base.getTime() + 2 * 3600000);
    const pausedAt = new Date(base.getTime() + 1 * 3600000);
    const resumedAt = new Date(base.getTime() + 3 * 3600000); // 2h pause
    const newDue = recalculateSlaAfterPause('P1', originalDue, pausedAt, resumedAt);
    expect(newDue.getTime()).toBe(originalDue.getTime() + 2 * 3600000);
  });
});
