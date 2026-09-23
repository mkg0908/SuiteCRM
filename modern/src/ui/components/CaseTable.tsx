import React from 'react';
import { SlaBadgeProgress } from './SlaBadgeProgress.js';

interface CaseRow { caseNumber: string; subject: string; priority: string; status: string; state: string; channel?: string; isAtRisk: boolean; isBreached: boolean; slaDueAt: string | null; dateModified: string; }
interface CaseTableProps { cases: CaseRow[]; onViewCase: (caseNumber: string) => void; }

const STATUS_COLORS: Record<string, string> = { Open_New: '#3498db', Open_Assigned: '#2ecc71', 'Open_Pending Input': '#f39c12', Closed_Closed: '#95a5a6', Closed_Rejected: '#e74c3c', Closed_Duplicate: '#9b59b6' };
const PRIORITY_COLORS: Record<string, string> = { P1: '#e74c3c', P2: '#f39c12', P3: '#3498db' };
const thStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#666' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '14px' };
const badgeStyle: React.CSSProperties = { color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 };

export function CaseTable({ cases, onViewCase }: CaseTableProps) {
  if (cases.length === 0) return <p style={{ padding: '24px', textAlign: 'center', color: '#999' }}>No cases found</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
      <thead><tr style={{ background: '#f8f9fa', textAlign: 'left' }}><th style={thStyle}>Case #</th><th style={thStyle}>Subject</th><th style={thStyle}>Priority</th><th style={thStyle}>Status</th><th style={thStyle}>Channel</th><th style={thStyle}>SLA</th><th style={thStyle}>Modified</th></tr></thead>
      <tbody>
        {cases.map(c => (
          <tr key={c.caseNumber} onClick={() => onViewCase(c.caseNumber)} style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}>
            <td style={tdStyle}><strong>{c.caseNumber}</strong></td>
            <td style={tdStyle}>{c.subject}</td>
            <td style={tdStyle}><span style={{ ...badgeStyle, background: PRIORITY_COLORS[c.priority] || '#999' }}>{c.priority}</span></td>
            <td style={tdStyle}><span style={{ ...badgeStyle, background: STATUS_COLORS[c.status] || '#999' }}>{c.status.split('_').slice(1).join(' ')}</span></td>
            <td style={tdStyle}>{c.channel || '-'}</td>
            <td style={tdStyle}><SlaBadgeProgress isAtRisk={c.isAtRisk} isBreached={c.isBreached} slaDueAt={c.slaDueAt} /></td>
            <td style={tdStyle}>{new Date(c.dateModified).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
