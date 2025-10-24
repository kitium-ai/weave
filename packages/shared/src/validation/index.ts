/**
 * Validation utilities for Weave framework
 */

import { ValidationError } from '../errors/index.js';

/**
 * Validate that a string is not empty
 */
export function validateNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty string`, {
      fieldName,
      received: typeof value,
    });
  }
}

/**
 * Validate that a value is defined
 */
export function validateDefined<T>(
  value: T | null | undefined,
  fieldName: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} must be defined`, {
      fieldName,
    });
  }
}

/**
 * Validate that a value is an array
 */
export function validateArray<_T = unknown>(
  value: unknown,
  fieldName: string
): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, {
      fieldName,
      received: typeof value,
    });
  }
}

/**
 * Validate array is not empty
 */
export function validateNonEmptyArray<_T>(
  value: unknown,
  fieldName: string
): asserts value is unknown[] {
  validateArray(value, fieldName);
  if (value.length === 0) {
    throw new ValidationError(`${fieldName} must not be empty`, {
      fieldName,
    });
  }
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): void {
  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, {
      fieldName,
      minLength,
      actual: value.length,
    });
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`, {
      fieldName,
      maxLength,
      actual: value.length,
    });
  }
}

/**
 * Validate that value is one of the allowed options
 */
export function validateEnum<T extends readonly string[]>(
  value: unknown,
  fieldName: string,
  allowedValues: T
): asserts value is T[number] {
  if (!allowedValues.includes(value as string)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, {
      fieldName,
      allowed: allowedValues,
      received: value,
    });
  }
}

/**
 * Validate that value is a number in range
 */
export function validateNumberRange(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): asserts value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a number`, {
      fieldName,
      received: typeof value,
    });
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, {
      fieldName,
      min,
      actual: value,
    });
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`, {
      fieldName,
      max,
      actual: value,
    });
  }
}

/**
 * Validate that value is a valid object
 */
export function validateObject(
  value: unknown,
  fieldName: string
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an object`, {
      fieldName,
      received: typeof value,
    });
  }
}

/**
 * Validate all required fields exist in object
 */
export function validateRequiredFields(
  obj: unknown,
  requiredFields: string[],
  objectName: string = 'object'
): asserts obj is Record<string, unknown> {
  validateObject(obj, objectName);

  const missing: string[] = [];
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field as keyof typeof obj] === undefined) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(`${objectName} is missing required fields: ${missing.join(', ')}`, {
      objectName,
      missing,
    });
  }
}
