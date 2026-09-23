/**
 * Email intake parser - extracts Subject and Body from email text or .eml files
 */

export interface ParsedEmail {
  subject: string;
  body: string;
  from?: string;
}

/** Parse an email from raw text (pasted or .eml/.txt file) */
export function parseEmail(raw: string): ParsedEmail {
  const lines = raw.split(/\r?\n/);
  let subject = '';
  let from = '';
  let bodyStart = -1;

  // Look for headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith('subject:')) {
      subject = line.slice('subject:'.length).trim();
    } else if (line.toLowerCase().startsWith('from:')) {
      from = line.slice('from:'.length).trim();
    } else if (line.trim() === '' && bodyStart === -1) {
      bodyStart = i + 1;
      break;
    }
  }

  // If no headers found, treat entire content as subject+body
  if (bodyStart === -1) {
    bodyStart = 1;
  }

  const body = lines.slice(bodyStart).join('\n').trim();

  // Fallback: use first line as subject if no Subject header
  if (!subject && lines.length > 0) {
    subject = lines[0].trim();
  }

  // If body is empty, use subject as body
  const finalBody = body || subject;

  return { subject, body: finalBody, from: from || undefined };
}
