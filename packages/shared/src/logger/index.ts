/**
 * Logger abstraction for Weave framework
 * Provides structured logging with multiple log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Console-based logger implementation
 */
export class ConsoleLogger implements ILogger {
  private readonly minLevel: number;

  public constructor(level: LogLevel = 'info') {
    this.minLevel = LOG_LEVELS[level];
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVELS['debug'] >= this.minLevel) {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVELS['info'] >= this.minLevel) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, context);
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVELS['warn'] >= this.minLevel) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  public error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (LOG_LEVELS['error'] >= this.minLevel) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] ${message}: ${errorMessage}`, context);
    }
  }
}

/**
 * No-op logger for production
 */
export class NoOpLogger implements ILogger {
  public debug(): void {
    // No-op
  }

  public info(): void {
    // No-op
  }

  public warn(): void {
    // No-op
  }

  public error(): void {
    // No-op
  }
}

/**
 * Global logger instance
 */
let globalLogger: ILogger = new ConsoleLogger('info');

/**
 * Set the global logger instance
 */
export function setLogger(logger: ILogger): void {
  globalLogger = logger;
}

/**
 * Get the global logger instance
 */
export function getLogger(): ILogger {
  return globalLogger;
}
