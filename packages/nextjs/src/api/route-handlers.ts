/**
 * Next.js API route handlers for a Weave AI framework
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Weave } from '@weave/core';

export interface WeaveRouteOptions {
  weave: Weave;
}

/**
 * Create a generate API route handler
 */
export function createGenerateHandler(options: WeaveRouteOptions) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (request.method !== 'POST') {
      return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
      const body = await request.json();
      const { prompt, options: generateOptions } = body;

      if (!prompt || typeof prompt !== 'string') {
        return new NextResponse(
          JSON.stringify({ error: 'Prompt is required and must be a string' }),
          {
            status: 400,
          }
        );
      }

      const result = await options.weave.generate(prompt, generateOptions);
      return new NextResponse(JSON.stringify(result), { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
    }
  };
}

/**
 * Create a classified API route handler
 */
export function createClassifyHandler(options: WeaveRouteOptions) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (request.method !== 'POST') {
      return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
      const body = await request.json();
      const { text, labels } = body;

      if (!text || typeof text !== 'string') {
        return new NextResponse(
          JSON.stringify({ error: 'Text is required and must be a string' }),
          { status: 400 }
        );
      }

      if (!Array.isArray(labels)) {
        return new NextResponse(JSON.stringify({ error: 'Labels must be an array' }), {
          status: 400,
        });
      }

      const result = await options.weave.classify(text, labels);
      return new NextResponse(JSON.stringify(result), { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
    }
  };
}

/**
 * Create an extract API route handler
 */
export function createExtractHandler(options: WeaveRouteOptions) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (request.method !== 'POST') {
      return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
      const body = await request.json();
      const { text, schema } = body;

      if (!text || typeof text !== 'string') {
        return new NextResponse(
          JSON.stringify({ error: 'Text is required and must be a string' }),
          { status: 400 }
        );
      }

      if (!schema) {
        return new NextResponse(JSON.stringify({ error: 'Schema is required' }), { status: 400 });
      }

      const result = await options.weave.extract(text, schema);
      return new NextResponse(JSON.stringify(result), { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
    }
  };
}
