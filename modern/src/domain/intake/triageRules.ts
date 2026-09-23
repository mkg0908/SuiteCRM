import type { WhatsAppMessage } from './whatsappParser.js';

export type TriageResult = 'spam' | 'urgent' | 'question' | 'feature' | 'me_too' | 'chatter' | 'other';

interface TriageRule {
  classification: TriageResult;
  patterns: RegExp[];
  requiresUnknownSender?: boolean;
}

const KNOWN_SENDERS = new Set<string>();

export function setKnownSenders(senders: string[]): void {
  KNOWN_SENDERS.clear();
  senders.forEach(s => KNOWN_SENDERS.add(s.toLowerCase()));
}

const TRIAGE_RULES: TriageRule[] = [
  {
    classification: 'spam',
    patterns: [/verify\s+now/i, /click\s+here\s+to\s+verify/i, /verify\s+(?:my|your)\s+account/i],
    requiresUnknownSender: true,
  },
  {
    classification: 'urgent',
    patterns: [/\burgent\b/i, /\bdown\b/i, /can'?t\s+checkout/i, /system\s+is\s+down/i, /emergency/i],
  },
  {
    classification: 'question',
    patterns: [/\bhow\s+do\s+I\b/i, /\bquestion\b/i, /\bhow\s+can\s+I\b/i, /\bquick\s+question\b/i],
  },
  {
    classification: 'feature',
    patterns: [/\blove\s+to\s+see\b/i, /\bfeature\b/i, /\bwish\b/i, /\bwould\s+be\s+(nice|great)\b/i],
  },
  {
    classification: 'me_too',
    patterns: [/^\+1\b/i, /\bsame\s+here\b/i, /\bme\s+too\b/i],
  },
  {
    classification: 'chatter',
    patterns: [/\bcongrats\b/i, /🎉/, /\blol\b/i, /\bhaha\b/i, /^(nice|cool|awesome|great)!*$/i],
  },
];

export function classifyMessage(text: string, sender: string): TriageResult {
  const senderLower = sender.toLowerCase();

  for (const rule of TRIAGE_RULES) {
    if (rule.requiresUnknownSender && KNOWN_SENDERS.has(senderLower)) {
      continue;
    }
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return rule.classification;
      }
    }
  }

  return 'other';
}

export function triageWhatsAppMessages(
  messages: WhatsAppMessage[],
): Array<WhatsAppMessage & { classification: TriageResult }> {
  return messages
    .filter(m => !m.isSystemLine)
    .map(m => ({
      ...m,
      classification: classifyMessage(m.text, m.sender),
    }));
}
