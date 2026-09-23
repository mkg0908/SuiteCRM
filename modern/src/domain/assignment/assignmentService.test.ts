import { describe, it, expect, beforeEach } from 'vitest';
import { suggestNextOwner, resetAssignmentRotation, NoActiveAgentError } from './assignmentService.js';
import type { Agent } from './assignmentService.js';

describe('assignment service', () => {
  const agents: Agent[] = [
    { id: '1', name: 'Alice', email: 'alice@test.com', isActive: true },
    { id: '2', name: 'Bob', email: 'bob@test.com', isActive: true },
    { id: '3', name: 'Carol', email: 'carol@test.com', isActive: true },
    { id: '4', name: 'Dave', email: 'dave@test.com', isActive: false },
  ];

  beforeEach(() => resetAssignmentRotation());

  it('assigns first active agent', () => expect(suggestNextOwner(agents).name).toBe('Alice'));

  it('round-robins through active agents', () => {
    expect(suggestNextOwner(agents).name).toBe('Alice');
    expect(suggestNextOwner(agents).name).toBe('Bob');
    expect(suggestNextOwner(agents).name).toBe('Carol');
    expect(suggestNextOwner(agents).name).toBe('Alice');
  });

  it('skips inactive agents', () => {
    const results = [1, 2, 3, 4].map(() => suggestNextOwner(agents).name);
    expect(results).not.toContain('Dave');
  });

  it('throws NoActiveAgentError when no active agents', () => {
    expect(() => suggestNextOwner([{ id: '4', name: 'Dave', email: 'dave@test.com', isActive: false }])).toThrow(NoActiveAgentError);
  });

  it('throws NoActiveAgentError with empty array', () => {
    expect(() => suggestNextOwner([])).toThrow(NoActiveAgentError);
  });
});
