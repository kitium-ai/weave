/**
 * ID Generation Utilities
 * Provides secure and consistent ID generation across the application
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let crypto: unknown = null;

/**
 * Get crypto module (lazy loaded)
 */
function getCryptoModule(): unknown {
  if (!crypto) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-implied-eval, @typescript-eslint/ban-ts-comment
    // @ts-ignore - require is only available in Node.js, not in browser/mobile environments
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    crypto = require('crypto');
  }
  return crypto;
}

/**
 * Generate a cryptographically secure UUID
 */
export function generateUUID(): string {
  return (getCryptoModule() as unknown as { randomUUID: () => string }).randomUUID();
}

/**
 * Generate a human-readable operation ID with timestamp and UUID
 */
export function generateOperationId(): string {
  const timestamp = Date.now();
  const uuid = (getCryptoModule() as unknown as { randomUUID: () => string })
    .randomUUID()
    .split('-')[0]; // Use first part of UUID for brevity
  return `op-${timestamp}-${uuid}`;
}

/**
 * Generate a batch job ID
 */
export function generateBatchJobId(): string {
  const timestamp = Date.now();
  const uuid = (getCryptoModule() as unknown as { randomUUID: () => string })
    .randomUUID()
    .split('-')[0];
  return `job-${timestamp}-${uuid}`;
}

/**
 * Generate a trace ID for distributed tracing
 */
export function generateTraceId(): string {
  return `trace-${(getCryptoModule() as unknown as { randomUUID: () => string }).randomUUID()}`;
}

/**
 * Generate a request ID for logging
 */
export function generateRequestId(): string {
  return `req-${(getCryptoModule() as unknown as { randomUUID: () => string }).randomUUID().split('-')[0]}`;
}

/**
 * Check if string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if string is a valid operation ID format
 */
export function isValidOperationId(str: string): boolean {
  return /^op-\d+-[0-9a-f]+$/.test(str);
}

/**
 * Generate unique ID with optional prefix
 * @param prefix Optional prefix for the ID
 * @param separator Separator between prefix and UUID
 * @returns Generated ID
 */
export function generateId(prefix?: string, separator: string = '-'): string {
  const id = (getCryptoModule() as unknown as { randomUUID: () => string }).randomUUID();
  if (prefix) {
    return `${prefix}${separator}${id}`;
  }
  return id;
}
