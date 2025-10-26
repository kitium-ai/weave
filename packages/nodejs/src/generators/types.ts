/**
 * Node.js generator types
 */

import type { BaseSpec } from '@weaveai/shared';

/**
 * Express server specification
 */
export interface ExpressServerSpec extends BaseSpec {
  framework: 'express';
  port: number;
  middleware: Array<{
    name: string;
    purpose: string;
    source?: string;
  }>;
  routes: string[];
  security: {
    cors: boolean;
    helmet: boolean;
    rateLimit: boolean;
  };
  features: string[];
}

/**
 * Express controller specification
 */
export interface ExpressControllerSpec extends BaseSpec {
  framework: 'express';
  endpoint: string;
  methods: Array<{
    name: string;
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description: string;
    params?: Array<{ name: string; type: string }>;
    returnType: string;
  }>;
  features: string[];
}

/**
 * Express middleware specification
 */
export interface ExpressMiddlewareSpec extends BaseSpec {
  framework: 'express';
  routes: string[];
  purpose: string;
  errorHandling: boolean;
  features: string[];
}
