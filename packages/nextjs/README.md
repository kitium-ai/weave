# Next.js Code Generators

Generate production-ready Next.js API routes and pages from specifications using natural language processing and AI-powered code generation.

## Overview

The Next.js Code Generators provide a powerful way to automatically generate:

- **API Routes** - With proper error handling, method validation, and type safety
- **Pages** - With metadata, hooks integration, and responsive layouts
- **Middleware** - Request processing and authentication
- **Type definitions** - Full TypeScript interfaces and types
- **Unit Tests** - Comprehensive test files using Next.js testing utilities
- **Documentation** - Examples and usage patterns

## Features

- 🎯 **Next.js Specific** - Proper Next.js patterns and conventions (App Router compatible)
- 📝 **NLP-Powered Parsing** - Extract features and structure from natural language descriptions
- 🧪 **Built-in Tests** - Auto-generated unit tests with proper setup
- 📚 **Complete Examples** - Learn by example with generated documentation
- ♻️ **Reusable Output** - Production-ready code with minimal modifications
- ⚡ **Performance Optimized** - Client/server component considerations

## Installation

```bash
npm install @weaveai/nextjs
# or
yarn add @weaveai/nextjs
```

## Usage

### Generate an API Route

```typescript
import { NextJSApiRouteBuilder } from '@weaveai/nextjs';
import type { NextJSApiRouteSpec } from '@weaveai/nextjs';

const apiRouteSpec: NextJSApiRouteSpec = {
  name: 'products-api',
  description: 'API route for managing products',
  framework: 'nextjs',
  endpoint: '/api/products',
  method: 'GET',
  queryParams: [
    { name: 'page', type: 'number', required: false },
    { name: 'limit', type: 'number', required: false },
    { name: 'search', type: 'string', required: false },
  ],
  responseSchema: {
    success: 'boolean',
    data: 'Product[]',
    total: 'number',
  },
  features: ['pagination', 'search', 'filtering', 'error handling'],
};

const builder = new NextJSApiRouteBuilder();
const output = builder.build(apiRouteSpec, 'API route for fetching products with pagination');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
console.log('Generated Examples:', output.examples);
```

### Generate a Page

```typescript
import { NextJSPageBuilder } from '@weaveai/nextjs';
import type { NextJSPageSpec } from '@weaveai/nextjs';

const pageSpec: NextJSPageSpec = {
  name: 'dashboard',
  description: 'Dashboard page for displaying user analytics',
  framework: 'nextjs',
  title: 'Dashboard',
  route: '/dashboard',
  isServerComponent: false,
  features: ['charts', 'real-time updates', 'data fetching', 'responsive design'],
};

const builder = new NextJSPageBuilder();
const output = builder.build(pageSpec, 'Interactive dashboard page with charts');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
```

## API Route Specification (NextJSApiRouteSpec)

| Property         | Type                                            | Description                                 |
| ---------------- | ----------------------------------------------- | ------------------------------------------- |
| `name`           | string                                          | Route name (e.g., 'products-api')           |
| `description`    | string                                          | Route description                           |
| `framework`      | 'nextjs'                                        | Framework identifier                        |
| `endpoint`       | string                                          | API endpoint path (e.g., '/api/products')   |
| `method`         | 'GET' \| 'POST' \| 'PUT' \| 'DELETE' \| 'PATCH' | HTTP method                                 |
| `queryParams`    | Array                                           | Query parameters with types                 |
| `bodySchema`     | Object                                          | Request body schema                         |
| `responseSchema` | Object                                          | Response schema                             |
| `features`       | string[]                                        | Features like 'validation', 'caching', etc. |

### Query Parameter Structure

```typescript
interface QueryParam {
  name: string; // Parameter name
  type: string; // TypeScript type (e.g., 'string', 'number')
  required: boolean; // Whether parameter is required
}
```

## Page Specification (NextJSPageSpec)

