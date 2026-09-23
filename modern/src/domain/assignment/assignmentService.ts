export interface Agent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

let lastAssignedIndex = -1;

export function resetAssignmentRotation(): void {
  lastAssignedIndex = -1;
}

export function suggestNextOwner(activeAgents: Agent[]): Agent {
  const available = activeAgents.filter(a => a.isActive);
  if (available.length === 0) {
    throw new NoActiveAgentError();
  }
  lastAssignedIndex = (lastAssignedIndex + 1) % available.length;
  return available[lastAssignedIndex];
}

export class NoActiveAgentError extends Error {
  constructor() {
    super('No active agents available for assignment');
    this.name = 'NoActiveAgentError';
  }
}
