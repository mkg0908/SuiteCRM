import { describe, it, expect } from 'vitest';
import {
  SLA_DURATIONS_MS,
  calculateSlaDue,
  computeSlaState,
  calculatePausedDuration,
  recalculateSlaDueAfterResume,
} from './slaService.js';

describe('SLA service', () => {
  const baseTime = new Date('2026-09-23T10:00:00Z');

  it('P1 SLA is 2 hours', () => expect(SLA_DURATIONS_MS.P1).toBe(2 * 60 * 60 * 1000));
  it('P2 SLA is 24 hours', () => expect(SLA_DURATIONS_MS.P2).toBe(24 * 60 * 60 * 1000));
  it('P3 SLA is 72 hours', () => expect(SLA_DURATIONS_MS.P3).toBe(72 * 60 * 60 * 1000));

  it('calculates due date correctly for P1', () => {
    const due = calculateSlaDue('P1', baseTime);
    expect(due.getTime()).toBe(baseTime.getTime() + 2 * 60 * 60 * 1000);
  });

  it('at-risk is true after 75% elapsed', () => {
    const now = new Date(baseTime.getTime() + 1.6 * 60 * 60 * 1000);
    const state = computeSlaState('P1', baseTime, now, null);
    expect(state.isAtRisk).toBe(true);
    expect(state.isBreached).toBe(false);
  });

  it('at-risk is false before 75%', () => {
    const now = new Date(baseTime.getTime() + 1 * 60 * 60 * 1000);
    const state = computeSlaState('P1', baseTime, now, null);
    expect(state.isAtRisk).toBe(false);
  });

  it('breached is true after due time', () => {
    const now = new Date(baseTime.getTime() + 2.5 * 60 * 60 * 1000);
    const state = computeSlaState('P1', baseTime, now, null);
    expect(state.isBreached).toBe(true);
  });

  it('not breached when first response before due', () => {
    const firstResponse = new Date(baseTime.getTime() + 1 * 60 * 60 * 1000);
    const now = new Date(baseTime.getTime() + 3 * 60 * 60 * 1000);
    const state = computeSlaState('P1', baseTime, now, firstResponse);
    expect(state.isAtRisk).toBe(false);
    expect(state.isBreached).toBe(false);
  });

  it('Pending Input pause recalculates due without counting paused time', () => {
    const pauseStart = new Date(baseTime.getTime() + 30 * 60 * 1000);
    const resumeTime = new Date(baseTime.getTime() + 90 * 60 * 1000);
    const pausedMs = calculatePausedDuration(pauseStart, resumeTime);
    expect(pausedMs).toBe(60 * 60 * 1000);

    const now = new Date(baseTime.getTime() + 2.5 * 60 * 60 * 1000);
    const state = computeSlaState('P1', baseTime, now, null, pausedMs);
    expect(state.isAtRisk).toBe(true);
    expect(state.isBreached).toBe(false);
  });

  it('recalculates due time after resume', () => {
    const originalDue = calculateSlaDue('P1', baseTime);
    const pauseStart = new Date(baseTime.getTime() + 30 * 60 * 1000);
    const resumeTime = new Date(baseTime.getTime() + 90 * 60 * 1000);
    const newDue = recalculateSlaDueAfterResume(originalDue, pauseStart, resumeTime);
    expect(newDue.getTime()).toBe(originalDue.getTime() + 60 * 60 * 1000);
  });
});
