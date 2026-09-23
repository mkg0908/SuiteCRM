export interface WhatsAppMessage {
  timestamp: string;
  sender: string;
  text: string;
  isSystemLine: boolean;
  isContinuation: boolean;
}

const BRACKETED_RE =
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]\s+([^:]+):\s*(.*)$/i;
const DASH_RE =
  /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*([^:]+):\s*(.*)$/i;

const SYSTEM_PATTERNS = [
  /end-to-end encrypted/i,
  /joined using/i,
  /left$/i,
  /added\s/i,
  /removed\s/i,
  /changed the subject/i,
  /changed this group/i,
  /created group/i,
];

function isSystemMessage(text: string): boolean {
  return SYSTEM_PATTERNS.some(pattern => pattern.test(text));
}

export function parseWhatsAppExport(raw: string): WhatsAppMessage[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
  const messages: WhatsAppMessage[] = [];

  for (const line of lines) {
    let match = BRACKETED_RE.exec(line);
    if (!match) {
      match = DASH_RE.exec(line);
    }

    if (match) {
      const [, timestamp, sender, text] = match;
      const isSystem = isSystemMessage(text);
      messages.push({
        timestamp,
        sender: sender.trim(),
        text: text.trim(),
        isSystemLine: isSystem,
        isContinuation: false,
      });
    } else {
      if (messages.length > 0) {
        messages[messages.length - 1].text += '\n' + line.trim();
      }
    }
  }

  return messages;
}
