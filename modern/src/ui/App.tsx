import React, { useState } from 'react';
import AgentCaseQueuePage from './pages/AgentCaseQueuePage.js';
import CaseDetailPage from './pages/CaseDetailPage.js';
import OmnichannelIntakePage from './pages/OmnichannelIntakePage.js';
import ManagerDashboardPage from './pages/ManagerDashboardPage.js';

type Page = 'queue' | 'detail' | 'intake' | 'dashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('queue');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string | null>(null);

  const navigate = (page: Page, caseNumber?: string) => {
    setCurrentPage(page);
    if (caseNumber) setSelectedCaseNumber(caseNumber);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ddd', display: 'flex', gap: '1rem' }}>
        <button onClick={() => navigate('queue')}>Case Queue</button>
        <button onClick={() => navigate('intake')}>Intake</button>
        <button onClick={() => navigate('dashboard')}>Dashboard</button>
      </nav>
      <main style={{ padding: '1rem' }}>
        {currentPage === 'queue' && (
          <AgentCaseQueuePage onCaseSelect={(cn) => navigate('detail', cn)} />
        )}
        {currentPage === 'detail' && selectedCaseNumber && (
          <CaseDetailPage caseNumber={selectedCaseNumber} onBack={() => navigate('queue')} />
        )}
        {currentPage === 'intake' && <OmnichannelIntakePage />}
        {currentPage === 'dashboard' && <ManagerDashboardPage />}
      </main>
    </div>
  );
}
