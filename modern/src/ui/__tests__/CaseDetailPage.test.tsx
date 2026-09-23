import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CaseDetailPage from '../pages/CaseDetailPage.js';

const mockCase = {
  id: 'uuid-1',
  caseNumber: 'CF-1001',
  subject: 'Login issue',
  description: 'Cannot log in',
  priority: 'P1',
  status: 'Open_New',
  state: 'Open',
  channel: 'Email',
  isAtRisk: false,
  isBreached: false,
  customerEmail: 'p•••@riverahotels.com',
  customerPhone: '415-555-••••',
  updates: [
    {
      id: 'upd-1',
      author: 'Support Agent',
      text: 'Looking into the issue',
      timestamp: '2024-01-15T10:00:00Z',
      internal: false,
    },
    {
      id: 'upd-2',
      author: 'Agent Smith',
      text: 'Internal note: escalate to tier 2',
      timestamp: '2024-01-15T11:00:00Z',
      internal: true,
    },
  ],
  auditEvents: [
    {
      id: 'aud-1',
      userId: 'user-1',
      timestamp: '2024-01-15T09:00:00Z',
      field: 'status',
      oldValue: null,
      newValue: 'Open_New',
      action: 'create',
    },
  ],
};

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/caseflow/cases/CF-1001') && !url.includes('/status') && !url.includes('/updates')) {
      return Promise.resolve({ json: () => Promise.resolve(mockCase), ok: true, status: 200 });
    }
    if (url.includes('/status')) {
      return Promise.resolve({
        json: () => Promise.resolve({ error: 'transition_conflict', message: 'Transition from Open_New to Open_Pending Input is not allowed' }),
        ok: false,
        status: 409,
      });
    }
    return Promise.resolve({ json: () => Promise.resolve(mockCase), ok: true, status: 200 });
  });
});

describe('CaseDetailPage', () => {
  it('renders threaded updates with author, text, timestamp', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Support Agent')).toBeTruthy();
      expect(screen.getByText('Looking into the issue')).toBeTruthy();
    });
  });

  it('shows internal flag on internal updates (non-customer facing)', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} customerFacing={false} />);
    await waitFor(() => {
      expect(screen.getByText('[Internal]')).toBeTruthy();
    });
  });

  it('hides internal updates in customer-facing mode', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} customerFacing={true} />);
    await waitFor(() => {
      expect(screen.queryByText('[Internal]')).toBeNull();
      expect(screen.queryByText('Internal note: escalate to tier 2')).toBeNull();
    });
  });

  it('displays derived state', async () => {
    render(<CaseDetailPage caseNumber="CF-1001" onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/State:.*Open/)).toBeTruthy();
    });
  });
});
