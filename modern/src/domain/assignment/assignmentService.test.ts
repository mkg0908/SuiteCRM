import { describe, it, expect, beforeEach } from 'vitest';
import { suggestNextAgent, NoActiveAgentsError, _resetRoundRobin, assertCaseWillBeOwned } from './assignmentService.js';

const agents = [
  { id: 'a1', name: 'Alice', email: 'alice@example.com', isActive: true },
  { id: 'a2', name: 'Bob', email: 'bob@example.com', isActive: true },
  { id: 'a3', name: 'Carol', email: 'carol@example.com', isActive: false },
];

beforeEach(() => _resetRoundRobin());

describe('suggestNextAgent', () => {
  it('throws NoActiveAgentsError when no active agents', () => {
    expect(() => suggestNextAgent([])).toThrow(NoActiveAgentsError);
    expect(() => suggestNextAgent([{ ...agents[0], isActive: false }])).toThrow(NoActiveAgentsError);
  });

  it('round-robins across active agents', () => {
    const first = suggestNextAgent(agents);
    expect(first.isActive).toBe(true);
    const second = suggestNextAgent(agents);
    expect(second.isActive).toBe(true);
    expect(first.id).not.toBe(second.id);
  });

  it('skips inactive agents', () => {
    for (let i = 0; i < 10; i++) {
      const agent = suggestNextAgent(agents);
      expect(agent.id).not.toBe('a3');
    }
  });

  it('wraps around after last agent', () => {
    const first = suggestNextAgent(agents);  // index 0 -> a1
    suggestNextAgent(agents); // a2
    const third = suggestNextAgent(agents); // wraps -> a1
    expect(third.id).toBe(first.id);
  });
});

describe('assertCaseWillBeOwned', () => {
  it('throws for null agentId', () => expect(() => assertCaseWillBeOwned(null)).toThrow(NoActiveAgentsError));
  it('throws for undefined agentId', () => expect(() => assertCaseWillBeOwned(undefined)).toThrow(NoActiveAgentsError));
  it('throws for empty string', () => expect(() => assertCaseWillBeOwned('')).toThrow(NoActiveAgentsError));
  it('does not throw for valid id', () => expect(() => assertCaseWillBeOwned('a1')).not.toThrow());
});
