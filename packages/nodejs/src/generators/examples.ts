/**
 * Node.js Generators Examples
 * Demonstrates how to use Express server and controller generators
 */

import { ExpressServerBuilder } from './server-generator.js';
import { ExpressControllerBuilder } from './controller-generator.js';
import type { ExpressServerSpec, ExpressControllerSpec } from './types.js';

/**
 * Example 1: Generate an Express server with middleware
 */
export function exampleServerGeneration(): void {
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
    language: 'typescript',
  };

  const builder = new ExpressServerBuilder();
  const output = builder.build(
    serverSpec,
    'Production-grade Express server with security and middleware'
  );

  console.log('Generated Server Code:');
  console.log(output.code);
  console.log('\nGenerated Tests:');
  console.log(output.tests);
  console.log('\nGenerated Examples:');
  console.log(output.examples);
}

/**
 * Example 2: Generate a product controller
 */
export function exampleControllerGeneration(): void {
  const controllerSpec: ExpressControllerSpec = {
    name: 'products',
    description: 'Controller for product management endpoints',
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
        name: 'getById',
        httpMethod: 'GET',
        description: 'Get a product by ID',
        params: [{ name: 'id', type: 'string' }],
        returnType: 'Product',
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
    language: '',
  };

  const builder = new ExpressControllerBuilder();
  const output = builder.build(controllerSpec, 'Complete CRUD controller for product management');

  console.log('Generated Controller Code:');
  console.log(output.code);
  console.log('\nGenerated Tests:');
  console.log(output.tests);
  console.log('\nGenerated Examples:');
  console.log(output.examples);
}

/**
 * Example 3: Server setup with controllers
 */
export const serverSetupExample = `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { productsController } from './controllers/products';
import { usersController } from './controllers/users';
import { ordersController } from './controllers/orders';

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  credentials: true,
}));

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
app.get('/api/products', productsController.list.bind(productsController));
app.get('/api/products/:id', productsController.getById.bind(productsController));
app.post('/api/products', productsController.create.bind(productsController));
app.put('/api/products/:id', productsController.update.bind(productsController));
app.delete('/api/products/:id', productsController.delete.bind(productsController));

app.get('/api/users', usersController.list.bind(usersController));
app.get('/api/orders', ordersController.list.bind(ordersController));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});

export default app;
`;

/**
 * Example 4: Middleware implementation
 */
export const middlewareExample = `
import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token',
    });
  }
};

/**
 * Request validation middleware
 */
export const validateRequest = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
};
`;

/**
 * Example 5: Service layer
 */
export const serviceLayerExample = `
import { db } from './database';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export class ProductService {
  async listProducts(page: number = 1, limit: number = 10): Promise<{ items: Product[]; total: number }> {
    const offset = (page - 1) * limit;
    const items = await db.products.findMany({
      skip: offset,
      take: limit,
    });
    const total = await db.products.count();
    return { items, total };
  }

  async getProductById(id: string): Promise<Product | null> {
    return db.products.findUnique({ where: { id } });
  }

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    return db.products.create({ data });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return db.products.update({ where: { id }, data });
  }

  async deleteProduct(id: string): Promise<void> {
    await db.products.delete({ where: { id } });
  }
}

export const productService = new ProductService();
`;

/**
 * Example 6: Integrated usage
 */
export async function runIntegratedExample(): Promise<void> {
  console.log('=== Node.js/Express Generators Examples ===\n');

  console.log('1. Generating Express Server...');
  exampleServerGeneration();

  console.log('\n2. Generating Product Controller...');
  exampleControllerGeneration();

  console.log('\n3. Server Setup with Controllers:');
  console.log(serverSetupExample);

  console.log('\n4. Middleware Examples:');
  console.log(middlewareExample);

  console.log('\n5. Service Layer Example:');
  console.log(serviceLayerExample);
}

// Run examples if this file is executed directly
if (require.main === module) {
  runIntegratedExample().catch(console.error);
}
