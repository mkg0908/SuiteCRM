export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export function parseEmailText(raw: string): ParsedEmail {
  const lines = raw.split(/\r?\n/);
  let headerEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      headerEnd = i;
      break;
    }
  }

  if (headerEnd === -1) {
    return { from: '', to: '', subject: '', body: raw.trim(), date: '' };
  }

  const headers: Record<string, string> = {};
  for (let i = 0; i < headerEnd; i++) {
    const match = lines[i].match(/^([^:]+):\s*(.*)$/);
    if (match) {
      headers[match[1].toLowerCase()] = match[2].trim();
    }
  }

  const body = lines.slice(headerEnd + 1).join('\n').trim();
  const subject = headers['subject'] || '';

  return {
    from: headers['from'] || '',
    to: headers['to'] || '',
    subject,
    body: body || subject,
    date: headers['date'] || '',
  };
}
