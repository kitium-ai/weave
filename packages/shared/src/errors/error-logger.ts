/**
 * Error Logger Utility
 * Provides structured error logging with context and levels
 */

import type { WeaveError } from './index.js';
import { isWeaveError } from './index.js';

/**
 * Error log level for structured error logging
 */
export enum ErrorLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
  timestamp: Date;
  level: ErrorLogLevel;
  message: string;
  errorName?: string;
  errorCode?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Error logger callback for custom logging
 */
export type ErrorLoggerCallback = (entry: ErrorLogEntry) => void;

/**
 * Error Logger class
 * Handles structured logging of errors with context
 */
export class ErrorLogger {
  private callbacks: ErrorLoggerCallback[] = [];
  private enableConsoleLog = true;
  private minLogLevel = ErrorLogLevel.DEBUG;

  /**
   * Add a logging callback
   */
  public addCallback(callback: ErrorLoggerCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove a logging callback
   */
  public removeCallback(callback: ErrorLoggerCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Clear all callbacks
   */
  public clearCallbacks(): void {
    this.callbacks = [];
  }

  /**
   * Enable/disable console logging
   */
  public setConsoleLogging(enabled: boolean): void {
    this.enableConsoleLog = enabled;
  }

  /**
   * Set minimum log level
   */
  public setMinimumLogLevel(level: ErrorLogLevel): void {
    this.minLogLevel = level;
  }

  /**
   * Check if a log level should be logged based on minimum level
   */
  private shouldLog(level: ErrorLogLevel): boolean {
    const levels = Object.values(ErrorLogLevel);
    const minIndex = levels.indexOf(this.minLogLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  /**
   * Log error with context
   */
  public logError(
    error: unknown,
    level: ErrorLogLevel = ErrorLogLevel.ERROR,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(error, level, context);
    this.emit(entry);
  }

  /**
   * Log WeaveError
   */
  public logWeaveError(
    error: WeaveError,
    level: ErrorLogLevel = ErrorLogLevel.ERROR,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(error, level, {
      ...error.context,
      ...context,
    });
    this.emit(entry);
  }

  /**
   * Log rate limit error with retry information
   */
  public logRateLimitError(
    error: unknown,
    retryAfter?: number,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(ErrorLogLevel.WARN)) {
      return;
    }

    const entry = this.createLogEntry(error, ErrorLogLevel.WARN, {
      ...context,
      retryAfter,
    });
    this.emit(entry);
  }

  /**
   * Log authentication error
   */
  public logAuthenticationError(error: unknown, context?: Record<string, unknown>): void {
    if (!this.shouldLog(ErrorLogLevel.ERROR)) {
      return;
    }

    const entry = this.createLogEntry(error, ErrorLogLevel.ERROR, {
      ...context,
      securitySensitive: true,
    });
    this.emit(entry);
  }

  /**
   * Log timeout error
   */
  public logTimeoutError(
    error: unknown,
    duration?: number,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(ErrorLogLevel.WARN)) {
      return;
    }

    const entry = this.createLogEntry(error, ErrorLogLevel.WARN, {
      ...context,
      duration,
    });
    this.emit(entry);
  }

  /**
   * Create structured log entry from error
   */
  private createLogEntry(
    error: unknown,
    level: ErrorLogLevel,
    context?: Record<string, unknown>
  ): ErrorLogEntry {
    let errorName: string | undefined;
    let errorCode: string | undefined;
    let statusCode: number | undefined;
    let stack: string | undefined;
    let message: string;

    if (isWeaveError(error)) {
      errorName = error.name;
      errorCode = error.code;
      statusCode = error.statusCode;
      message = error.message;
      stack = error.stack;
    } else if (error instanceof Error) {
      errorName = error.name;
      message = error.message;
      stack = error.stack;
    } else {
      message = String(error);
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
   * Emit log entry to all callbacks and console
   */
  private emit(entry: ErrorLogEntry): void {
    // Call all registered callbacks
    for (const callback of this.callbacks) {
      try {
        callback(entry);
      } catch (err) {
        console.error('Error in logging callback:', err);
      }
    }

    // Log to console if enabled
    if (this.enableConsoleLog) {
      this.logToConsole(entry);
    }
  }

  /**
   * Log to console using appropriate method based on level
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const formatter = this.formatForConsole(entry);

    switch (entry.level) {
      case ErrorLogLevel.DEBUG:
        console.debug(formatter);
        break;
      case ErrorLogLevel.INFO:
        console.info(formatter);
        break;
      case ErrorLogLevel.WARN:
        console.warn(formatter);
        break;
      case ErrorLogLevel.ERROR:
        console.error(formatter);
        break;
      case ErrorLogLevel.FATAL:
        console.error(`[FATAL] ${formatter}`);
        break;
    }

    // Log stack trace if available
    if (entry.stack) {
      console.error(entry.stack);
    }
  }

  /**
   * Format log entry for console output
   */
  private formatForConsole(entry: ErrorLogEntry): string {
    const parts: string[] = [];

    // Timestamp
    parts.push(`[${entry.timestamp.toISOString()}]`);

    // Level
    parts.push(`[${entry.level.toUpperCase()}]`);

    // Error name if available
    if (entry.errorName) {
      parts.push(`${entry.errorName}:`);
    }

    // Message
    parts.push(entry.message);

    // Error code if available
    if (entry.errorCode) {
      parts.push(`(${entry.errorCode})`);
    }

    // Status code if available
    if (entry.statusCode) {
      parts.push(`HTTP ${entry.statusCode}`);
    }

    // Context if available
    if (entry.context && Object.keys(entry.context).length > 0) {
      // Filter out security-sensitive context
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

  /**
   * Format log entry as JSON
   */
  public formatAsJSON(entry: ErrorLogEntry): string {
    // Filter out security-sensitive context
    const safeEntry = { ...entry };
    if (safeEntry.context?.securitySensitive) {
      safeEntry.context = { securitySensitive: true };
    }

    return JSON.stringify(safeEntry);
  }
}

/**
 * Global error logger instance
 */
export const globalErrorLogger = new ErrorLogger();

/**
 * Log error using global logger
 */
export function logError(
  error: unknown,
  level?: ErrorLogLevel,
  context?: Record<string, unknown>
): void {
  globalErrorLogger.logError(error, level, context);
}

/**
 * Log WeaveError using global logger
 */
export function logWeaveError(
  error: WeaveError,
  level?: ErrorLogLevel,
  context?: Record<string, unknown>
): void {
  globalErrorLogger.logWeaveError(error, level, context);
}

/**
 * Log rate limit error
 */
export function logRateLimitError(
  error: unknown,
  retryAfter?: number,
  context?: Record<string, unknown>
): void {
  globalErrorLogger.logRateLimitError(error, retryAfter, context);
}

/**
 * Log authentication error
 */
export function logAuthenticationError(error: unknown, context?: Record<string, unknown>): void {
  globalErrorLogger.logAuthenticationError(error, context);
}

/**
 * Log timeout error
 */
export function logTimeoutError(
  error: unknown,
  duration?: number,
  context?: Record<string, unknown>
): void {
  globalErrorLogger.logTimeoutError(error, duration, context);
}
