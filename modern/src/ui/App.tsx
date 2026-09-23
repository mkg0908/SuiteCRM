import React, { useState } from 'react';
import { AgentCaseQueuePage } from './pages/AgentCaseQueuePage.js';
import { CaseDetailPage } from './pages/CaseDetailPage.js';
import { OmnichannelIntakePage } from './pages/OmnichannelIntakePage.js';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage.js';

type Page = 'queue' | 'detail' | 'intake' | 'dashboard';

export default function App() {
  const [page, setPage] = useState<Page>('queue');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [role, setRole] = useState<'agent' | 'manager'>('agent');

  const handleViewCase = (caseNumber: string) => {
    setSelectedCase(caseNumber);
    setPage('detail');
  };

  const handleRoleSwitch = async (newRole: 'agent' | 'manager') => {
    await fetch('/api/caseflow/session/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setRole(newRole);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ background: '#1a1a2e', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>CaseFlow</h1>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => setPage('queue')} style={navStyle(page === 'queue')}>Cases</button>
          <button onClick={() => setPage('intake')} style={navStyle(page === 'intake')}>Intake</button>
          <button onClick={() => setPage('dashboard')} style={navStyle(page === 'dashboard')}>Dashboard</button>
          <select value={role} onChange={e => handleRoleSwitch(e.target.value as 'agent' | 'manager')} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none' }}>
            <option value="agent">Agent</option>
            <option value="manager">Manager</option>
          </select>
        </nav>
      </header>
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {page === 'queue' && <AgentCaseQueuePage onViewCase={handleViewCase} />}
        {page === 'detail' && selectedCase && <CaseDetailPage caseNumber={selectedCase} onBack={() => setPage('queue')} />}
        {page === 'intake' && <OmnichannelIntakePage />}
        {page === 'dashboard' && <ManagerDashboardPage />}
      </main>
    </div>
  );
}

function navStyle(active: boolean): React.CSSProperties {
  return { background: active ? '#e94560' : 'transparent', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' };
}
