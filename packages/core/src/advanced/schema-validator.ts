/**
 * Schema Validator
 * Type-safe schema validation using Zod patterns
 */

export type ValidationErrorDetail = {
  field: string;
  message: string;
  code: string;
  value?: unknown;
};

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors: ValidationErrorDetail[];
};

export interface SchemaType {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum' | 'union';
  required?: boolean;
  description?: string;
  validate?: (value: unknown) => boolean | string;
  transform?: (value: unknown) => unknown;
}

export interface ObjectSchema {
  [key: string]: SchemaType | ObjectSchema;
}

/**
 * Schema Validator for AI data extraction
 */
export class SchemaValidator {
  /**
   * Validate data against schema
   */
  static validate<T = Record<string, unknown>>(
    data: unknown,
    schema: ObjectSchema
  ): ValidationResult<T> {
    const errors: ValidationErrorDetail[] = [];

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        errors: [
          {
            field: 'root',
            message: 'Data must be an object',
            code: 'INVALID_TYPE',
          },
        ],
      };
    }

    const validatedData: Record<string, unknown> = {};
    const dataObj = data as Record<string, unknown>;

    // Validate each field in schema
    for (const [key, fieldSchema] of Object.entries(schema)) {
      const value = dataObj[key];
      const result = this.validateField(key, value, fieldSchema);

      if (!result.valid) {
        errors.push(...result.errors);
      } else {
        validatedData[key] = result.value;
      }
    }

    // Check for extra fields
    for (const key of Object.keys(dataObj)) {
      if (!(key in schema)) {
        errors.push({
          field: key,
          message: 'Unknown field',
          code: 'UNKNOWN_FIELD',
        });
      }
    }

    return {
      success: errors.length === 0,
      data: validatedData as T,
      errors,
    };
  }

  /**
   * Validate single field
   */
  private static validateField(
    fieldName: string,
    value: unknown,
    schema: SchemaType | ObjectSchema
  ): { valid: boolean; value?: unknown; errors: ValidationErrorDetail[] } {
    // Handle nested objects
    if ('type' in schema === false) {
      const nested = schema as ObjectSchema;
      if (typeof value !== 'object' || value === null) {
        return {
          valid: false,
          errors: [
            {
              field: fieldName,
              message: 'Expected object',
              code: 'INVALID_TYPE',
            },
          ],
        };
      }

      // Recursively validate nested object
      const result = this.validate(value, nested);
      return {
        valid: result.success,
        value: result.data,
        errors: result.errors.map((e) => ({
          ...e,
          field: `${fieldName}.${e.field}`,
        })),
      };
    }

    const fieldSchema = schema as SchemaType;

    // Check required
    if (fieldSchema.required && (value === undefined || value === null)) {
      return {
        valid: false,
        errors: [
          {
            field: fieldName,
            message: `${fieldName} is required`,
            code: 'REQUIRED',
          },
        ],
      };
    }

    if (value === undefined || value === null) {
      return { valid: true, value: null, errors: [] };
    }

    // Type validation
    const typeValid = this.validateType(value, fieldSchema.type);
    if (!typeValid) {
      return {
        valid: false,
        errors: [
          {
            field: fieldName,
            message: `Expected ${fieldSchema.type}`,
            code: 'INVALID_TYPE',
            value,
          },
        ],
      };
    }

    // Custom validation
    if (fieldSchema.validate) {
      const customValid = fieldSchema.validate(value);
      if (typeof customValid === 'string') {
        return {
          valid: false,
          errors: [
            {
              field: fieldName,
              message: customValid,
              code: 'VALIDATION_ERROR',
              value,
            },
          ],
        };
      }
      if (!customValid) {
        return {
          valid: false,
          errors: [
            {
              field: fieldName,
              message: 'Custom validation failed',
              code: 'VALIDATION_ERROR',
              value,
            },
          ],
        };
      }
    }

    // Transform if specified
    let transformedValue: unknown = value;
    if (fieldSchema.transform) {
      try {
        transformedValue = fieldSchema.transform(value);
      } catch (error) {
        return {
          valid: false,
          errors: [
            {
              field: fieldName,
              message: `Transform failed: ${error}`,
              code: 'TRANSFORM_ERROR',
              value,
            },
          ],
        };
      }
    }

    return { valid: true, value: transformedValue, errors: [] };
  }

  /**
   * Validate primitive type
   */
  private static validateType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return true;
    }
  }
}
