import React from 'react';
interface PriorityFilterProps { value: string; onChange: (value: string) => void; }
export function PriorityFilter({ value, onChange }: PriorityFilterProps) {
  return <select value={value} onChange={e => onChange(e.target.value)} aria-label="Filter by priority" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}><option value="">All Priorities</option><option value="P1">P1 - Critical</option><option value="P2">P2 - High</option><option value="P3">P3 - Normal</option></select>;
}
