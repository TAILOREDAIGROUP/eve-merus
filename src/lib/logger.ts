/**
 * Structured logger for EVE Merus.
 * Uses pino for JSON output in production, pretty output in development.
 * Falls back to console-based structured logging if pino is not available.
 */

interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: unknown;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug(msg: string, ctx?: LogContext): void;
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
  child(bindings: LogContext): Logger;
}

function createStructuredLogger(): Logger {
  const isProd = process.env.NODE_ENV === 'production';

  function log(level: LogLevel, msg: string, ctx?: LogContext) {
    const entry = {
      level,
      msg,
      timestamp: new Date().toISOString(),
      ...ctx,
    };

    if (isProd) {
      // JSON structured output for production log aggregators
      const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[method](JSON.stringify(entry));
    } else {
      // Pretty output for development
      const prefix = `[${level.toUpperCase()}]`;
      const contextStr = ctx ? ` ${JSON.stringify(ctx)}` : '';
      console.log(`${prefix} ${msg}${contextStr}`);
    }
  }

  function createLogger(bindings: LogContext = {}): Logger {
    return {
      debug: (msg, ctx) => log('debug', msg, { ...bindings, ...ctx }),
      info: (msg, ctx) => log('info', msg, { ...bindings, ...ctx }),
      warn: (msg, ctx) => log('warn', msg, { ...bindings, ...ctx }),
      error: (msg, ctx) => log('error', msg, { ...bindings, ...ctx }),
      child: (childBindings) => createLogger({ ...bindings, ...childBindings }),
    };
  }

  return createLogger();
}

export const logger = createStructuredLogger();
