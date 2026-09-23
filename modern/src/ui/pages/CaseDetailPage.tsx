import React, { useState, useEffect } from 'react';
import { MaskedContactCell } from '../components/MaskedContactCell.js';
import { SlaBadgeProgress } from '../components/SlaBadgeProgress.js';
import { ConflictAlert } from '../components/ConflictAlert.js';

interface CaseDetailPageProps { caseNumber: string; onBack: () => void; }

export function CaseDetailPage({ caseNumber, onBack }: CaseDetailPageProps) {
  const [caseData, setCaseData] = useState<any>(null);
  const [updateText, setUpdateText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);

  useEffect(() => { fetch(`/api/caseflow/cases/${caseNumber}`).then(r => r.json()).then(setCaseData); }, [caseNumber]);

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return;
    const res = await fetch(`/api/caseflow/cases/${caseNumber}/updates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: updateText, internal: isInternal }) });
    if (res.ok) { setUpdateText(''); setIsInternal(false); const refreshed = await fetch(`/api/caseflow/cases/${caseNumber}`); setCaseData(await refreshed.json()); }
  };

  const handleStatusChange = async (newStatus: string) => {
    setConflict(null);
    const res = await fetch(`/api/caseflow/cases/${caseNumber}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    if (res.status === 409) { const err = await res.json(); setConflict(err.message); }
    else if (res.ok) { setCaseData(await res.json()); }
  };

  if (!caseData) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#e94560' }}>&larr; Back to Queue</button>
      {conflict && <ConflictAlert message={conflict} onDismiss={() => setConflict(null)} />}
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}><h2>{caseData.caseNumber}: {caseData.subject}</h2><SlaBadgeProgress isAtRisk={caseData.isAtRisk} isBreached={caseData.isBreached} slaDueAt={caseData.slaDueAt} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div><strong>Status:</strong> {caseData.status}</div><div><strong>State:</strong> {caseData.state}</div><div><strong>Priority:</strong> {caseData.priority}</div>
          <div><strong>Channel:</strong> {caseData.channel || '-'}</div><div><strong>Email:</strong> <MaskedContactCell value={caseData.customerEmail} label="Customer email" /></div><div><strong>Phone:</strong> <MaskedContactCell value={caseData.customerPhone} label="Customer phone" /></div>
        </div>
        {caseData.description && <p style={{ marginBottom: '16px', color: '#666' }}>{caseData.description}</p>}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Open_Assigned', 'Open_Pending Input', 'Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate'].map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} style={{ padding: '4px 12px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>{s.split('_').slice(1).join(' ')}</button>
          ))}
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '12px' }}>Updates</h3>
        {(caseData.updates || []).map((u: any) => (
          <div key={u.id} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><strong>{u.author}</strong><span style={{ color: '#999', fontSize: '12px' }}>{new Date(u.createdAt).toLocaleString()}</span></div>
            {u.internal && <span style={{ color: '#e94560', fontSize: '12px', fontWeight: 600 }}>[Internal]</span>}
            <p>{u.text}</p>
          </div>
        ))}
        <div style={{ marginTop: '16px' }}>
          <textarea value={updateText} onChange={e => setUpdateText(e.target.value)} rows={3} placeholder="Add an update..." style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px' }}><input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ marginRight: '4px' }} />Internal note</label>
            <button onClick={handleAddUpdate} style={{ padding: '8px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Update</button>
          </div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Audit Trail</h3>
        {(caseData.auditEvents || []).map((e: any) => (
          <div key={e.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{e.user}</strong> changed <em>{e.field}</em> from &quot;{e.oldValue || '-'}&quot; to &quot;{e.newValue || '-'}&quot;</span>
            <span style={{ color: '#999' }}>{new Date(e.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
