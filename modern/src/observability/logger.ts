const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function redact(message: string): string {
  return message.replace(EMAIL_REGEX, '[REDACTED_EMAIL]').replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const redactedMessage = redact(message);
  const metaStr = meta ? ` ${redact(JSON.stringify(meta))}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${redactedMessage}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message, meta));
    }
  },
  info(message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.info) {
      console.info(formatMessage('info', message, meta));
    }
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[currentLevel] <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(formatMessage('error', message, meta));
  },
};