| Property            | Type     | Description                               |
| ------------------- | -------- | ----------------------------------------- |
| `name`              | string   | Page name (e.g., 'dashboard')             |
| `description`       | string   | Page description                          |
| `framework`         | 'nextjs' | Framework identifier                      |
| `title`             | string   | Page title for metadata                   |
| `route`             | string   | Route path (e.g., '/dashboard')           |
| `isServerComponent` | boolean  | Whether to use Server Components          |
| `features`          | string[] | Features like 'forms', 'animations', etc. |

## Generated Output (GeneratorOutput)

```typescript
interface GeneratorOutput<T extends BaseSpec> {
  code: string; // Generated API route/page code
  tests: string; // Generated unit tests
  examples: string; // Usage examples and documentation
  metadata: CodeMetadata; // Generation metadata
  spec: T; // Original specification
}
```

## Examples

For more complete examples, see [examples.ts](src/generators/examples.ts)

### Simple API Route (GET)

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Method validation
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { page = 1, limit = 10, search } = req.query;

    // TODO: Implement logic
    const result = {
      success: true,
      data: [],
      total: 0,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
```

### Simple Page

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'User dashboard page',
};

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize page
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <main className="container mx-auto p-8">
      <h1>Dashboard</h1>
      {/* Page content */}
    </main>
  );
}
```

## Supported Features

API Routes can include:

- **Validation** - Request validation and error handling
- **Pagination** - Built-in pagination logic
- **Filtering/Search** - Query parameter based filtering
- **Caching** - Response caching strategies
- **Authentication** - Protected endpoints
- **Logging** - Request/response logging

Pages can include:

- **Forms** - Form handling with validation
- **Data Fetching** - Server-side and client-side data fetching
- **Animations** - Framer Motion integration
- **Responsive Design** - Mobile-first responsive layouts
- **Charts** - Data visualization
- **Real-time Updates** - WebSocket/polling support

## Best Practices

1. **Proper Method Handling** - Use appropriate HTTP methods for different operations
2. **Type Safety** - Always specify types for query params, body, and response
3. **Error Handling** - Include proper error responses with status codes
4. **Validation** - Validate inputs at route boundaries
5. **Documentation** - Add meaningful descriptions for better code generation

## Advanced Usage

### Custom API Route

```typescript
// pages/api/custom/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      // Handle GET
      break;
    case 'POST':
      // Handle POST
      break;
    case 'PUT':
      // Handle PUT
      break;
    case 'DELETE':
      // Handle DELETE
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### Middleware Setup

```typescript
// lib/middleware.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export function withAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    try {
      // Token verification logic
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

### Using Middleware in Routes

```typescript
// pages/api/protected.ts
import { withAuth } from '@/lib/middleware';

export default withAuth(async (req, res) => {
  res.json({ message: 'This is protected' });
});
```

## Architecture

- **BaseCodeBuilder** - Abstract base class with shared utilities (from `@weaveai/shared`)
- **BaseSpecParser** - NLP parsing for feature extraction (from `@weaveai/shared`)
- **NextJSApiRouteBuilder** - API route-specific code generation
- **NextJSPageBuilder** - Page-specific code generation
- **CodeFormatter** - Consistent code formatting (from `@weaveai/shared`)

## Directory Structure

```
app/
├── api/
│   ├── products/
│   │   └── route.ts          # Generated API routes
│   └── users/
│       └── route.ts
├── dashboard/
│   └── page.tsx              # Generated pages
└── lib/
    └── api.ts                # API utilities
```

## Testing

Generated tests use Jest and `node-mocks-http`:

```typescript
import { createMocks } from 'node-mocks-http';
import handler from './route';

describe('/api/products', () => {
  it('handles GET request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(true);
  });
});
```

## Contributing

Contributions are welcome! Please ensure:

1. Code follows Next.js best practices
2. Tests pass and coverage remains high
3. Documentation is updated
4. TypeScript strict mode compliance

## Related Packages

- [@weaveai/shared](../../shared) - Shared utilities and base classes
- [@weaveai/react](../../react) - React generators
- [@weaveai/angular](../../angular) - Angular generators
- [@weaveai/nodejs](../../nodejs) - Node.js generators
- [@weaveai/react-native](../../react-native) - React Native generators

## License

MIT
