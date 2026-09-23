import { describe, it, expect } from 'vitest';
import { maskEmail, maskPhone, applyContactMasking } from './privacyMapper.js';

describe('maskEmail', () => {
  it('masks priya@riverahotels.com -> p•••@riverahotels.com', () => {
    expect(maskEmail('priya@riverahotels.com')).toBe('p•••@riverahotels.com');
  });
  it('masks any email keeping first char and domain', () => {
    const result = maskEmail('alice@example.com');
    expect(result).toMatch(/^a•{3}@example\.com$/);
  });
});

describe('maskPhone', () => {
  it('masks 415-555-0142 -> 415-555-••••', () => {
    expect(maskPhone('415-555-0142')).toBe('415-555-••••');
  });
  it('masks last 4 digits', () => {
    const result = maskPhone('800-123-4567');
    expect(result).toMatch(/••••$/);
  });
});

describe('applyContactMasking', () => {
  const record = {
    id: '1',
    subject: 'Test',
    customerEmail: 'priya@riverahotels.com',
    customerPhone: '415-555-0142',
  };

  it('masks contacts for agent role', () => {
    const result = applyContactMasking(record, 'agent');
    expect(result.customerEmail).toBe('p•••@riverahotels.com');
    expect(result.customerPhone).toBe('415-555-••••');
  });

  it('does not mask contacts for manager role', () => {
    const result = applyContactMasking(record, 'manager');
    expect(result.customerEmail).toBe('priya@riverahotels.com');
    expect(result.customerPhone).toBe('415-555-0142');
  });

  it('handles null contacts', () => {
    const nullRecord = { ...record, customerEmail: null, customerPhone: null };
    const result = applyContactMasking(nullRecord, 'agent');
    expect(result.customerEmail).toBeNull();
    expect(result.customerPhone).toBeNull();
  });
});
