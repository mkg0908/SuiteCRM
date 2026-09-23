import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ManagerDashboardPage from '../pages/ManagerDashboardPage.js';

const mockSummary = {
  openCasesByStatus: { 'Open_New': 5, 'Open_Assigned': 3 },
  atRiskCount: 2,
  breachedCount: 1,
  casesByChannel: { Email: 8, WhatsApp: 3 },
  averageFirstResponseHours: 4.5,
  topCategories: [{ category: 'technical', count: 10 }, { category: 'billing', count: 5 }],
  casesPerAgent: [{ agentId: 'a1', agentName: 'Alice', count: 4 }],
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(mockSummary),
    ok: true,
  } as unknown as Response);
});

describe('ManagerDashboardPage', () => {
  it('renders summary metric cards', async () => {
    render(<ManagerDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Open')).toBeTruthy();
      expect(screen.getByText('At Risk')).toBeTruthy();
      expect(screen.getByText('Breached')).toBeTruthy();
    });
  });

  it('renders open cases by status', async () => {
    render(<ManagerDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Open_New')).toBeTruthy();
      expect(screen.getByText('Open_Assigned')).toBeTruthy();
    });
  });

  it('renders cases by channel', async () => {
    render(<ManagerDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('WhatsApp')).toBeTruthy();
    });
  });

  it('renders top categories', async () => {
    render(<ManagerDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('technical')).toBeTruthy();
      expect(screen.getByText('billing')).toBeTruthy();
    });
  });

  it('renders cases per agent', async () => {
    render(<ManagerDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
    });
  });

  it('renders average first response time', async () => {
    render(<ManagerDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Avg First Response')).toBeTruthy();
      expect(screen.getByText('4.5h')).toBeTruthy();
    });
  });
});
