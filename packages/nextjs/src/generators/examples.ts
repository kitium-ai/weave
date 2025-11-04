/**
 * Next.js Generators Examples
 * Demonstrates how to use Next.js API route and page generators
 */
import { logError, logInfo } from '@weaveai/shared';
import {
  NextJSApiRouteBuilder,
  NextJSPageBuilder,
  NextJSApiRouteSpec,
  NextJSPageSpec,
} from '@weaveai/nextjs';

/**
 * Example 1: Generate a Next.js API route for product management
 */
export function exampleApiRouteGeneration(): void {
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
    language: 'typescript',
  };

  const builder = new NextJSApiRouteBuilder();
  const output = builder.build(
    apiRouteSpec,
    'API route for fetching products with pagination and search support'
  );

  logInfo('Generated API Route Code:');
  logInfo(output.code);
  logInfo('\nGenerated Tests:');
  logInfo(output.tests || '');
  logInfo('\nGenerated Examples:');
  logInfo(output.examples || '');
}

/**
 * Example 2: Generate a POST API route
 */
export function examplePostApiRoute(): void {
  const apiRouteSpec: NextJSApiRouteSpec = {
    name: 'create-product-api',
    description: 'API route for creating a new product',
    framework: 'nextjs',
    endpoint: '/api/products',
    method: 'POST',
    queryParams: [],
    bodySchema: {
      name: 'string',
      price: 'number',
      description: 'string',
    },
    responseSchema: {
      success: 'boolean',
      data: 'Product',
      message: 'string',
    },
    features: ['validation', 'error handling', 'database insertion'],
    language: 'typescript',
  };

  const builder = new NextJSApiRouteBuilder();
  const output = builder.build(apiRouteSpec, 'API route for creating new products with validation');

  logInfo('Generated Create Product API:');
  logInfo(output.code);
}

/**
 * Example 3: Generate a Next.js page
 */
export function examplePageGeneration(): void {
  const pageSpec: NextJSPageSpec = {
    name: 'dashboard',
    description: 'Dashboard page for displaying user analytics',
    framework: 'nextjs',
    title: 'Dashboard',
    route: '/dashboard',
    isServerComponent: false,
    features: ['charts', 'real-time updates', 'data fetching', 'responsive design'],
    language: 'typescript',
  };

  const builder = new NextJSPageBuilder();
  const output = builder.build(
    pageSpec,
    'Interactive dashboard page with charts and real-time data'
  );

  logInfo('Generated Page Code:');
  logInfo(output.code);
  logInfo('\nGenerated Tests:');
  logInfo(output.tests || '');
  logInfo('\nGenerated Examples:');
  logInfo(output.examples || '');
}

/**
 * Example 4: API route usage in a component
 */
export const apiUsageExample = `
'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const response = await fetch(\`/api/products?page=\${page}&limit=10\`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded p-4">
            <h2 className="font-bold">{product.name}</h2>
            <p className="text-gray-600">\${product.price}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
`;

/**
 * Example 5: Create product form
 */
export const createProductExample = `
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface ProductForm {
  name: string;
  price: number;
  description: string;
}

export default function CreateProductPage() {
  const { register, handleSubmit } = useForm<ProductForm>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(data: ProductForm) {
    try {
      setLoading(true);
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setMessage(result.message || 'Product created successfully');
    } catch (error) {
      setMessage('Error creating product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Product</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label>Product Name</label>
          <input
            {...register('name', { required: true })}
            type="text"
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Price</label>
          <input
            {...register('price', { required: true })}
            type="number"
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            {...register('description')}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
`;

/**
 * Example 6: Integrated usage
 */
export async function runIntegratedExample(): Promise<void> {
  logInfo('=== Next.js Generators Examples ===\n');

  logInfo('1. Generating API Route (GET)...');
  exampleApiRouteGeneration();

  logInfo('\n2. Generating API Route (POST)...');
  examplePostApiRoute();

  logInfo('\n3. Generating Page Component...');
  examplePageGeneration();

  logInfo('\n4. API Usage in Component:');
  logInfo(apiUsageExample);

  logInfo('\n5. Create Product Form:');
  logInfo(createProductExample);
}

// Run examples if this file is executed directly
if (require.main === module) {
  runIntegratedExample().catch(logError);
}
