/**
 * WhatsApp export parser
 * Handles bracketed [MM/DD/YYYY, HH:MM:SS] and dash MM/DD/YYYY, HH:MM:SS - formats
 */

export interface WhatsAppMessage {
  timestamp: Date;
  sender: string;
  text: string;
}

const BRACKETED_PATTERN = /^\[(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.*)/i;
const DASH_PATTERN = /^(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)/i;

const SYSTEM_PATTERNS = [
  /Messages and calls are end-to-end encrypted/i,
  /joined using this group's invite link/i,
  /was added/i,
  /left$/i,
  /changed the subject/i,
  /changed this group/i,
  /\d+ message(s)? deleted/i,
];

function isSystemLine(text: string): boolean {
  return SYSTEM_PATTERNS.some((p) => p.test(text));
}

function parseTimestamp(date: string, time: string): Date {
  // Parse MM/DD/YYYY format
  const [month, day, year] = date.split('/').map(Number);
  const timePart = time.trim();
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${convertTo24h(timePart)}:00`);
}

function convertTo24h(time: string): string {
  const ampm = time.match(/([AP]M)$/i);
  if (!ampm) return time.replace(/\s/g, '');
  const [timePart] = time.split(/\s*[AP]M/i);
  const [hours, minutes] = timePart.trim().split(':').map(Number);
  const isPM = ampm[1].toUpperCase() === 'PM';
  let h = hours;
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export interface ParseWhatsAppResult {
  messages: WhatsAppMessage[];
  skippedSystemLines: number;
}

export function parseWhatsAppExport(raw: string): ParseWhatsAppResult {
  const lines = raw.split(/\r?\n/);
  const messages: WhatsAppMessage[] = [];
  let skippedSystemLines = 0;
  let currentMessage: WhatsAppMessage | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const bracketedMatch = line.match(BRACKETED_PATTERN);
    const dashMatch = !bracketedMatch && line.match(DASH_PATTERN);
    const match = bracketedMatch || dashMatch;

    if (match) {
      // Save previous message
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, datePart, timePart, sender, text] = match;
      const senderName = sender.trim();

      if (isSystemLine(text)) {
        skippedSystemLines++;
        currentMessage = null;
        continue;
      }

      currentMessage = {
        timestamp: parseTimestamp(datePart, timePart),
        sender: senderName,
        text: text.trim(),
      };
    } else if (currentMessage) {
      // Continuation line (no timestamp = continuation of previous message)
      currentMessage.text += '\n' + line.trim();
    }
    // Lines before first timestamp are skipped
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return { messages, skippedSystemLines };
}
