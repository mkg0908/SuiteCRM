/**
 * CaseFlow structured logger with PII redaction
 * Redacts email and phone patterns before stdout/stderr emission
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Redaction patterns
const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi;
const PHONE_PATTERN = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

export function redactPii(text: string): string {
  return text
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(PHONE_PATTERN, '[REDACTED_PHONE]');
}

function getLogLevel(): LogLevel {
  const level = (process.env['LOG_LEVEL'] ?? 'info').toLowerCase() as LogLevel;
  return LEVEL_ORDER[level] !== undefined ? level : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] <= LEVEL_ORDER[getLogLevel()];
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const redacted = redactPii(message);
  const entry: Record<string, unknown> = {
    level,
    message: redacted,
    timestamp: new Date().toISOString(),
  };
  if (meta) {
    // Redact meta values that are strings
    const redactedMeta: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meta)) {
      redactedMeta[k] = typeof v === 'string' ? redactPii(v) : v;
    }
    entry['meta'] = redactedMeta;
  }
  return JSON.stringify(entry);
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      process.stderr.write(formatMessage('error', message, meta) + '\n');
    }
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      process.stderr.write(formatMessage('warn', message, meta) + '\n');
    }
  },
  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      process.stdout.write(formatMessage('info', message, meta) + '\n');
    }
  },
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      process.stdout.write(formatMessage('debug', message, meta) + '\n');
    }
  },
};
