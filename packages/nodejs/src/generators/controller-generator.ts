/**
 * Express Controller Generator
 * Generates Express controllers with proper error handling and type safety
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { ExpressControllerSpec } from './types.js';

/**
 * Express controller builder
 */
export class ExpressControllerBuilder extends BaseCodeBuilder<ExpressControllerSpec> {
  constructor() {
    super();
  }

  build(spec: ExpressControllerSpec, description: string): GeneratorOutput<ExpressControllerSpec> {
    const code = this.generateController(spec);
    const tests = this.generateTestFile(spec);
    const examples = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-nodejs-controller-generator');

    return {
      code,
      tests,
      examples,
      metadata,
      spec,
    };
  }

  /**
   * Generate Express controller
   */
  private generateController(spec: ExpressControllerSpec): string {
    const imports = this.generateImports(spec);
    const className = this.toPascalCase(spec.name) + 'Controller';
    const methods = this.generateMethods(spec);

    return `${imports}

/**
 * ${className}
 * Handles ${spec.endpoint} endpoints
 */
export class ${className} {
  /**
   * Create an instance of ${className}
   */
  constructor() {}

${methods}

  /**
   * Handle errors
   */
  private handleError(error: Error | unknown, res: express.Response): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const status = error instanceof Error && 'status' in error ? (error as any).status : 500;

    logError('Controller error:', errorMessage);
    res.status(status).json({
      success: false,
      error: errorMessage || 'Internal server error',
    });
  }

  /**
   * Process input data and apply business logic
   */
  private processData(input: unknown): unknown {
    // Implement your business logic here
    // Example: data validation, transformation, calculations
    if (!input) {
      return null;
    }

    // Return processed data
    return input;
  }

  /**
   * Generate unique ID for responses
   */
  private generateId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }
}

// Export controller instance
export const ${this.toCamelCase(spec.name)}Controller = new ${className}();
`;
  }

  /**
   * Generate imports
   */
  private generateImports(spec: ExpressControllerSpec): string {
    const imports = [
      "import type { Request, Response, NextFunction } from 'express';",
      "import express from 'express';",
    ];

    if (spec.features.includes('validation')) {
      imports.push("import { validationResult } from 'express-validator';");
    }

    if (spec.features.includes('async')) {
      imports.push("import 'express-async-errors';");
    }

    return imports.join('\n');
  }

  /**
   * Generate controller methods
   */
  private generateMethods(spec: ExpressControllerSpec): string {
    const methods = spec.methods.map((method) => {
      const methodSignature = `${method.httpMethod.toLowerCase()}${this.toPascalCase(method.name)}`;

      let methodBody = `  /**
   * ${method.description}
   */
  async ${methodSignature}(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {`;

      if (spec.features.includes('validation')) {
        methodBody += `
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }`;
      }

      methodBody += `

      // Business logic implementation
      try {
        // Extract data from request
        const inputData = req.method === 'GET' ? req.query : req.body;

        // Perform business operations
        // Example: process data, call external services, database operations
        const processedData = this.processData(inputData);

        // Validate output
        if (!processedData) {
          res.status(400).json({
            success: false,
            error: 'Invalid operation result',
          });
          return;
        }

        // Return success response
        const result = {
          id: this.generateId(),
          data: processedData,
          timestamp: new Date().toISOString(),
        };

        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (innerError) {
        this.handleError(innerError, res);
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }`;

      return methodBody;
    });

    return methods.join('\n\n');
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: ExpressControllerSpec): string {
    const className = this.toPascalCase(spec.name) + 'Controller';
    const testMethods = spec.methods
      .map((method) => {
        const methodName = `${method.httpMethod.toLowerCase()}${this.toPascalCase(method.name)}`;
        return `  it('should handle ${method.httpMethod} ${spec.endpoint}', async () => {
    const mockReq = {
      body: {},
      query: {},
      params: {},
    } as Partial<Request>;

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const mockNext = jest.fn() as NextFunction;

    const controller = new ${className}();
    await controller.${methodName}(mockReq as Request, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });`;
      })
      .join('\n\n');

    return `import { Request, Response, NextFunction } from 'express';
import { ${className} } from './${spec.name}';

describe('${className}', () => {
  let controller: ${className};

  beforeEach(() => {
    controller = new ${className}();
  });

${testMethods}
});`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: ExpressControllerSpec): string {
    const className = this.toPascalCase(spec.name) + 'Controller';
    const controllerName = this.toCamelCase(spec.name);

    const routes = spec.methods
      .map((method) => {
        const methodName = `${method.httpMethod.toLowerCase()}${this.toPascalCase(method.name)}`;
        const httpMethod = method.httpMethod.toLowerCase();
        return `app.${httpMethod}('${spec.endpoint}', ${controllerName}.${methodName}.bind(${controllerName}));`;
      })
      .join('\n');

    return `// ${spec.name}.ts
// ${className} - Handles ${spec.endpoint} endpoints

// Usage in routes:
import { ${controllerName}Controller } from './controllers/${spec.name}';

${routes}

// Features:
${spec.features.map((f) => `// - ${f}`).join('\n')}

// Methods:
${spec.methods.map((m) => `// - ${m.httpMethod} /${m.name} - ${m.description}`).join('\n')}
`;
  }
}
