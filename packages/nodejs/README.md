# Node.js Code Generators

Generate production-ready Express servers and controllers from specifications using natural language processing and AI-powered code generation.

## Overview

The Node.js Code Generators provide a powerful way to automatically generate:

- **Express Servers** - With middleware, security, and proper configuration
- **Controllers** - With CRUD operations, error handling, and async/await patterns
- **Middleware** - Authentication, validation, logging, and custom handlers
- **Type definitions** - Full TypeScript interfaces and types
- **Unit Tests** - Comprehensive test files using Jest and Supertest
- **Documentation** - Examples and usage patterns

## Features

- 🎯 **Production-Ready** - Express best practices and industry standards
- 📝 **NLP-Powered Parsing** - Extract features and structure from natural language descriptions
- 🧪 **Built-in Tests** - Auto-generated tests with Supertest and Jest
- 📚 **Complete Examples** - Learn by example with generated documentation
- ♻️ **Reusable Output** - Code ready for immediate integration
- 🔒 **Security First** - Helmet, CORS, rate limiting built-in

## Installation

```bash
npm install @weaveai/nodejs
# or
yarn add @weaveai/nodejs
```

## Usage

### Generate an Express Server

```typescript
import { ExpressServerBuilder } from '@weaveai/nodejs';
import type { ExpressServerSpec } from '@weaveai/nodejs';

const serverSpec: ExpressServerSpec = {
  name: 'main-server',
  description: 'Main Express server for API',
  framework: 'express',
  port: 3000,
  middleware: [
    {
      name: 'authMiddleware',
      purpose: 'Authentication and authorization',
      source: './middleware/auth',
    },
    {
      name: 'loggingMiddleware',
      purpose: 'Request and response logging',
      source: './middleware/logging',
    },
  ],
  routes: ['health', 'products', 'users', 'orders'],
  security: {
    cors: true,
    helmet: true,
    rateLimit: true,
  },
  features: ['logging', 'authentication', 'error handling', 'request validation'],
};

const builder = new ExpressServerBuilder();
const output = builder.build(serverSpec, 'Production Express server with security');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
console.log('Generated Examples:', output.examples);
```

### Generate a Controller

```typescript
import { ExpressControllerBuilder } from '@weaveai/nodejs';
import type { ExpressControllerSpec } from '@weaveai/nodejs';

const controllerSpec: ExpressControllerSpec = {
  name: 'products',
  description: 'Controller for product management',
  framework: 'express',
  endpoint: '/api/products',
  methods: [
    {
      name: 'list',
      httpMethod: 'GET',
      description: 'Get all products with pagination',
      params: [
        { name: 'page', type: 'number' },
        { name: 'limit', type: 'number' },
      ],
      returnType: 'Product[]',
    },
    {
      name: 'create',
      httpMethod: 'POST',
      description: 'Create a new product',
      params: [{ name: 'body', type: 'CreateProductDTO' }],
      returnType: 'Product',
    },
    {
      name: 'update',
      httpMethod: 'PUT',
      description: 'Update a product',
      params: [
        { name: 'id', type: 'string' },
        { name: 'body', type: 'UpdateProductDTO' },
      ],
      returnType: 'Product',
    },
    {
      name: 'delete',
      httpMethod: 'DELETE',
      description: 'Delete a product',
      params: [{ name: 'id', type: 'string' }],
      returnType: 'void',
    },
  ],
  features: ['validation', 'error handling', 'pagination', 'async operations'],
};

const builder = new ExpressControllerBuilder();
const output = builder.build(controllerSpec, 'Complete CRUD controller for products');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
```

## Server Specification (ExpressServerSpec)

| Property      | Type      | Description                                 |
| ------------- | --------- | ------------------------------------------- |
| `name`        | string    | Server name (e.g., 'main-server')           |
| `description` | string    | Server description                          |
| `framework`   | 'express' | Framework identifier                        |
| `port`        | number    | Server port (default: 3000)                 |
| `middleware`  | Array     | Custom middleware configurations            |
| `routes`      | string[]  | API route paths                             |
| `security`    | Object    | Security settings (cors, helmet, rateLimit) |
| `features`    | string[]  | Features like 'logging', 'authentication'   |

### Middleware Structure

```typescript
interface Middleware {
  name: string; // Middleware name
  purpose: string; // What the middleware does
  source?: string; // Optional import path
}
```

## Controller Specification (ExpressControllerSpec)

