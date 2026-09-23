import React, { useState, useEffect } from 'react';

interface CaseItem {
  id: string;
  caseNumber: string;
  subject: string;
  priority: string;
  status: string;
  channel: string;
  isAtRisk: boolean;
  isBreached: boolean;
  customerEmail?: string | null;
  customerPhone?: string | null;
  assignedAgent?: { name: string } | null;
  dateModified: string;
}

interface Props {
  onCaseSelect: (caseNumber: string) => void;
}

function SlaBadgeProgress({ isAtRisk, isBreached }: { isAtRisk: boolean; isBreached: boolean }) {
  const color = isBreached ? '#dc2626' : isAtRisk ? '#f59e0b' : '#16a34a';
  const label = isBreached ? 'Breached' : isAtRisk ? 'At Risk' : 'On Track';
  return (
    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: color, color: 'white', fontSize: '0.75rem' }}>
      {label}
    </span>
  );
}

function MaskedContactCell({ value }: { value?: string | null }) {
  if (!value) return <span>-</span>;
  return <span title="Contact masked for agent role">{value}</span>;
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      placeholder="Search cases..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search cases"
      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
    />
  );
}

function StatusFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const statuses = ['', 'Open_New', 'Open_Assigned', 'Open_Pending Input', 'Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate'];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Filter by status">
      {statuses.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
    </select>
  );
}

function PriorityFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Filter by priority">
      <option value="">All Priorities</option>
      <option value="P1">P1 - Critical</option>
      <option value="P2">P2 - High</option>
      <option value="P3">P3 - Normal</option>
    </select>
  );
}

function ChannelFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const channels = ['', 'Email', 'WhatsApp', 'Phone', 'Portal', 'Manual'];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Filter by channel">
      {channels.map((c) => <option key={c} value={c}>{c || 'All Channels'}</option>)}
    </select>
  );
}

function PaginationControls({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}>Next</button>
    </div>
  );
}

function CreateCaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('P2');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/caseflow/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, priority, channel: 'Manual' }),
    });
    onCreated();
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Create Case">
      <h2>Create New Case</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Subject:
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </label>
        <label>
          Priority:
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </label>
        <button type="submit">Create</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}

export default function AgentCaseQueuePage({ onCaseSelect }: Props) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (channelFilter) params.set('channel', channelFilter);
    params.set('page', String(page));
    params.set('pageSize', '25');

    const res = await fetch(`/api/caseflow/cases?${params}`);
    const data = await res.json();
    setCases(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { loadCases(); }, [page, search, statusFilter, priorityFilter, channelFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>Case Queue</h1>
        <button onClick={() => setShowCreateModal(true)}>Create Case</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} />
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <PriorityFilter value={priorityFilter} onChange={setPriorityFilter} />
        <ChannelFilter value={channelFilter} onChange={setChannelFilter} />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Case #</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Channel</th>
              <th>SLA</th>
              <th>Contact</th>
              <th>Agent</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} onClick={() => onCaseSelect(c.caseNumber)} style={{ cursor: 'pointer' }}>
                <td>{c.caseNumber}</td>
                <td>{c.subject}</td>
                <td>{c.priority}</td>
                <td>{c.status}</td>
                <td>{c.channel}</td>
                <td><SlaBadgeProgress isAtRisk={c.isAtRisk} isBreached={c.isBreached} /></td>
                <td><MaskedContactCell value={c.customerEmail} /></td>
                <td>{c.assignedAgent?.name ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <PaginationControls page={page} total={total} pageSize={25} onPage={setPage} />

      {showCreateModal && (
        <CreateCaseModal onClose={() => setShowCreateModal(false)} onCreated={loadCases} />
      )}
    </div>
  );
}
