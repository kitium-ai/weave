/**
 * Type Builder Utility
 * Generates TypeScript types, interfaces, and enums
 */

/**
 * Type specification
 */
export interface TypeSpec {
  name: string;
  description: string;
  kind: 'interface' | 'type' | 'enum' | 'class';
  properties: TypeProperty[];
  features: string[];
  extendsFrom?: string;
}

/**
 * Type property definition
 */
export interface TypeProperty {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  readonly?: boolean;
  defaultValue?: unknown;
}

/**
 * Generated types output
 */
export interface GeneratedTypes {
  typesCode: string;
  typeNames: string[];
  validatorCode: string;
  exampleUsage: string;
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    description: string;
  };
}

/**
 * TypeBuilder - Generates TypeScript types and interfaces
 */
export class TypeBuilder {
  /**
   * Build complete types from specification
   */
  public static buildTypes(specs: TypeSpec[], description: string): GeneratedTypes {
    const typesCode = specs.map((spec) => this.generateTypeCode(spec)).join('\n\n');
    const validatorCode = this.generateValidatorCode(specs);
    const exampleUsage = this.generateExampleUsage(specs);
    const typeNames = specs.map((s) => s.name);

    return {
      typesCode,
      typeNames,
      validatorCode,
      exampleUsage,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'weave-type-generator',
        description,
      },
    };
  }

  /**
   * Generate type/interface code
   */
  private static generateTypeCode(spec: TypeSpec): string {
    const keyword = spec.kind === 'enum' ? 'enum' : spec.kind === 'type' ? 'type' : 'interface';
    const extends_ = spec.extendsFrom ? ` extends ${spec.extendsFrom}` : '';

    if (spec.kind === 'enum') {
      const values = spec.properties
        .map((p) => `  /** ${p.description} */\n  ${p.name} = '${p.name.toLowerCase()}',`)
        .join('\n');

      return `/**
 * ${spec.name} enum
 * ${spec.description}
 */
export enum ${spec.name} {
${values}
}`;
    }

    const props = spec.properties
      .map(
        (p) =>
          `  /** ${p.description} */\n  ${p.readonly ? 'readonly ' : ''}${p.name}${p.optional ? '?' : ''}: ${p.type};`
      )
      .join('\n');

    return `/**
 * ${spec.name} ${spec.kind}
 * ${spec.description}
 */
export ${keyword} ${spec.name}${extends_} {
${props}
}`;
  }

  /**
   * Generate Zod validator code
   */
  private static generateValidatorCode(specs: TypeSpec[]): string {
    const imports = `import { z } from 'zod';\n\n`;

    const validators = specs
      .map((spec) => {
        if (spec.kind === 'enum') {
          const values = spec.properties.map((p) => `'${p.name.toLowerCase()}'`).join(', ');
          return `export const ${this.toLowerCamelCase(spec.name)}Schema = z.enum([${values}]);`;
        }

        const shape = spec.properties
          .map((p) => {
            const zodType = this.toZodType(p.type);
            const optional = p.optional ? '.optional()' : '';
            return `  ${p.name}: ${zodType}${optional},`;
          })
          .join('\n');

        return `export const ${this.toLowerCamelCase(spec.name)}Schema = z.object({
${shape}
});`;
      })
      .join('\n\n');

    return imports + validators;
  }

  /**
   * Generate example usage
   */
  private static generateExampleUsage(specs: TypeSpec[]): string {
    const examples = specs
      .slice(0, 2)
      .map((spec) => {
        const example = this.generateExampleObject(spec);
        return `const ${this.toLowerCamelCase(spec.name)}: ${spec.name} = ${example};`;
      })
      .join('\n\n');

    return `/**
 * Example usage of generated types
 */

${examples}

// Validation example with Zod
import { ${specs[0]?.name}Schema } from './validators';

const validated = ${specs[0]?.name}Schema.parse(${this.toLowerCamelCase(specs[0]?.name || 'example')});
`;
  }

  /**
   * Generate example object for type
   */
  private static generateExampleObject(spec: TypeSpec): string {
    if (spec.kind === 'enum') {
      return `${spec.name}.${spec.properties[0]?.name}`;
    }

    const props = spec.properties
      .slice(0, 3)
      .map((p) => {
        const value = this.getExampleValue(p.type, p.defaultValue);
        return `  ${p.name}: ${value},`;
      })
      .join('\n');

    return `{\n${props}\n}`;
  }

  /**
   * Get example value for type
   */
  private static getExampleValue(type: string, defaultValue?: unknown): string {
    if (defaultValue !== undefined) {
      return typeof defaultValue === 'string' ? `'${defaultValue}'` : String(defaultValue);
    }

    if (type.includes('string')) return `'example'`;
    if (type.includes('number')) return `0`;
    if (type.includes('boolean')) return `true`;
    if (type.includes('Date')) return `new Date()`;
    if (type.includes('[]')) return `[]`;
    if (type.includes('Record') || type.includes('object')) return `{}`;
    return `undefined`;
  }

  /**
   * Convert TypeScript type to Zod type
   */
  private static toZodType(type: string): string {
    const cleanType = type.replace(/\?$/, '').trim();

    if (cleanType.includes('string')) return 'z.string()';
    if (cleanType.includes('number')) return 'z.number()';
    if (cleanType.includes('boolean')) return 'z.boolean()';
    if (cleanType.includes('Date')) return 'z.date()';
    if (cleanType.includes('[]')) return `z.array(z.unknown())`;
    if (cleanType.includes('Record') || cleanType.includes('object'))
      return 'z.record(z.unknown())';
    return 'z.unknown()';
  }

  /**
   * Convert to camelCase
   */
  private static toLowerCamelCase(str: string): string {
    return (
      str.charAt(0).toLowerCase() +
      str.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    );
  }
}
