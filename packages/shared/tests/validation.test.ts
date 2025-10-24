/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateNonEmptyString,
  validateDefined,
  validateArray,
  validateNonEmptyArray,
  validateStringLength,
  validateEnum,
  validateNumberRange,
  validateObject,
  validateRequiredFields,
} from '../src/validation/index.js';
import { ValidationError } from '../src/errors/index.js';

describe('Validation Utilities', () => {
  describe('validateNonEmptyString', () => {
    it('should accept non-empty string', () => {
      expect(() => validateNonEmptyString('hello', 'field')).not.toThrow();
    });

    it('should reject empty string', () => {
      expect(() => validateNonEmptyString('', 'field')).toThrow(ValidationError);
    });

    it('should reject non-string', () => {
      expect(() => validateNonEmptyString(123, 'field')).toThrow(ValidationError);
    });

    it('should reject whitespace-only string', () => {
      expect(() => validateNonEmptyString('   ', 'field')).toThrow(ValidationError);
    });
  });

  describe('validateDefined', () => {
    it('should accept defined values', () => {
      expect(() => validateDefined('test', 'field')).not.toThrow();
      expect(() => validateDefined(0, 'field')).not.toThrow();
      expect(() => validateDefined(false, 'field')).not.toThrow();
    });

    it('should reject undefined', () => {
      expect(() => validateDefined(undefined, 'field')).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validateDefined(null, 'field')).toThrow(ValidationError);
    });
  });

  describe('validateArray', () => {
    it('should accept array', () => {
      expect(() => validateArray([1, 2, 3], 'field')).not.toThrow();
      expect(() => validateArray([], 'field')).not.toThrow();
    });

    it('should reject non-array', () => {
      expect(() => validateArray('not array', 'field')).toThrow(ValidationError);
      expect(() => validateArray({}, 'field')).toThrow(ValidationError);
    });
  });

  describe('validateNonEmptyArray', () => {
    it('should accept non-empty array', () => {
      expect(() => validateNonEmptyArray([1], 'field')).not.toThrow();
    });

    it('should reject empty array', () => {
      expect(() => validateNonEmptyArray([], 'field')).toThrow(ValidationError);
    });

    it('should reject non-array', () => {
      expect(() => validateNonEmptyArray('not array', 'field')).toThrow(ValidationError);
    });
  });

  describe('validateStringLength', () => {
    it('should accept string within range', () => {
      expect(() => validateStringLength('hello', 'field', 1, 10)).not.toThrow();
    });

    it('should reject string too short', () => {
      expect(() => validateStringLength('hi', 'field', 5, 10)).toThrow(ValidationError);
    });

    it('should reject string too long', () => {
      expect(() => validateStringLength('hello', 'field', 1, 3)).toThrow(ValidationError);
    });

    it('should work with min only', () => {
      expect(() => validateStringLength('hello', 'field', 5)).not.toThrow();
      expect(() => validateStringLength('hi', 'field', 5)).toThrow(ValidationError);
    });

    it('should work with max only', () => {
      expect(() => validateStringLength('hi', 'field', undefined, 5)).not.toThrow();
      expect(() => validateStringLength('hello world', 'field', undefined, 5)).toThrow(
        ValidationError
      );
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum value', () => {
      const values = ['a', 'b', 'c'] as const;
      expect(() => validateEnum('a', 'field', values)).not.toThrow();
    });

    it('should reject invalid enum value', () => {
      const values = ['a', 'b', 'c'] as const;
      expect(() => validateEnum('d', 'field', values)).toThrow(ValidationError);
    });
  });

  describe('validateNumberRange', () => {
    it('should accept number in range', () => {
      expect(() => validateNumberRange(5, 'field', 0, 10)).not.toThrow();
    });

    it('should reject number below min', () => {
      expect(() => validateNumberRange(-1, 'field', 0, 10)).toThrow(ValidationError);
    });

    it('should reject number above max', () => {
      expect(() => validateNumberRange(11, 'field', 0, 10)).toThrow(ValidationError);
    });

    it('should reject non-number', () => {
      expect(() => validateNumberRange('5', 'field')).toThrow(ValidationError);
    });

    it('should work with min only', () => {
      expect(() => validateNumberRange(5, 'field', 0)).not.toThrow();
      expect(() => validateNumberRange(-1, 'field', 0)).toThrow(ValidationError);
    });

    it('should work with max only', () => {
      expect(() => validateNumberRange(5, 'field', undefined, 10)).not.toThrow();
      expect(() => validateNumberRange(11, 'field', undefined, 10)).toThrow(ValidationError);
    });
  });

  describe('validateObject', () => {
    it('should accept object', () => {
      expect(() => validateObject({}, 'field')).not.toThrow();
      expect(() => validateObject({ a: 1 }, 'field')).not.toThrow();
    });

    it('should reject null', () => {
      expect(() => validateObject(null, 'field')).toThrow(ValidationError);
    });

    it('should reject array', () => {
      expect(() => validateObject([], 'field')).toThrow(ValidationError);
    });

    it('should reject non-object', () => {
      expect(() => validateObject('string', 'field')).toThrow(ValidationError);
    });
  });

  describe('validateRequiredFields', () => {
    it('should accept object with all required fields', () => {
      const obj = { name: 'John', age: 30 };
      expect(() => validateRequiredFields(obj, ['name', 'age'])).not.toThrow();
    });

    it('should reject object missing required fields', () => {
      const obj = { name: 'John' };
      expect(() => validateRequiredFields(obj, ['name', 'age'])).toThrow(ValidationError);
    });

    it('should reject object with undefined required field', () => {
      const obj = { name: 'John', age: undefined };
      expect(() => validateRequiredFields(obj, ['name', 'age'])).toThrow(ValidationError);
    });

    it('should reject non-object', () => {
      expect(() => validateRequiredFields('not object', ['field'])).toThrow(ValidationError);
    });
  });
});
