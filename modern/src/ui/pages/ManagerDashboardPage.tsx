import React, { useEffect, useState } from 'react';

interface DashboardSummary {
  openCasesByStatus: Record<string, number>;
  atRiskCount: number;
  breachedCount: number;
  casesByChannel: Record<string, number>;
  averageFirstResponseHours: number | null;
  topCategories: Array<{ category: string; count: number }>;
  casesPerAgent: Array<{ agentId: string; agentName: string; count: number }>;
}

function SummaryMetricCard({ title, value, color }: { title: string; value: number | string; color?: string }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', minWidth: '150px' }}>
      <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>{title}</p>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: color ?? 'inherit' }}>{value}</p>
    </div>
  );
}

function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function ManagerDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/caseflow/dashboard/summary')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setError('Failed to load dashboard'));
  }, []);

  if (error) return <div role="alert">{error}</div>;
  if (!summary) return <div>Loading dashboard...</div>;

  const totalOpen = Object.values(summary.openCasesByStatus).reduce((s, c) => s + c, 0);

  return (
    <div>
      <h1>Manager Dashboard</h1>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <SummaryMetricCard title="Total Open" value={totalOpen} />
        <SummaryMetricCard title="At Risk" value={summary.atRiskCount} color="#f59e0b" />
        <SummaryMetricCard title="Breached" value={summary.breachedCount} color="#dc2626" />
        {summary.averageFirstResponseHours !== null && (
          <SummaryMetricCard
            title="Avg First Response"
            value={`${summary.averageFirstResponseHours.toFixed(1)}h`}
          />
        )}
      </div>

      <DashboardCard title="Open Cases by Status">
        <table style={{ width: '100%' }}>
          <thead><tr><th>Status</th><th>Count</th></tr></thead>
          <tbody>
            {Object.entries(summary.openCasesByStatus).map(([status, count]) => (
              <tr key={status}><td>{status}</td><td>{count}</td></tr>
            ))}
          </tbody>
        </table>
      </DashboardCard>

      <DashboardCard title="Cases by Channel">
        <table style={{ width: '100%' }}>
          <thead><tr><th>Channel</th><th>Count</th></tr></thead>
          <tbody>
            {Object.entries(summary.casesByChannel).map(([channel, count]) => (
              <tr key={channel}><td>{channel}</td><td>{count}</td></tr>
            ))}
          </tbody>
        </table>
      </DashboardCard>

      <DashboardCard title="Top Categories">
        <table style={{ width: '100%' }}>
          <thead><tr><th>Category</th><th>Count</th></tr></thead>
          <tbody>
            {summary.topCategories.map(({ category, count }) => (
              <tr key={category}><td>{category}</td><td>{count}</td></tr>
            ))}
          </tbody>
        </table>
      </DashboardCard>

      <DashboardCard title="Cases per Agent">
        <table style={{ width: '100%' }}>
          <thead><tr><th>Agent</th><th>Open Cases</th></tr></thead>
          <tbody>
            {summary.casesPerAgent.map(({ agentId, agentName, count }) => (
              <tr key={agentId}><td>{agentName}</td><td>{count}</td></tr>
            ))}
          </tbody>
        </table>
      </DashboardCard>
    </div>
  );
}
