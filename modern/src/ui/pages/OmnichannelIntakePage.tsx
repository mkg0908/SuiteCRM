import React, { useState } from 'react';

type Channel = 'email' | 'whatsapp';

interface IntakeSummary {
  casesCreated?: number;
  subject?: string;
  channel?: string;
  caseNumber?: string;
  maskedEmail?: string | null;
  messagesRead?: number;
  updatesAttached?: number;
  chatterSkipped?: number;
  spamHeld?: number;
  piiMasked?: number;
}

export default function OmnichannelIntakePage() {
  const [channel, setChannel] = useState<Channel>('email');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<IntakeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSummary(null);
    setLoading(true);

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else {
      formData.append('content', content);
    }

    try {
      const endpoint = channel === 'email' ? '/api/caseflow/intake/email' : '/api/caseflow/intake/whatsapp';
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Intake failed');
      } else {
        setSummary(data);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Omnichannel Intake</h1>

      <div>
        <button onClick={() => setChannel('email')} style={{ fontWeight: channel === 'email' ? 'bold' : 'normal' }}>Email</button>
        <button onClick={() => setChannel('whatsapp')} style={{ fontWeight: channel === 'whatsapp' ? 'bold' : 'normal' }}>WhatsApp</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Upload {channel === 'email' ? '.eml/.txt' : '.txt'} file:
            <input
              type="file"
              accept={channel === 'email' ? '.eml,.txt' : '.txt'}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div>
          <label>
            Or paste {channel === 'email' ? 'email' : 'WhatsApp export'} text:
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              style={{ width: '100%' }}
              placeholder={channel === 'email' ? 'Subject: ...\n\nBody...' : '[01/15/2024, 10:00:00] John: Hello...'}
            />
          </label>
        </div>
        <button type="submit" disabled={loading || (!content.trim() && !file)}>
          {loading ? 'Processing...' : 'Process Intake'}
        </button>
      </form>

      {error && <div role="alert" style={{ color: '#dc2626' }}>{error}</div>}

      {summary && (
        <div>
          <h2>Intake Summary</h2>
          {channel === 'email' ? (
            <dl>
              <dt>Cases Created</dt><dd>{summary.casesCreated}</dd>
              <dt>Case Number</dt><dd>{summary.caseNumber}</dd>
              <dt>Subject</dt><dd>{summary.subject}</dd>
              {summary.maskedEmail && <><dt>Customer Email</dt><dd>{summary.maskedEmail}</dd></>}
            </dl>
          ) : (
            <dl>
              <dt>Messages Read</dt><dd>{summary.messagesRead}</dd>
              <dt>Cases Created</dt><dd>{summary.casesCreated}</dd>
              <dt>Updates Attached</dt><dd>{summary.updatesAttached}</dd>
              <dt>Chatter Skipped</dt><dd>{summary.chatterSkipped}</dd>
              <dt>Spam Held</dt><dd>{summary.spamHeld}</dd>
              <dt>PII Masked</dt><dd>{summary.piiMasked}</dd>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
