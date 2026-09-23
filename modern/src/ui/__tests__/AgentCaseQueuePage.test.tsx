import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AgentCaseQueuePage } from '../pages/AgentCaseQueuePage.js';

const mockCases = {
  cases: [{ caseNumber: 'CF-1001', subject: 'Payment page not loading', priority: 'P1', status: 'Open_New', state: 'Open', channel: 'Email', isAtRisk: false, isBreached: false, slaDueAt: '2026-09-23T12:00:00Z', dateModified: '2026-09-23T10:00:00Z' }],
  total: 1, page: 1, pageSize: 25,
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockCases) });
});

describe('AgentCaseQueuePage', () => {
  it('renders SearchInput', async () => {
    render(<AgentCaseQueuePage onViewCase={() => {}} />);
    await waitFor(() => expect(screen.getByPlaceholderText('Search cases...')).toBeInTheDocument());
  });

  it('renders StatusFilter', async () => {
    render(<AgentCaseQueuePage onViewCase={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText('Filter by status')).toBeInTheDocument());
  });

  it('renders PriorityFilter', async () => {
    render(<AgentCaseQueuePage onViewCase={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText('Filter by priority')).toBeInTheDocument());
  });

  it('renders ChannelFilter', async () => {
    render(<AgentCaseQueuePage onViewCase={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText('Filter by channel')).toBeInTheDocument());
  });

  it('renders CaseTable with case data', async () => {
    render(<AgentCaseQueuePage onViewCase={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('CF-1001')).toBeInTheDocument();
      expect(screen.getByText('Payment page not loading')).toBeInTheDocument();
    });
  });

  it('renders CreateCaseModal trigger button', async () => {
    render(<AgentCaseQueuePage onViewCase={() => {}} />);
    await waitFor(() => expect(screen.getByText('+ New Case')).toBeInTheDocument());
  });
});
