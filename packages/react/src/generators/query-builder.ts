/**
 * Query Builder
 * Generates React Query hooks for data fetching
 */

/**
 * Query specification
 */
export interface QuerySpec {
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  requestType: string;
  responseType: string;
  features: string[];
  options: QueryOption[];
}

/**
 * Query option
 */
export interface QueryOption {
  name: string;
  type: string;
  description: string;
  defaultValue?: unknown;
}

/**
 * Generated query output
 */
export interface GeneratedQuery {
  queryCode: string;
  queryName: string;
  typesFile: string;
  apiClientCode: string;
  exampleUsage: string;
  testFile: string;
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    description: string;
  };
}

/**
 * QueryBuilder - Generates React Query hooks
 */
export class QueryBuilder {
  /**
   * Build query hook from specification
   */
  public static buildQuery(spec: QuerySpec, description: string): GeneratedQuery {
    const queryCode = this.generateQueryCode(spec);
    const typesFile = this.generateTypesFile(spec);
    const apiClientCode = this.generateAPIClient(spec);
    const exampleUsage = this.generateExampleUsage(spec);
    const testFile = this.generateTestFile(spec);

    return {
      queryCode,
      queryName: spec.name,
      typesFile,
      apiClientCode,
      exampleUsage,
      testFile,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'weave-query-generator',
        description,
      },
    };
  }

  /**
   * Generate React Query hook code
   */
  private static generateQueryCode(spec: QuerySpec): string {
    const hookName = spec.name;
    const keyName = `${this.toLowerCamelCase(spec.name)}Key`;
    const isMutation = ['POST', 'PUT', 'DELETE'].includes(spec.method);

    if (isMutation) {
      return `/**
 * ${hookName} - Mutation hook
 * ${spec.description}
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { api${this.toPascalCase(spec.name)} } from './api-client';
import type { ${spec.requestType}, ${spec.responseType} } from './types';

/**
 * Query key for ${hookName}
 */
export const ${keyName} = {
  all: ['${this.toLowerCamelCase(spec.name)}'] as const,
  mutation: () => [${keyName}.all, 'mutation'] as const,
};

/**
 * ${hookName} mutation hook
 */
export function ${hookName}(
  options?: UseMutationOptions<${spec.responseType}, Error, ${spec.requestType}>,
) {
  const queryClient = useQueryClient();

  return useMutation<${spec.responseType}, Error, ${spec.requestType}>({
    mutationFn: api${this.toPascalCase(spec.name)},
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ${keyName}.all });
      options?.onSuccess?.(data, {} as any, {} as any);
    },
    onError: (error) => {
      options?.onError?.(error, {} as any, {} as any);
    },
    ...options,
  });
}`;
    }

    return `/**
 * ${hookName} - Query hook
 * ${spec.description}
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { api${this.toPascalCase(spec.name)} } from './api-client';
import type { ${spec.responseType} } from './types';

/**
 * Query key for ${hookName}
 */
export const ${keyName} = {
  all: ['${this.toLowerCamelCase(spec.name)}'] as const,
  list: () => [${keyName}.all, 'list'] as const,
  detail: (id: string) => [${keyName}.all, 'detail', id] as const,
};

/**
 * Options for ${hookName}
 */
export interface ${this.toPascalCase(spec.name)}Options
  extends Omit<UseQueryOptions<${spec.responseType}, Error>, 'queryKey' | 'queryFn'> {
  // Add custom options here
}

/**
 * ${hookName} query hook
 */
export function ${hookName}(options?: ${this.toPascalCase(spec.name)}Options) {
  return useQuery<${spec.responseType}, Error>({
    queryKey: ${keyName}.list(),
    queryFn: () => api${this.toPascalCase(spec.name)}(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}`;
  }

  /**
   * Generate types file
   */
  private static generateTypesFile(spec: QuerySpec): string {
    return `/**
 * Types for ${spec.name}
 */

/**
 * Request type for ${spec.name}
 */
export interface ${spec.requestType} {
  // Add request properties
}

/**
 * Response type for ${spec.name}
 */
export interface ${spec.responseType} {
  // Add response properties
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
`;
  }

  /**
   * Generate API client code
   */
  private static generateAPIClient(spec: QuerySpec): string {
    const method = spec.method.toLowerCase();

    return `/**
 * API client for ${spec.name}
 */

import { api } from '@/lib/api-client'; // Adjust import based on your setup
import type { ${spec.requestType}, ${spec.responseType} } from './types';

/**
 * ${spec.description}
 */
export async function api${this.toPascalCase(spec.name)}(
  ${['POST', 'PUT'].includes(spec.method) ? `data?: ${spec.requestType}` : ''}
): Promise<${spec.responseType}> {
  const response = await api.${method}<${spec.responseType}>({
    url: '${spec.endpoint}',
    method: '${spec.method}',
    ${['POST', 'PUT'].includes(spec.method) ? 'data,' : ''}
  });

  return response.data;
}`;
  }

  /**
   * Generate example usage
   */
  private static generateExampleUsage(spec: QuerySpec): string {
    const hookName = spec.name;
    const isMutation = ['POST', 'PUT', 'DELETE'].includes(spec.method);

    if (isMutation) {
      return `/**
 * Example usage of ${hookName}
 */

import { ${hookName} } from './${spec.name}';

export function Example() {
  const mutation = ${hookName}({
    onSuccess: (data) => {
      console.log('Success:', data);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const handleSubmit = async (formData: any) => {
    await mutation.mutateAsync(formData);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(new FormData(e.currentTarget));
    }}>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Submitting...' : 'Submit'}
      </button>
      {mutation.isError && <p>Error: {mutation.error?.message}</p>}
    </form>
  );
}`;
    }

    return `/**
 * Example usage of ${hookName}
 */

import { ${hookName} } from './${spec.name}';

export function Example() {
  const { data, isLoading, isError, error } = ${hookName}({
    // Add options here
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      {data && (
        <div>
          {/* Render data here */}
        </div>
      )}
    </div>
  );
}`;
  }

  /**
   * Generate test file
   */
  private static generateTestFile(spec: QuerySpec): string {
    const isMutation = ['POST', 'PUT', 'DELETE'].includes(spec.method);
    const hookName = spec.name;

    return `/**
 * Tests for ${hookName}
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ${hookName} } from './${hookName}';
import * as apiClient from './api-client';

describe('${hookName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ${isMutation ? 'mutate' : 'fetch'} data successfully', async () => {
    const mockData = { id: '1' };
    vi.spyOn(apiClient, 'api${this.toPascalCase(spec.name)}').mockResolvedValue(mockData);

    const { result } = renderHook(() => ${hookName}());

    await waitFor(() => {
      ${isMutation ? `expect(result.current.isPending).toBe(false);` : `expect(result.current.isLoading).toBe(false);`}
    });
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    vi.spyOn(apiClient, 'api${this.toPascalCase(spec.name)}').mockRejectedValue(error);

    const { result } = renderHook(() => ${hookName}());

    await waitFor(() => {
      ${isMutation ? `expect(result.current.isError).toBe(true);` : `expect(result.current.isError).toBe(true);`}
    });
  });
});
`;
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

  /**
   * Convert to PascalCase
   */
  private static toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}
