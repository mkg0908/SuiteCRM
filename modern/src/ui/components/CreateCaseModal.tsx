import React, { useState } from 'react';
interface CreateCaseModalProps { isOpen: boolean; onClose: () => void; onCreated: () => void; }
export function CreateCaseModal({ isOpen, onClose, onCreated }: CreateCaseModalProps) {
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('P2');
  const [channel, setChannel] = useState('Web');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/caseflow/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, priority, channel, description: description || undefined }) });
      if (res.ok) { onCreated(); onClose(); setSubject(''); setDescription(''); }
    } finally { setLoading(false); }
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#666' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '480px', maxWidth: '90vw' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Create New Case</h2>
        <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Subject *</label><input value={subject} onChange={e => setSubject(e.target.value)} required style={inputStyle} /></div>
        <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>Priority</label><select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}><option value="P1">P1 - Critical</option><option value="P2">P2 - High</option><option value="P3">P3 - Normal</option></select></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Channel</label><select value={channel} onChange={e => setChannel(e.target.value)} style={inputStyle}><option value="Email">Email</option><option value="WhatsApp">WhatsApp</option><option value="Phone">Phone</option><option value="Web">Web</option></select></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading || !subject} style={{ padding: '8px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{loading ? 'Creating...' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
}
