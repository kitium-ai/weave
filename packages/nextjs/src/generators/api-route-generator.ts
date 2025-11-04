/**
 * Next.js API Route Generator
 * Generates Next.js API routes with proper error handling
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { NextJSApiRouteSpec } from './types.js';

/**
 * Next.js API route builder
 */
export class NextJSApiRouteBuilder extends BaseCodeBuilder<NextJSApiRouteSpec> {
  constructor() {
    super();
  }

  build(spec: NextJSApiRouteSpec, description: string): GeneratorOutput<NextJSApiRouteSpec> {
    const code = this.generateApiRoute(spec);
    const tests = this.generateTestFile(spec);
    const examples = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-nextjs-api-route-generator');

    return {
      code,
      tests,
      examples,
      metadata,
      spec,
    };
  }

  /**
   * Generate API route handler
   */
  private generateApiRoute(spec: NextJSApiRouteSpec): string {
    const method = spec.method.toUpperCase();
    const methodCheck = this.generateMethodCheck(spec);

    return `import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

async function processRequest(data: unknown): Promise<unknown> {
  // Implement your API business logic here
  // Example: process data, call external services, database operations
  if (!data) {
    throw new Error('Invalid request data');
  }

  // Process and return the result
  return {
    processed: true,
    input: data,
    processedAt: new Date().toISOString(),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Method validation
  if (req.method !== '${method}') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    ${methodCheck}

    // Process request data
    const requestData = req.method === 'GET' ? req.query : req.body;

    // Implement business logic
    // Example API operations:
    // 1. Validate request data
    if (!requestData || Object.keys(requestData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request data is required',
      });
    }

    // 2. Perform business operations
    const result = await processRequest(requestData);

    // 3. Return processed data with metadata
    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError('API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}`;
  }

  /**
   * Generate method-specific checks
   */
  private generateMethodCheck(spec: NextJSApiRouteSpec): string {
    if (spec.method === 'GET') {
      return `const { ${spec.queryParams.map((p) => p.name).join(', ')} } = req.query;`;
    }

    if (spec.method === 'POST' || spec.method === 'PUT') {
      return `const body = req.body;
    if (!body) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required',
      });
    }`;
    }

    if (spec.method === 'DELETE') {
      return `const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID is required',
      });
    }`;
    }

    return '';
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: NextJSApiRouteSpec): string {
    return `import { createMocks } from 'node-mocks-http';
import handler from './[route]';

describe('/api/[route]', () => {
  it('handles ${spec.method} request', async () => {
    const { req, res } = createMocks({
      method: '${spec.method.toUpperCase()}',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(true);
  });

  it('rejects invalid method', async () => {
    const { req, res } = createMocks({
      method: 'INVALID',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
});`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: NextJSApiRouteSpec): string {
    const method = spec.method.toUpperCase();
    const url = spec.endpoint;

    let example = '';

    if (spec.method === 'GET') {
      example = `const response = await fetch('${url}?param=value');
const data = await response.json();`;
    } else if (spec.method === 'POST' || spec.method === 'PUT') {
      example = `const response = await fetch('${url}', {
  method: '${method}',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* data */ }),
});
const data = await response.json();`;
    } else if (spec.method === 'DELETE') {
      example = `const response = await fetch('${url}', {
  method: 'DELETE',
});
const data = await response.json();`;
    }

    return `// Usage in a React component
async function example() {
  try {
    ${example}
    console.log('Success:', data);
  } catch (error) {
    logError('Error:', error);
  }
}`;
  }
}
