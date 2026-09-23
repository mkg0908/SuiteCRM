import React, { useState, useEffect, useCallback } from 'react';
import { SearchInput } from '../components/SearchInput.js';
import { StatusFilter } from '../components/StatusFilter.js';
import { PriorityFilter } from '../components/PriorityFilter.js';
import { ChannelFilter } from '../components/ChannelFilter.js';
import { CaseTable } from '../components/CaseTable.js';
import { PaginationControls } from '../components/PaginationControls.js';
import { CreateCaseModal } from '../components/CreateCaseModal.js';

interface AgentCaseQueuePageProps { onViewCase: (caseNumber: string) => void; }

export function AgentCaseQueuePage({ onViewCase }: AgentCaseQueuePageProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [channel, setChannel] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [showCreate, setShowCreate] = useState(false);

  const fetchCases = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (channel) params.set('channel', channel);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    const res = await fetch(`/api/caseflow/cases?${params}`);
    if (res.ok) { const data = await res.json(); setCases(data.cases); setTotal(data.total); }
  }, [search, status, priority, channel, page, pageSize]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px' }}>Case Queue</h2>
        <button onClick={() => setShowCreate(true)} style={{ padding: '8px 16px', background: '#e94560', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ New Case</button>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} />
        <StatusFilter value={status} onChange={v => { setStatus(v); setPage(1); }} />
        <PriorityFilter value={priority} onChange={v => { setPriority(v); setPage(1); }} />
        <ChannelFilter value={channel} onChange={v => { setChannel(v); setPage(1); }} />
      </div>
      <CaseTable cases={cases} onViewCase={onViewCase} />
      <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      <CreateCaseModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchCases} />
    </div>
  );
}
