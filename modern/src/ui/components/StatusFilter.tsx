import React from 'react';
const STATUSES = ['', 'Open_New', 'Open_Assigned', 'Open_Pending Input', 'Closed_Closed', 'Closed_Rejected', 'Closed_Duplicate'];
const LABELS: Record<string, string> = { '': 'All Statuses', 'Open_New': 'New', 'Open_Assigned': 'Assigned', 'Open_Pending Input': 'Pending Input', 'Closed_Closed': 'Closed', 'Closed_Rejected': 'Rejected', 'Closed_Duplicate': 'Duplicate' };
interface StatusFilterProps { value: string; onChange: (value: string) => void; }
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return <select value={value} onChange={e => onChange(e.target.value)} aria-label="Filter by status" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>{STATUSES.map(s => <option key={s} value={s}>{LABELS[s]}</option>)}</select>;
}
