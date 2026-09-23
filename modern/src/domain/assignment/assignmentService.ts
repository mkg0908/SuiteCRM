/**
 * CaseFlow Assignment Service - round-robin and no-unowned-case rule
 */

export interface Agent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export class NoActiveAgentsError extends Error {
  readonly code = 'no_active_agents';
  constructor() {
    super('No active agents available for assignment');
    this.name = 'NoActiveAgentsError';
  }
}

/** Internal state for round-robin tracking */
let _lastAssignedIndex = -1;

/** Reset counter (for tests) */
export function _resetRoundRobin(): void {
  _lastAssignedIndex = -1;
}

/**
 * Suggest next agent using round-robin across active agents.
 * Throws NoActiveAgentsError if none are active.
 */
export function suggestNextAgent(agents: Agent[]): Agent {
  const active = agents.filter((a) => a.isActive);
  if (active.length === 0) {
    throw new NoActiveAgentsError();
  }
  _lastAssignedIndex = (_lastAssignedIndex + 1) % active.length;
  return active[_lastAssignedIndex];
}

/**
 * Validate that a case will have an owner after assignment.
 * Throws if no agent is provided.
 */
export function assertCaseWillBeOwned(agentId: string | null | undefined): void {
  if (!agentId) {
    throw new NoActiveAgentsError();
  }
}
