import React, { useEffect, useState } from 'react';

interface CaseUpdate {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  internal: boolean;
}

interface AuditEvent {
  id: string;
  userId: string;
  timestamp: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  action: string;
}

interface CaseDetail {
  id: string;
  caseNumber: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  state: string;
  channel: string;
  category?: string;
  isAtRisk: boolean;
  isBreached: boolean;
  customerEmail?: string | null;
  customerPhone?: string | null;
  updates: CaseUpdate[];
  auditEvents: AuditEvent[];
}

function ConflictAlert({ message }: { message: string }) {
  return (
    <div role="alert" style={{ backgroundColor: '#fee2e2', border: '1px solid #dc2626', padding: '1rem', borderRadius: '4px', color: '#dc2626' }}>
      <strong>Transition Conflict:</strong> {message}
    </div>
  );
}

interface Props {
  caseNumber: string;
  onBack: () => void;
  customerFacing?: boolean;
}

export default function CaseDetailPage({ caseNumber, onBack, customerFacing = false }: Props) {
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    fetch(`/api/caseflow/cases/${caseNumber}`)
      .then((r) => r.json())
      .then(setCaseData)
      .catch(() => setError('Failed to load case'));
  }, [caseNumber]);

  const handleStatusChange = async () => {
    setConflictMessage(null);
    const res = await fetch(`/api/caseflow/cases/${caseNumber}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, userId: 'current-user' }),
    });
    if (res.status === 409) {
      const data = await res.json();
      setConflictMessage(data.message);
    } else if (res.ok) {
      const updated = await res.json();
      setCaseData((prev) => prev ? { ...prev, status: updated.status, state: updated.state } : prev);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/caseflow/cases/${caseNumber}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'Current User', text: updateText, internal: isInternal }),
    });
    setUpdateText('');
    // Reload case data
    const res = await fetch(`/api/caseflow/cases/${caseNumber}`);
    const data = await res.json();
    setCaseData(data);
  };

  if (error) return <div><button onClick={onBack}>Back</button><p>{error}</p></div>;
  if (!caseData) return <div>Loading...</div>;

  const visibleUpdates = customerFacing
    ? caseData.updates.filter((u) => !u.internal)
    : caseData.updates;

  return (
    <div>
      <button onClick={onBack}>← Back to Queue</button>
      <h1>{caseData.caseNumber}: {caseData.subject}</h1>

      <div>
        <p><strong>State:</strong> {caseData.state} (derived from status)</p>
        <p><strong>Status:</strong> {caseData.status}</p>
        <p><strong>Priority:</strong> {caseData.priority}</p>
        <p><strong>Channel:</strong> {caseData.channel}</p>
        {caseData.isBreached && <span style={{ color: '#dc2626' }}>SLA BREACHED</span>}
        {caseData.isAtRisk && <span style={{ color: '#f59e0b' }}>SLA AT RISK</span>}
      </div>

      {!customerFacing && (
        <div>
          <h3>Customer Contact</h3>
          <p>Email: {caseData.customerEmail ?? '-'}</p>
          <p>Phone: {caseData.customerPhone ?? '-'}</p>
        </div>
      )}

      {conflictMessage && <ConflictAlert message={conflictMessage} />}

      <div>
        <h3>Status Transition</h3>
        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
          <option value="">Select status</option>
          <option value="Open_Assigned">Open_Assigned</option>
          <option value="Open_Pending Input">Open_Pending Input</option>
          <option value="Closed_Closed">Closed_Closed</option>
          <option value="Closed_Rejected">Closed_Rejected</option>
          <option value="Closed_Duplicate">Closed_Duplicate</option>
        </select>
        <button onClick={handleStatusChange} disabled={!newStatus}>Update Status</button>
      </div>

      <h3>Updates</h3>
      <div>
        {visibleUpdates.map((u) => (
          <div key={u.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>
            <strong>{u.author}</strong>
            {u.internal && !customerFacing && <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>[Internal]</span>}
            <span style={{ marginLeft: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              {new Date(u.timestamp).toLocaleString()}
            </span>
            <p>{u.text}</p>
          </div>
        ))}
      </div>

      <h3>Add Update</h3>
      <form onSubmit={handleAddUpdate}>
        <textarea
          value={updateText}
          onChange={(e) => setUpdateText(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
          placeholder="Type your update..."
        />
        {!customerFacing && (
          <label>
            <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
            Internal note
          </label>
        )}
        <button type="submit" disabled={!updateText.trim()}>Add Update</button>
      </form>

      {!customerFacing && (
        <>
          <h3>Audit Trail</h3>
          <table>
            <thead><tr><th>Time</th><th>User</th><th>Field</th><th>Old Value</th><th>New Value</th></tr></thead>
            <tbody>
              {caseData.auditEvents.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                  <td>{a.userId}</td>
                  <td>{a.field}</td>
                  <td>{a.oldValue ?? '-'}</td>
                  <td>{a.newValue ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
