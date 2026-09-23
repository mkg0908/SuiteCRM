import React, { useState, useEffect } from 'react';

export function ManagerDashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/caseflow/dashboard/summary').then(r => r.json()).then(setData); }, []);
  if (!data) return <p>Loading dashboard...</p>;

  const summaryCard = (color: string): React.CSSProperties => ({ background: 'white', borderTop: `4px solid ${color}`, padding: '20px', borderRadius: '8px', textAlign: 'center' });
  const cardLabel: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' };
  const cardValue: React.CSSProperties = { fontSize: '36px', fontWeight: 700 };
  const sectionCard: React.CSSProperties = { background: 'white', padding: '20px', borderRadius: '8px' };
  const sectionTitle: React.CSSProperties = { fontSize: '16px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #eee' };
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' };

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '24px' }}>Manager Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={summaryCard('#e74c3c')}><span style={cardLabel}>At Risk</span><span style={cardValue}>{data.atRiskCount}</span></div>
        <div style={summaryCard('#c0392b')}><span style={cardLabel}>Breached</span><span style={cardValue}>{data.breachedCount}</span></div>
        <div style={summaryCard('#3498db')}><span style={cardLabel}>Avg First Response</span><span style={cardValue}>{data.avgFirstResponseMs ? `${Math.round(data.avgFirstResponseMs / 60000)}m` : 'N/A'}</span></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={sectionCard}><h3 style={sectionTitle}>Open Cases by Status</h3>{Object.entries(data.openByStatus).map(([s, c]) => <div key={s} style={rowStyle}><span>{s.split('_').slice(1).join(' ')}</span><strong>{c as number}</strong></div>)}{Object.keys(data.openByStatus).length === 0 && <p style={{ color: '#999' }}>No open cases</p>}</div>
        <div style={sectionCard}><h3 style={sectionTitle}>Cases by Channel</h3>{Object.entries(data.byChannel).map(([ch, c]) => <div key={ch} style={rowStyle}><span>{ch}</span><strong>{c as number}</strong></div>)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={sectionCard}><h3 style={sectionTitle}>Top Categories</h3>{data.topCategories.map((c: any) => <div key={c.category} style={rowStyle}><span>{c.category}</span><strong>{c.count}</strong></div>)}{data.topCategories.length === 0 && <p style={{ color: '#999' }}>No categories</p>}</div>
        <div style={sectionCard}><h3 style={sectionTitle}>Cases per Agent</h3>{data.casesPerAgent.map((a: any) => <div key={a.agentId} style={rowStyle}><span>{a.agentName}</span><strong>{a.count}</strong></div>)}{data.casesPerAgent.length === 0 && <p style={{ color: '#999' }}>No assignments</p>}</div>
      </div>
    </div>
  );
}
