/**
 * Next.js generator types
 */

import type { BaseSpec } from '@weaveai/shared';

/**
 * Next.js API route specification
 */
export interface NextJSApiRouteSpec extends BaseSpec {
  framework: 'nextjs';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  queryParams: Array<{ name: string; type: string; required: boolean }>;
  bodySchema?: Record<string, string>;
  responseSchema?: Record<string, string>;
  features: string[];
}

/**
 * Next.js page specification
 */
export interface NextJSPageSpec extends BaseSpec {
  framework: 'nextjs';
  title: string;
  route: string;
  isServerComponent: boolean;
  features: string[];
}

/**
 * Next.js middleware specification
 */
export interface NextJSMiddlewareSpec extends BaseSpec {
  framework: 'nextjs';
  routes: string[];
  actions: string[];
}
