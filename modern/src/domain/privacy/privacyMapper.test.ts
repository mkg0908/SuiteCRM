import { describe, it, expect } from 'vitest';
import { maskPhone, maskEmail, maskContactFields } from './privacyMapper.js';

describe('privacy mapper', () => {
  describe('maskPhone', () => {
    it('masks last 4 digits for agent', () => expect(maskPhone('415-555-0142', 'agent')).toBe('415-555-••••'));
    it('shows full phone for manager', () => expect(maskPhone('415-555-0142', 'manager')).toBe('415-555-0142'));
  });

  describe('maskEmail', () => {
    it('masks email for agent', () => expect(maskEmail('priya@riverahotels.com', 'agent')).toBe('p•••@riverahotels.com'));
    it('shows full email for manager', () => expect(maskEmail('priya@riverahotels.com', 'manager')).toBe('priya@riverahotels.com'));
  });

  describe('maskContactFields', () => {
    it('masks both fields for agent', () => {
      const result = maskContactFields({ customerEmail: 'priya@riverahotels.com', customerPhone: '415-555-0142' }, 'agent');
      expect(result.customerEmail).toBe('p•••@riverahotels.com');
      expect(result.customerPhone).toBe('415-555-••••');
    });

    it('preserves both fields for manager', () => {
      const result = maskContactFields({ customerEmail: 'priya@riverahotels.com', customerPhone: '415-555-0142' }, 'manager');
      expect(result.customerEmail).toBe('priya@riverahotels.com');
      expect(result.customerPhone).toBe('415-555-0142');
    });

    it('handles null fields', () => {
      const result = maskContactFields({ customerEmail: null, customerPhone: null }, 'agent');
      expect(result.customerEmail).toBeNull();
      expect(result.customerPhone).toBeNull();
    });
  });
});
