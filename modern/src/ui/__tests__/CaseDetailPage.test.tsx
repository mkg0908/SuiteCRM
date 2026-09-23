import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseDetailPage } from '../pages/CaseDetailPage.js';

const mockCaseDetail = {
  caseNumber: 'CF-1001', subject: 'Payment page not loading', description: 'The payment page returns a 500 error',
  priority: 'P1', status: 'Open_New', state: 'Open', channel: 'Email',
  customerEmail: 'p•••@riverahotels.com', customerPhone: '415-555-••••',
  isAtRisk: false, isBreached: false, slaDueAt: '2026-09-23T12:00:00Z',
  updates: [
    { id: '1', author: 'Alice', text: 'Looking into this', internal: false, createdAt: '2026-09-23T10:30:00Z' },
    { id: '2', author: 'Bob', text: 'Internal: escalated to eng', internal: true, createdAt: '2026-09-23T10:45:00Z' },
  ],
  auditEvents: [
    { id: '1', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1001', createdAt: '2026-09-23T10:00:00Z' },
  ],
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockCaseDetail) });
});

describe('CaseDetailPage', () => {
  it('renders case number and subject', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText(/CF-1001/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Payment page not loading/)).toBeInTheDocument();
    });
  });

  it('renders threaded updates with author and text', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Looking into this')).toBeInTheDocument();
    });
  });

  it('shows internal flag on internal updates', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('[Internal]')).toBeInTheDocument());
  });

  it('renders derived state', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} />);
    await waitFor(() => expect(screen.getAllByText(/Open/).length).toBeGreaterThan(0));
  });

  it('shows conflict alert on 409', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCaseDetail) })
      .mockResolvedValueOnce({ status: 409, ok: false, json: () => Promise.resolve({ error: 'transition_conflict', message: 'Transition not allowed' }) });
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} />);
    await waitFor(() => expect(screen.getAllByText(/CF-1001/).length).toBeGreaterThan(0));
    const pendingBtn = screen.getByText('Pending Input');
    await userEvent.click(pendingBtn);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
