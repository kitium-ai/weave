/**
 * Comprehensive Logger for Weave Framework
 * Provides structured logging with multiple log levels and error handling
 */

import type { WeaveError } from '../errors/index.js';
import { isWeaveError } from '../errors/index.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext extends Record<string, unknown> {}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  errorName?: string;
  errorCode?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Core logger interface
 */
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
  fatal: 4,
};

/**
 * Console-based logger implementation with full logging support
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

/**
 * Debug level logging
 * @param message - Log message
 * @param context - Optional context object
 */
export function logDebug(message: string, context?: LogContext): void {
  getLogger().debug(message, context);
}

/**
 * Info level logging
 * @param message - Log message
 * @param context - Optional context object
 */
export function logInfo(message: string, context?: LogContext): void {
  getLogger().info(message, context);
}

/**
 * Warning level logging
 * @param message - Log message
 * @param context - Optional context object
 */
export function logWarn(message: string, context?: LogContext): void {
  getLogger().warn(message, context);
}

/**
 * Error level logging with error object support
 * @param message - Log message
 * @param error - Error object or unknown error
 * @param context - Optional context object
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  // Handle Weave errors specially
  if (error && isWeaveError(error)) {
    getLogger().error(message, error, {
      ...context,
      errorName: error.name,
      errorCode: error.code,
      statusCode: error.statusCode,
      errorContext: error.context,
    });
  } else {
    getLogger().error(message, error, context);
  }
}

/**
 * Fatal level logging - indicates unrecoverable error
 * @param message - Log message
 * @param error - Error object or unknown error
 * @param context - Optional context object
 */
export function logFatal(message: string, error?: Error | unknown, context?: LogContext): void {
  logError(`[FATAL] ${message}`, error, context);
}

/**
 * Log WeaveError specifically with all error details
 * @param message - Log message
 * @param error - WeaveError instance
 * @param context - Optional context object
 */
export function logWeaveError(message: string, error: WeaveError, context?: LogContext): void {
  logError(message, error, {
    ...context,
    errorCode: error.code,
    statusCode: error.statusCode,
    errorContext: error.context,
  });
}

/**
 * Rate limit error logging with retry information
 * @param message - Log message
 * @param retryAfter - Time in milliseconds before retry
 * @param context - Optional context object
 */
export function logRateLimitError(
  message: string,
  retryAfter?: number,
  context?: LogContext
): void {
  logWarn(message, {
    ...context,
    errorType: 'RATE_LIMIT',
    retryAfter,
  });
}

/**
 * Authentication error logging (sensitive data aware)
 * @param message - Log message
 * @param context - Optional context object
 */
export function logAuthenticationError(message: string, context?: LogContext): void {
  logError(message, undefined, {
    ...context,
    securitySensitive: true,
    errorType: 'AUTHENTICATION_ERROR',
  });
}

/**
 * Timeout error logging with duration information
 * @param message - Log message
 * @param duration - Timeout duration in milliseconds
 * @param context - Optional context object
 */
export function logTimeoutError(message: string, duration?: number, context?: LogContext): void {
  logWarn(message, {
    ...context,
    errorType: 'TIMEOUT',
    duration,
  });
}

/**
 * Validation error logging
 * @param message - Log message
 * @param context - Optional context object with validation details
 */
export function logValidationError(message: string, context?: LogContext): void {
  logWarn(message, {
    ...context,
    errorType: 'VALIDATION_ERROR',
  });
}

/**
 * Provider-specific error logging
 * @param message - Log message
 * @param providerName - Name of the provider that failed
 * @param error - Error object
 * @param context - Optional context object
 */
export function logProviderError(
  message: string,
  providerName: string,
  error?: Error | unknown,
  context?: LogContext
): void {
  logError(message, error, {
    ...context,
    provider: providerName,
    errorType: 'PROVIDER_ERROR',
  });
}

/**
 * Log at specific level with dynamic level selection
 * @param level - Log level
 * @param message - Log message
 * @param context - Optional context object
 */
export function logAtLevel(level: LogLevel, message: string, context?: LogContext): void {
  const logger = getLogger();
  switch (level) {
    case 'debug':
      logger.debug(message, context);
      break;
    case 'info':
      logger.info(message, context);
      break;
    case 'warn':
      logger.warn(message, context);
      break;
    case 'error':
      logger.error(message, undefined, context);
      break;
    case 'fatal':
      logger.error(`[FATAL] ${message}`, undefined, context);
      break;
    default:
      logger.info(message, context);
  }
}

/**
 * Create a structured log entry from error and metadata
 * @internal
 * @param message - Log message
 * @param error - Error object or unknown error
 * @param level - Log level
 * @param context - Optional context object
 * @returns Structured log entry
 */
export function createLogEntry(
  message: string,
  error: unknown | undefined,
  level: LogLevel,
  context?: LogContext
): LogEntry {
  let errorName: string | undefined;
  let errorCode: string | undefined;
  let statusCode: number | undefined;
  let stack: string | undefined;

  if (isWeaveError(error)) {
    errorName = error.name;
    errorCode = error.code;
    statusCode = error.statusCode;
    stack = error.stack;
  } else if (error instanceof Error) {
    errorName = error.name;
    stack = error.stack;
  }

  return {
    timestamp: new Date(),
    level,
    message,
    errorName,
    errorCode,
    statusCode,
    context,
    stack,
  };
}

/**
 * Format log entry for console output
 * @internal
 * @param entry - Log entry
 * @returns Formatted string
 */
export function formatLogEntry(entry: LogEntry): string {
  const parts: string[] = [];

  parts.push(`[${entry.timestamp.toISOString()}]`);
  parts.push(`[${entry.level.toUpperCase()}]`);

  if (entry.errorName) {
    parts.push(`${entry.errorName}:`);
  }

  parts.push(entry.message);

  if (entry.errorCode) {
    parts.push(`(${entry.errorCode})`);
  }

  if (entry.statusCode) {
    parts.push(`HTTP ${entry.statusCode}`);
  }

  if (entry.context && Object.keys(entry.context).length > 0) {
    const safeContext = { ...entry.context };
    if (safeContext.securitySensitive) {
      delete safeContext.securitySensitive;
      parts.push('[SENSITIVE_CONTEXT]');
    } else if (Object.keys(safeContext).length > 0) {
      parts.push(`Context: ${JSON.stringify(safeContext)}`);
    }
  }

  return parts.join(' ');
}
