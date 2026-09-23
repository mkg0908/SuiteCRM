import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, setLogLevel } from './logger.js';

describe('logger', () => {
  beforeEach(() => {
    setLogLevel('debug');
    vi.restoreAllMocks();
  });

  it('redacts email addresses', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('User priya@riverahotels.com logged in');
    const output = spy.mock.calls[0][0];
    expect(output).not.toContain('priya@riverahotels.com');
    expect(output).toContain('[REDACTED_EMAIL]');
  });

  it('redacts phone numbers', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('Called 415-555-0142');
    const output = spy.mock.calls[0][0];
    expect(output).not.toContain('415-555-0142');
    expect(output).toContain('[REDACTED_PHONE]');
  });

  it('redacts PII in metadata', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('User action', { email: 'priya@riverahotels.com', phone: '415-555-0142' });
    const output = spy.mock.calls[0][0];
    expect(output).not.toContain('priya@riverahotels.com');
    expect(output).not.toContain('415-555-0142');
  });

  it('respects log level', () => {
    setLogLevel('error');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('Should not appear');
    expect(spy).not.toHaveBeenCalled();
  });
});
