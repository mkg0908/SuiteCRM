import { describe, it, expect, beforeEach } from 'vitest';
import { classifyMessage, setKnownSenders } from './triageRules.js';

describe('triage rules', () => {
  beforeEach(() => setKnownSenders(['sofia reyes', 'dan kim', 'lena park']));

  it('classifies urgent messages', () => expect(classifyMessage('URGENT: Our entire payment system is down!', 'Sofia Reyes')).toBe('urgent'));
  it('classifies questions', () => expect(classifyMessage('how do I export my monthly report?', 'Dan Kim')).toBe('question'));
  it('classifies feature requests', () => expect(classifyMessage("We'd love to see a dark mode option", 'Lena Park')).toBe('feature'));
  it('classifies me-too messages', () => expect(classifyMessage('+1 same here', 'Omar Ali')).toBe('me_too'));
  it('classifies chatter', () => expect(classifyMessage('congrats!! 🎉', 'Marco Diaz')).toBe('chatter'));
  it('holds spam from unknown senders', () => expect(classifyMessage('verify now', 'Unknown Person')).toBe('spam'));
  it('does NOT classify verify as spam from known senders', () => expect(classifyMessage('Can you verify my account?', 'Sofia Reyes')).not.toBe('spam'));
  it('first-match wins: urgent before question', () => expect(classifyMessage('URGENT question: how do I fix this?', 'Dan Kim')).toBe('urgent'));
  it('classifies other messages', () => expect(classifyMessage('Hello, I need help with my order', 'Someone')).toBe('other'));
});
