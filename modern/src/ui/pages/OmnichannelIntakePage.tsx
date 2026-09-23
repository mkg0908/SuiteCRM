import React, { useState } from 'react';

export function OmnichannelIntakePage() {
  const [mode, setMode] = useState<'email' | 'whatsapp'>('email');
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`/api/caseflow/intake/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      setResult(await res.json());
    } finally { setLoading(false); }
  };

  const metricCard: React.CSSProperties = { background: '#f8f9fa', padding: '16px', borderRadius: '8px', textAlign: 'center' };
  const metricLabel: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' };
  const metricValue: React.CSSProperties = { fontSize: '28px', fontWeight: 700 };

  return (
    <div>
      <h2 style={{ marginBottom: '16px', fontSize: '24px' }}>Omnichannel Intake</h2>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => setMode('email')} style={{ padding: '8px 16px', background: mode === 'email' ? '#1a1a2e' : '#eee', color: mode === 'email' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Email</button>
        <button onClick={() => setMode('whatsapp')} style={{ padding: '8px 16px', background: mode === 'whatsapp' ? '#1a1a2e' : '#eee', color: mode === 'whatsapp' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>WhatsApp</button>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={10} placeholder={mode === 'email' ? 'Paste email content here...' : 'Paste WhatsApp export here...'} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }} />
      <button onClick={handleSubmit} disabled={loading || !text.trim()} style={{ padding: '10px 24px', background: '#e94560', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>{loading ? 'Processing...' : 'Process Intake'}</button>
      {result && (
        <div style={{ marginTop: '24px', background: 'white', padding: '24px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px' }}>Import Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={metricCard}><span style={metricLabel}>Messages Read</span><span style={metricValue}>{result.messagesRead}</span></div>
            <div style={metricCard}><span style={metricLabel}>Cases Created</span><span style={metricValue}>{result.casesCreated}</span></div>
            <div style={metricCard}><span style={metricLabel}>Updates Attached</span><span style={metricValue}>{result.updatesAttached}</span></div>
            <div style={metricCard}><span style={metricLabel}>Chatter Skipped</span><span style={metricValue}>{result.chatterSkipped}</span></div>
            <div style={metricCard}><span style={metricLabel}>Spam Held</span><span style={metricValue}>{result.spamHeld}</span></div>
            <div style={metricCard}><span style={metricLabel}>PII Masked</span><span style={metricValue}>{result.piiMasked}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
