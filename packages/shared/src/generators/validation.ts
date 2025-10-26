/**
 * Generator Specification Validation
 * Provides validation utilities for all generator specifications
 */

import type { BaseSpec } from './types.js';

/**
 * Validation error with context
 */
export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly message: string,
    public readonly value?: unknown
  ) {
    super(`Validation error in field '${field}': ${message}`);
    this.name = 'ValidationError';
  }
}

/**
 * Base validator for all specifications
 */
export abstract class BaseSpecValidator<T extends BaseSpec> {
  /**
   * Validate a specification
   * Throws ValidationError if invalid
   */
  abstract validate(spec: T): void;

  /**
   * Validate required string field
   */
  protected validateRequired(
    spec: T,
    field: keyof T,
    fieldName: string = String(field)
  ): void {
    const value = spec[field];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      throw new ValidationError(fieldName, 'Field is required');
    }
  }

  /**
   * Validate required array field
   */
  protected validateArray(
    spec: T,
    field: keyof T,
    fieldName: string = String(field),
    minLength: number = 0
  ): void {
    const value = spec[field];
    if (!Array.isArray(value)) {
      throw new ValidationError(fieldName, 'Field must be an array');
    }
    if (value.length < minLength) {
      throw new ValidationError(
        fieldName,
        `Array must have at least ${minLength} items`,
        value
      );
    }
  }

  /**
   * Validate string matches pattern
   */
  protected validatePattern(
    spec: T,
    field: keyof T,
    pattern: RegExp,
    fieldName: string = String(field)
  ): void {
    const value = spec[field];
    if (typeof value !== 'string' || !pattern.test(value)) {
      throw new ValidationError(
        fieldName,
        `Value does not match required pattern: ${pattern.source}`,
        value
      );
    }
  }

  /**
   * Validate enum value
   */
  protected validateEnum<K extends keyof T>(
    spec: T,
    field: K,
    allowedValues: readonly unknown[],
    fieldName: string = String(field)
  ): void {
    const value = spec[field];
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        fieldName,
        `Value must be one of: ${allowedValues.join(', ')}`,
        value
      );
    }
  }

  /**
   * Validate name format (camelCase, PascalCase, kebab-case, snake_case)
   */
  protected validateName(
    name: string,
    format: 'camelCase' | 'PascalCase' | 'kebab-case' | 'snake_case',
    fieldName: string = 'name'
  ): void {
    const patterns: Record<string, RegExp> = {
      camelCase: /^[a-z][a-zA-Z0-9]*$/,
      PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
      'kebab-case': /^[a-z]([a-z0-9]*-[a-z0-9]*)*$/,
      snake_case: /^[a-z]([a-z0-9]*_[a-z0-9]*)*$/,
    };

    if (!patterns[format].test(name)) {
      throw new ValidationError(
        fieldName,
        `Name must be in ${format} format`,
        name
      );
    }
  }

  /**
   * Validate HTTP method
   */
  protected validateHttpMethod(
    method: string,
    fieldName: string = 'method'
  ): void {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(method.toUpperCase())) {
      throw new ValidationError(
        fieldName,
        `HTTP method must be one of: ${validMethods.join(', ')}`,
        method
      );
    }
  }

  /**
   * Validate endpoint path
   */
  protected validateEndpoint(
    endpoint: string,
    fieldName: string = 'endpoint'
  ): void {
    if (!endpoint.startsWith('/')) {
      throw new ValidationError(
        fieldName,
        'Endpoint must start with /',
        endpoint
      );
    }
    if (endpoint.includes('//')) {
      throw new ValidationError(
        fieldName,
        'Endpoint cannot contain consecutive slashes',
        endpoint
      );
    }
  }

  /**
   * Validate object properties are not empty
   */
  protected validateObjectNotEmpty(
    obj: Record<string, unknown>,
    fieldName: string = 'object'
  ): void {
    if (!obj || Object.keys(obj).length === 0) {
      throw new ValidationError(
        fieldName,
        'Object cannot be empty'
      );
    }
  }

  /**
   * Validate array items have required properties
   */
  protected validateArrayItems<Item extends Record<string, unknown>>(
    items: Item[],
    requiredKeys: (keyof Item)[],
    fieldName: string = 'items'
  ): void {
    items.forEach((item, index) => {
      requiredKeys.forEach((key) => {
        if (!(key in item) || !item[key]) {
          throw new ValidationError(
            `${fieldName}[${index}].${String(key)}`,
            'Property is required'
          );
        }
      });
    });
  }
}

/**
 * Safe validator - collects all errors instead of failing on first
 */
export class SafeSpecValidator<T extends BaseSpec> extends BaseSpecValidator<T> {
  private errors: ValidationError[] = [];

  validate(spec: T): ValidationError[] {
    this.errors = [];
    this.performValidation(spec);
    return this.errors;
  }

  protected addError(error: ValidationError): void {
    this.errors.push(error);
  }

  protected performValidation(_spec: T): void {
    // Override in subclasses
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrorMessage(): string {
    return this.errors.map((e) => e.message).join('\n');
  }
}

/**
 * Strict validator - throws on first error
 */
export class StrictSpecValidator<T extends BaseSpec> extends BaseSpecValidator<T> {
  validate(spec: T): void {
    this.performValidation(spec);
  }

  protected performValidation(_spec: T): void {
    // Override in subclasses
  }
}
