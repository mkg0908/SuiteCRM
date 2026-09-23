import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AgentCaseQueuePage from '../pages/AgentCaseQueuePage.js';

// Mock fetch
const mockCases = {
  items: [
    {
      id: 'uuid-1',
      caseNumber: 'CF-1001',
      subject: 'Cannot log in',
      priority: 'P1',
      status: 'Open_New',
      state: 'Open',
      channel: 'Email',
      isAtRisk: false,
      isBreached: false,
      customerEmail: 'p•••@riverahotels.com',
      customerPhone: '415-555-••••',
      assignedAgent: { name: 'Alice' },
      dateModified: new Date().toISOString(),
    }
  ],
  total: 1,
  page: 1,
  pageSize: 25,
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(mockCases),
    ok: true,
  } as unknown as Response);
});

describe('AgentCaseQueuePage', () => {
  it('renders SearchInput', async () => {
    render(<AgentCaseQueuePage onCaseSelect={() => {}} />);
    expect(screen.getByRole('searchbox')).toBeTruthy();
  });

  it('renders StatusFilter', async () => {
    render(<AgentCaseQueuePage onCaseSelect={() => {}} />);
    expect(screen.getByRole('combobox', { name: /status/i })).toBeTruthy();
  });

  it('renders PriorityFilter', async () => {
    render(<AgentCaseQueuePage onCaseSelect={() => {}} />);
    expect(screen.getByRole('combobox', { name: /priority/i })).toBeTruthy();
  });

  it('renders ChannelFilter', async () => {
    render(<AgentCaseQueuePage onCaseSelect={() => {}} />);
    expect(screen.getByRole('combobox', { name: /channel/i })).toBeTruthy();
  });

  it('renders case table with masked contacts', async () => {
    render(<AgentCaseQueuePage onCaseSelect={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('CF-1001')).toBeTruthy();
      expect(screen.getByText('p•••@riverahotels.com')).toBeTruthy();
    });
  });

  it('renders PaginationControls', async () => {
    render(<AgentCaseQueuePage onCaseSelect={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Page \d+ of \d+/)).toBeTruthy();
    });
  });

  it('renders CreateCaseModal button', async () => {
    render(<AgentCaseQueuePage onCaseSelect={() => {}} />);
    expect(screen.getByText('Create Case')).toBeTruthy();
  });
});
