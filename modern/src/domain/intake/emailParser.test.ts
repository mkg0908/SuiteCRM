import { describe, it, expect } from 'vitest';
import { parseEmailText } from './emailParser.js';

describe('email parser', () => {
  it('parses email with subject and body', () => {
    const raw = `From: priya@riverahotels.com\nTo: support@caseflow.dev\nSubject: Payment page not loading\nDate: Mon, 23 Sep 2026 10:00:00 -0700\n\nThe payment page returns a 500 error when I try to checkout.`;
    const result = parseEmailText(raw);
    expect(result.from).toBe('priya@riverahotels.com');
    expect(result.subject).toBe('Payment page not loading');
    expect(result.body).toBe('The payment page returns a 500 error when I try to checkout.');
  });

  it('uses subject as body when body is empty', () => {
    const raw = `From: priya@riverahotels.com\nTo: support@caseflow.dev\nSubject: Payment page not loading\nDate: Mon, 23 Sep 2026 10:00:00 -0700\n\n`;
    const result = parseEmailText(raw);
    expect(result.subject).toBe('Payment page not loading');
    expect(result.body).toBe('Payment page not loading');
  });

  it('handles raw text without headers', () => {
    const raw = 'Just some plain text without any email headers.';
    const result = parseEmailText(raw);
    expect(result.body).toBe('Just some plain text without any email headers.');
  });
});
