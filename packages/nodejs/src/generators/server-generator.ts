/**
 * Express Server Generator
 * Generates Express servers with middleware and security configurations
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { ExpressServerSpec } from './types.js';

/**
 * Express server builder
 */
export class ExpressServerBuilder extends BaseCodeBuilder<ExpressServerSpec> {
  constructor() {
    super();
  }

  build(spec: ExpressServerSpec, description: string): GeneratorOutput<ExpressServerSpec> {
    const code = this.generateServer(spec);
    const tests = this.generateTestFile(spec);
    const examples = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-nodejs-server-generator');

    return {
      code,
      tests,
      examples,
      metadata,
      spec,
    };
  }

  /**
   * Generate Express server
   */
  private generateServer(spec: ExpressServerSpec): string {
    const imports = this.generateImports(spec);
    const middleware = this.generateMiddleware(spec);
    const routeHandlers = this.generateRouteHandlers(spec);

    return `${imports}

const app = express();
const port = process.env.PORT || ${spec.port};

${middleware}

/**
 * Routes
 */
${routeHandlers}

/**
 * Error handling middleware
 */
app.use((err: Error | unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const status = err instanceof Error && 'status' in err ? (err as any).status : 500;

  console.error('Server error:', errorMessage);
  res.status(status).json({
    success: false,
    error: errorMessage || 'Internal server error',
  });
});

/**
 * Start server
 */
const server = app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});

export default app;
`;
  }

  /**
   * Generate imports
   */
  private generateImports(spec: ExpressServerSpec): string {
    const imports = [
      "import express from 'express';",
      "import type { Express, Request, Response, NextFunction } from 'express';",
    ];

    if (spec.security.cors) {
      imports.push("import cors from 'cors';");
    }

    if (spec.security.helmet) {
      imports.push("import helmet from 'helmet';");
    }

    if (spec.security.rateLimit) {
      imports.push("import rateLimit from 'express-rate-limit';");
    }

    if (spec.features.includes('logging')) {
      imports.push("import morgan from 'morgan';");
    }

    if (spec.features.includes('validation')) {
      imports.push("import { body, validationResult } from 'express-validator';");
    }

    if (spec.features.includes('async-errors')) {
      imports.push("import 'express-async-errors';");
    }

    return imports.join('\n');
  }

  /**
   * Generate middleware setup
   */
  private generateMiddleware(spec: ExpressServerSpec): string {
    const middlewareLines: string[] = [];

    middlewareLines.push('// JSON parsing');
    middlewareLines.push('app.use(express.json());');
    middlewareLines.push('app.use(express.urlencoded({ extended: true }));');
    middlewareLines.push('');

    if (spec.security.helmet) {
      middlewareLines.push('// Security headers');
      middlewareLines.push('app.use(helmet());');
      middlewareLines.push('');
    }

    if (spec.security.cors) {
      middlewareLines.push('// CORS configuration');
      middlewareLines.push(`app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  credentials: true,
}));`);
      middlewareLines.push('');
    }

    if (spec.security.rateLimit) {
      middlewareLines.push('// Rate limiting');
      middlewareLines.push(`const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});
app.use(limiter);`);
      middlewareLines.push('');
    }

    if (spec.features.includes('logging')) {
      middlewareLines.push('// Request logging');
      middlewareLines.push("app.use(morgan('combined'));");
      middlewareLines.push('');
    }

    for (const mw of spec.middleware) {
      middlewareLines.push(`// ${mw.purpose}`);
      if (mw.source) {
        middlewareLines.push(`import ${mw.name} from '${mw.source}';`);
      }
      middlewareLines.push(`app.use(${mw.name});`);
      middlewareLines.push('');
    }

    return middlewareLines.join('\n');
  }

  /**
   * Generate route handlers
   */
  private generateRouteHandlers(spec: ExpressServerSpec): string {
    const routes = spec.routes.map((route) => {
      return `app.get('/${route}', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '${route} endpoint',
    data: null,
  });
});`;
    });

    return routes.join('\n\n');
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: ExpressServerSpec): string {
    return `import request from 'supertest';
import app from './${spec.name}';

describe('Express Server', () => {
  it('should start the server', () => {
    expect(app).toBeDefined();
  });

  it('should handle GET requests', async () => {
    const response = await request(app)
      .get('/${spec.routes[0] || 'health'}')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });

  it('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
  });

  it('should include security headers', async () => {
    const response = await request(app)
      .get('/${spec.routes[0] || 'health'}');

    ${spec.security.helmet ? "expect(response.headers['x-content-type-options']).toBeDefined();" : ''}
    ${spec.security.cors ? "expect(response.headers['access-control-allow-origin']).toBeDefined();" : ''}
  });
});`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: ExpressServerSpec): string {
    return `// ${spec.name}.ts
// Express server with the following features:
${spec.features.map((f) => `// - ${f}`).join('\n')}

// Security:
// - CORS: ${spec.security.cors ? 'enabled' : 'disabled'}
// - Helmet: ${spec.security.helmet ? 'enabled' : 'disabled'}
// - Rate Limiting: ${spec.security.rateLimit ? 'enabled' : 'disabled'}

// Start the server:
// npm install express${spec.security.cors ? ' cors' : ''}${spec.security.helmet ? ' helmet' : ''}${spec.security.rateLimit ? ' express-rate-limit' : ''}
// node ${spec.name}.js

// Environment variables:
// PORT=3000
// ALLOWED_ORIGINS=http://localhost:3000
`;
  }
}
