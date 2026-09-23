import React from 'react';
interface ChannelFilterProps { value: string; onChange: (value: string) => void; }
export function ChannelFilter({ value, onChange }: ChannelFilterProps) {
  return <select value={value} onChange={e => onChange(e.target.value)} aria-label="Filter by channel" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}><option value="">All Channels</option><option value="Email">Email</option><option value="WhatsApp">WhatsApp</option><option value="Phone">Phone</option><option value="Web">Web</option></select>;
}