| Property      | Type      | Description                           |
| ------------- | --------- | ------------------------------------- |
| `name`        | string    | Controller name (e.g., 'products')    |
| `description` | string    | Controller description                |
| `framework`   | 'express' | Framework identifier                  |
| `endpoint`    | string    | Base endpoint (e.g., '/api/products') |
| `methods`     | Array     | HTTP handler methods                  |
| `features`    | string[]  | Features like 'validation', 'caching' |

### Method Structure

```typescript
interface Method {
  name: string; // Method name
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string; // Method documentation
  params?: Array<{ name: string; type: string }>;
  returnType: string; // Return type
}
```

## Generated Output (GeneratorOutput)

```typescript
interface GeneratorOutput<T extends BaseSpec> {
  code: string; // Generated server/controller code
  tests: string; // Generated unit tests
  examples: string; // Usage examples and documentation
  metadata: CodeMetadata; // Generation metadata
  spec: T; // Original specification
}
```

## Examples

For more complete examples, see [examples.ts](src/generators/examples.ts)

### Simple Express Server

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'health endpoint' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
```

### Simple Controller

```typescript
import { Request, Response, NextFunction } from 'express';

export class ProductsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;

      // TODO: Implement business logic
      const result = [];

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      if (!body) {
        res.status(400).json({
          success: false,
          error: 'Request body is required',
        });
        return;
      }

      // TODO: Implement creation logic
      const result = {};

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: any, res: Response): void {
    logError('Controller error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
```

## Supported Features

Servers can include:

- **Security** - CORS, Helmet, Rate Limiting
- **Middleware** - Custom middleware composition
- **Logging** - Morgan request logging
- **Authentication** - Built-in auth middleware
- **Validation** - Request validation patterns
- **Error Handling** - Centralized error handling

Controllers can include:

- **CRUD Operations** - Full Create, Read, Update, Delete
- **Validation** - Input validation with express-validator
- **Error Handling** - Proper error responses
- **Async Operations** - Promise-based operations
- **Pagination** - Offset/limit pagination
- **Filtering** - Query-based filtering

## Best Practices

1. **Separate Concerns** - Controllers handle requests, services handle logic
2. **Proper Error Handling** - Use try-catch and error middleware
3. **Validation First** - Validate inputs at controller boundaries
4. **Type Safety** - Use TypeScript for all controllers
5. **Documentation** - Document all endpoints and parameters
6. **Testing** - Write tests for all controllers and routes

## Advanced Usage

### Service Layer Integration

```typescript
export class ProductService {
  async getProducts(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return await db.products.findMany({
      skip: offset,
      take: limit,
    });
  }

  async createProduct(data: CreateProductDTO) {
    return await db.products.create({ data });
  }
}

export class ProductsController {
  private service = new ProductService();

  async list(req: Request, res: Response, next: NextFunction) {
    const { page = 1, limit = 10 } = req.query;
    const products = await this.service.getProducts(
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json({ success: true, data: products });
  }
}
```

### Middleware Pattern

```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Usage
app.post('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected endpoint' });
});
```

## Architecture

- **BaseCodeBuilder** - Abstract base class with shared utilities (from `@weaveai/shared`)
- **BaseSpecParser** - NLP parsing for feature extraction (from `@weaveai/shared`)
- **ExpressServerBuilder** - Server-specific code generation
- **ExpressControllerBuilder** - Controller-specific code generation
- **CodeFormatter** - Consistent code formatting (from `@weaveai/shared`)

## Directory Structure

```
src/
├── app.ts                 # Main Express app
├── controllers/
│   ├── products.ts       # Generated controllers
│   └── users.ts
├── middleware/
│   ├── auth.ts           # Generated middleware
│   └── validation.ts
├── services/
│   └── product.service.ts # Business logic
└── routes/
    └── api.ts            # Route definitions
```

## Testing

Generated tests use Jest and Supertest:

```typescript
import request from 'supertest';
import app from './app';

describe('Express Server', () => {
  it('should start the server', () => {
    expect(app).toBeDefined();
  });

  it('should handle GET requests', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toHaveProperty('success', true);
  });

  it('should handle 404 errors', async () => {
    const response = await request(app).get('/nonexistent').expect(404);
  });
});
```

## Environment Variables

```bash
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:password@localhost/db
```

## Contributing

Contributions are welcome! Please ensure:

1. Code follows Express best practices
2. Tests pass and coverage remains high
3. Documentation is updated
4. TypeScript strict mode compliance

## Related Packages

- [@weaveai/shared](../../shared) - Shared utilities and base classes
- [@weaveai/react](../../react) - React generators
- [@weaveai/angular](../../angular) - Angular generators
- [@weaveai/nextjs](../../nextjs) - Next.js generators
- [@weaveai/react-native](../../react-native) - React Native generators

## License

MIT
