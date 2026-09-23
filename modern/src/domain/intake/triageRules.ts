/**
 * Triage rules for omnichannel intake
 * First-match keyword classification
 */

export type TriageCategory =
  | 'urgent_issue'
  | 'question'
  | 'feature_request'
  | 'me_too'
  | 'chatter'
  | 'spam';

export type CasePriority = 'P1' | 'P2' | 'P3';

export interface TriageResult {
  category: TriageCategory;
  priority: CasePriority;
  createCase: boolean;
  attachToExisting?: boolean;
  spamHold?: boolean;
}

const URGENT_KEYWORDS = ['urgent', 'critical', 'down', 'outage', 'broken', 'emergency', 'not working'];
const QUESTION_KEYWORDS = ['how', 'what', 'when', 'why', 'where', 'can you', 'could you', '?'];
const FEATURE_KEYWORDS = ['feature request', 'would be great', 'wish', 'enhancement', 'please add', 'can you add'];
const ME_TOO_KEYWORDS = ['+1', 'same here', 'same issue', 'me too', 'having the same'];
const CHATTER_KEYWORDS = ['congrats', 'thanks', 'thank you', 'great', 'awesome', '🎉', '👍', 'lol', 'haha'];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function triageMessage(text: string, knownSender: boolean = true): TriageResult {
  if (!knownSender) {
    return { category: 'spam', priority: 'P3', createCase: false, spamHold: true };
  }

  if (matchesKeywords(text, ME_TOO_KEYWORDS)) {
    return { category: 'me_too', priority: 'P3', createCase: false, attachToExisting: true };
  }

  if (matchesKeywords(text, CHATTER_KEYWORDS)) {
    return { category: 'chatter', priority: 'P3', createCase: false };
  }

  if (matchesKeywords(text, URGENT_KEYWORDS)) {
    return { category: 'urgent_issue', priority: 'P1', createCase: true };
  }

  if (matchesKeywords(text, QUESTION_KEYWORDS)) {
    return { category: 'question', priority: 'P2', createCase: true };
  }

  if (matchesKeywords(text, FEATURE_KEYWORDS)) {
    return { category: 'feature_request', priority: 'P2', createCase: true };
  }

  // Default: create P2 case
  return { category: 'question', priority: 'P2', createCase: true };
}
