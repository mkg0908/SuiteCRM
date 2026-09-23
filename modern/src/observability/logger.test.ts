import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redactPii, logger } from './logger.js';

describe('redactPii', () => {
  it('redacts email addresses', () => {
    expect(redactPii('Contact priya@riverahotels.com for help')).not.toContain('priya@riverahotels.com');
    expect(redactPii('email: priya@riverahotels.com')).toContain('[REDACTED_EMAIL]');
  });

  it('redacts phone numbers', () => {
    expect(redactPii('Call 415-555-0142 now')).not.toContain('415-555-0142');
    expect(redactPii('phone: 415-555-0142')).toContain('[REDACTED_PHONE]');
  });

  it('leaves non-PII text unchanged', () => {
    expect(redactPii('Case CF-1001 status updated')).toBe('Case CF-1001 status updated');
  });
});

describe('logger PII redaction', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env['LOG_LEVEL'] = 'info';
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    delete process.env['LOG_LEVEL'];
  });

  it('redacts email from log message', () => {
    logger.info('Customer priya@riverahotels.com submitted a case');
    expect(stdoutSpy).toHaveBeenCalled();
    const output = String(stdoutSpy.mock.calls[0][0]);
    expect(output).not.toContain('priya@riverahotels.com');
    expect(output).toContain('[REDACTED_EMAIL]');
  });

  it('redacts phone from log message', () => {
    logger.info('Customer called from 415-555-0142');
    const output = String(stdoutSpy.mock.calls[0][0]);
    expect(output).not.toContain('415-555-0142');
    expect(output).toContain('[REDACTED_PHONE]');
  });

  it('redacts PII from meta fields', () => {
    logger.info('Case created', { email: 'priya@riverahotels.com', phone: '415-555-0142' });
    const output = String(stdoutSpy.mock.calls[0][0]);
    expect(output).not.toContain('priya@riverahotels.com');
    expect(output).not.toContain('415-555-0142');
  });
});
