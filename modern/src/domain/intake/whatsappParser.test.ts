import { describe, it, expect } from 'vitest';
import { parseWhatsAppExport } from './whatsappParser.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('WhatsApp parser', () => {
  it('parses bracketed timestamp format', () => {
    const raw = `[9/22/26, 10:15:32 AM] Sofia Reyes: URGENT: Payment system is down!`;
    const messages = parseWhatsAppExport(raw);
    expect(messages).toHaveLength(1);
    expect(messages[0].sender).toBe('Sofia Reyes');
    expect(messages[0].text).toBe('URGENT: Payment system is down!');
    expect(messages[0].isSystemLine).toBe(false);
  });

  it('parses dash timestamp format', () => {
    const raw = `9/22/26, 10:20:00 AM - Lena Park: Also the font size is too small`;
    const messages = parseWhatsAppExport(raw);
    expect(messages).toHaveLength(1);
    expect(messages[0].sender).toBe('Lena Park');
  });

  it('detects system/encryption lines', () => {
    const raw = `[9/22/26, 10:17:02 AM] Seller Hub Support: Messages and calls are end-to-end encrypted. No one outside of this chat can read them.`;
    const messages = parseWhatsAppExport(raw);
    expect(messages[0].isSystemLine).toBe(true);
  });

  it('handles continuation lines', () => {
    const raw = `[9/22/26, 10:15:32 AM] Sofia Reyes: URGENT: Payment system is down!\nWe need help immediately!`;
    const messages = parseWhatsAppExport(raw);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toContain('We need help immediately!');
  });

  it('parses the full sample fixture', () => {
    const fixturePath = join(__dirname, '../../../test/fixtures/whatsapp-sample.txt');
    let raw: string;
    try { raw = readFileSync(fixturePath, 'utf-8'); } catch { return; }
    const messages = parseWhatsAppExport(raw);
    expect(messages.length).toBeGreaterThan(0);
    const sofia = messages.find(m => m.sender === 'Sofia Reyes');
    expect(sofia).toBeDefined();
    expect(sofia!.text).toContain('URGENT');
    const system = messages.find(m => m.sender === 'Seller Hub Support');
    expect(system).toBeDefined();
    expect(system!.isSystemLine).toBe(true);
  });
});
