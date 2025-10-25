/**
 * SchemaValidator Tests
 * Comprehensive test suite for type-safe schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  SchemaValidator,
  type SchemaType,
  type ObjectSchema,
  type ValidationResult,
} from '../../src/advanced/schema-validator';

describe('SchemaValidator', () => {
  describe('primitive type validation', () => {
    it('should validate string type', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate({ name: 'John' }, schema);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('John');
    });

    it('should validate number type', () => {
      const schema: ObjectSchema = {
        age: { type: 'number', required: true },
      };
      const result = SchemaValidator.validate({ age: 25 }, schema);
      expect(result.success).toBe(true);
      expect(result.data?.age).toBe(25);
    });

    it('should validate boolean type', () => {
      const schema: ObjectSchema = {
        active: { type: 'boolean', required: true },
      };
      const result = SchemaValidator.validate({ active: true }, schema);
      expect(result.success).toBe(true);
      expect(result.data?.active).toBe(true);
    });

    it('should validate array type', () => {
      const schema: ObjectSchema = {
        items: { type: 'array', required: true },
      };
      const result = SchemaValidator.validate({ items: [1, 2, 3] }, schema);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.items)).toBe(true);
    });

    it('should reject invalid string type', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate({ name: 123 }, schema);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should reject invalid number type', () => {
      const schema: ObjectSchema = {
        age: { type: 'number', required: true },
      };
      const result = SchemaValidator.validate({ age: 'not a number' }, schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });
  });

  describe('required field validation', () => {
    it('should enforce required fields', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate({}, schema);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should allow optional fields', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: false },
      };
      const result = SchemaValidator.validate({}, schema);
      expect(result.success).toBe(true);
    });

    it('should allow null for optional fields', () => {
      const schema: ObjectSchema = {
        description: { type: 'string' },
      };
      const result = SchemaValidator.validate({ description: null }, schema);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBe(null);
    });

    it('should allow undefined for optional fields', () => {
      const schema: ObjectSchema = {
        description: { type: 'string' },
      };
      const result = SchemaValidator.validate({ description: undefined }, schema);
      expect(result.success).toBe(true);
    });
  });

  describe('custom validation', () => {
    it('should apply custom validation function returning boolean', () => {
      const schema: ObjectSchema = {
        age: {
          type: 'number',
          required: true,
          validate: (value) => (value as number) >= 18,
        },
      };
      const result = SchemaValidator.validate({ age: 25 }, schema);
      expect(result.success).toBe(true);
    });

    it('should reject custom validation failure', () => {
      const schema: ObjectSchema = {
        age: {
          type: 'number',
          required: true,
          validate: (value) => (value as number) >= 18,
        },
      };
      const result = SchemaValidator.validate({ age: 10 }, schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('VALIDATION_ERROR');
    });

    it('should apply custom validation function returning error message', () => {
      const schema: ObjectSchema = {
        email: {
          type: 'string',
          required: true,
          validate: (value) => {
            const email = value as string;
            return email.includes('@') ? true : 'Invalid email format';
          },
        },
      };
      const result = SchemaValidator.validate({ email: 'john@example.com' }, schema);
      expect(result.success).toBe(true);
    });

    it('should return custom error message from validation', () => {
      const schema: ObjectSchema = {
        email: {
          type: 'string',
          required: true,
          validate: (value) => {
            const email = value as string;
            return email.includes('@') ? true : 'Email must contain @';
          },
        },
      };
      const result = SchemaValidator.validate({ email: 'invalid' }, schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe('Email must contain @');
    });

    it('should validate with multiple conditions', () => {
      const schema: ObjectSchema = {
        password: {
          type: 'string',
          required: true,
          validate: (value) => {
            const pwd = value as string;
            if (pwd.length < 8) {
              return 'Must be at least 8 characters';
            }
            if (!pwd.match(/[A-Z]/)) {
              return 'Must contain uppercase';
            }
            if (!pwd.match(/[0-9]/)) {
              return 'Must contain number';
            }
            return true;
          },
        },
      };
      const result = SchemaValidator.validate({ password: 'weak' }, schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe('Must be at least 8 characters');
    });
  });

  describe('transform', () => {
    it('should apply transform function', () => {
      const schema: ObjectSchema = {
        age: {
          type: 'string',
          required: true,
          transform: (v) => Number(v),
        },
      };
      const result = SchemaValidator.validate({ age: '25' }, schema);
      expect(result.success).toBe(true);
      expect(result.data?.age).toBe(25);
    });

    it('should transform string to lowercase', () => {
      const schema: ObjectSchema = {
        name: {
          type: 'string',
          required: true,
          transform: (v) => (v as string).toLowerCase(),
        },
      };
      const result = SchemaValidator.validate({ name: 'JOHN' }, schema);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('john');
    });

    it('should handle transform errors', () => {
      const schema: ObjectSchema = {
        value: {
          type: 'string',
          required: true,
          transform: () => {
            throw new Error('Transform failed');
          },
        },
      };
      const result = SchemaValidator.validate({ value: 'test' }, schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('TRANSFORM_ERROR');
    });

    it('should validate type before transform', () => {
      const schema: ObjectSchema = {
        count: {
          type: 'number',
          required: true,
          transform: (v) => (v as number) * 2,
        },
      };
      const result = SchemaValidator.validate({ count: 'not a number' }, schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });
  });

  describe('nested object validation', () => {
    it('should validate nested objects', () => {
      const schema: ObjectSchema = {
        user: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: true },
        },
      };
      const result = SchemaValidator.validate({ user: { name: 'John', age: 25 } }, schema);
      expect(result.success).toBe(true);
      expect((result.data?.user as any).name).toBe('John');
    });

    it('should reject invalid nested objects', () => {
      const schema: ObjectSchema = {
        user: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: true },
        },
      };
      const result = SchemaValidator.validate({ user: { name: 'John', age: 'invalid' } }, schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe('user.age');
    });

    it('should validate deeply nested objects', () => {
      const schema: ObjectSchema = {
        profile: {
          user: {
            name: { type: 'string', required: true },
            contact: {
              email: { type: 'string', required: true },
            },
          },
        },
      };
      const result = SchemaValidator.validate(
        {
          profile: {
            user: {
              name: 'John',
              contact: { email: 'john@example.com' },
            },
          },
        },
        schema
      );
      expect(result.success).toBe(true);
    });

    it('should report deeply nested field errors', () => {
      const schema: ObjectSchema = {
        profile: {
          user: {
            name: { type: 'string', required: true },
            contact: {
              email: { type: 'string', required: true },
            },
          },
        },
      };
      const result = SchemaValidator.validate(
        {
          profile: {
            user: {
              name: 'John',
              contact: { email: 123 },
            },
          },
        },
        schema
      );
      expect(result.success).toBe(false);
      expect(result.errors[0].field).toContain('profile.user.contact.email');
    });
  });

  describe('unknown fields', () => {
    it('should reject unknown fields', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate({ name: 'John', unknownField: 'value' }, schema);
      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNKNOWN_FIELD')).toBe(true);
    });

    it('should report all unknown fields', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate(
        { name: 'John', unknown1: 'value', unknown2: 'value' },
        schema
      );
      expect(result.success).toBe(false);
      const unknownErrors = result.errors.filter((e) => e.code === 'UNKNOWN_FIELD');
      expect(unknownErrors).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should reject non-object data', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate('not an object', schema);
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should reject null data', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate(null, schema);
      expect(result.success).toBe(false);
    });

    it('should reject undefined data', () => {
      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
      };
      const result = SchemaValidator.validate(undefined, schema);
      expect(result.success).toBe(false);
    });

    it('should handle empty schema', () => {
      const schema: ObjectSchema = {};
      const result = SchemaValidator.validate({}, schema);
      expect(result.success).toBe(true);
    });

    it('should handle empty data with no required fields', () => {
      const schema: ObjectSchema = {
        optional: { type: 'string' },
      };
      const result = SchemaValidator.validate({}, schema);
      expect(result.success).toBe(true);
    });

    it('should preserve data types after validation', () => {
      const schema: ObjectSchema = {
        string: { type: 'string', required: true },
        number: { type: 'number', required: true },
        boolean: { type: 'boolean', required: true },
      };
      const input = {
        string: 'test',
        number: 42,
        boolean: true,
      };
      const result = SchemaValidator.validate(input, schema);
      expect(result.success).toBe(true);
      expect(typeof result.data?.string).toBe('string');
      expect(typeof result.data?.number).toBe('number');
      expect(typeof result.data?.boolean).toBe('boolean');
    });
  });

  describe('real-world scenarios', () => {
    it('should validate user registration data', () => {
      const schema: ObjectSchema = {
        email: {
          type: 'string',
          required: true,
          validate: (v) => ((v as string).includes('@') ? true : 'Invalid email'),
        },
        password: {
          type: 'string',
          required: true,
          validate: (v) => ((v as string).length >= 8 ? true : 'Password too short'),
        },
        name: { type: 'string', required: true },
      };

      const validInput = {
        email: 'user@example.com',
        password: 'securePass123',
        name: 'John Doe',
      };

      const result = SchemaValidator.validate(validInput, schema);
      expect(result.success).toBe(true);
    });

    it('should validate API response with nested data', () => {
      const schema: ObjectSchema = {
        id: { type: 'string', required: true },
        user: {
          name: { type: 'string', required: true },
          email: { type: 'string', required: true },
        },
        posts: { type: 'array', required: false },
      };

      const response = {
        id: '123',
        user: {
          name: 'John',
          email: 'john@example.com',
        },
        posts: [{ id: 1, title: 'First post' }],
      };

      const result = SchemaValidator.validate(response, schema);
      expect(result.success).toBe(true);
    });

    it('should validate and transform extracted data', () => {
      const schema: ObjectSchema = {
        age: {
          type: 'string',
          required: true,
          transform: (v) => Math.floor(Number(v)),
        },
        salary: {
          type: 'string',
          required: true,
          transform: (v) => Number(v),
        },
      };

      const extracted = {
        age: '25.7',
        salary: '50000.99',
      };

      const result = SchemaValidator.validate(extracted, schema);
      expect(result.success).toBe(true);
      expect(result.data?.age).toBe(25);
      expect(result.data?.salary).toBe(50000.99);
    });
  });

  describe('type generics', () => {
    it('should preserve generic type', () => {
      interface User {
        name: string;
        age: number;
      }

      const schema: ObjectSchema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
      };

      const result = SchemaValidator.validate<User>({ name: 'John', age: 25 }, schema);
      expect(result.success).toBe(true);
      const data = result.data as User;
      expect(data.name).toBe('John');
      expect(data.age).toBe(25);
    });
  });
});
