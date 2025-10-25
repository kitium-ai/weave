/**
 * Express.js middleware for Weave AI framework
 */

import type { Request, Response, NextFunction } from 'express';
import type { Weave } from '@weave/core';

export interface WeaveMiddlewareOptions {
  path?: string;
}

/**
 * Create Express middleware for Weave
 */
export function createWeaveMiddleware(weave: Weave, options?: WeaveMiddlewareOptions) {
  const path = options?.path || '/api/weave';

  return {
    /**
     * Middleware to attach Weave instance to request
     */
    middleware: (req: Request, res: Response, next: NextFunction) => {
      (req as any).weave = weave;
      next();
    },

    /**
     * Handler for generate endpoint
     */
    generateHandler: async (req: Request, res: Response) => {
      try {
        const { prompt, options } = req.body;

        if (!prompt || typeof prompt !== 'string') {
          return res.status(400).json({ error: 'Prompt is required and must be a string' });
        }

        const result = await weave.generate(prompt, options);
        return res.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ error: message });
      }
    },

    /**
     * Handler for classify endpoint
     */
    classifyHandler: async (req: Request, res: Response) => {
      try {
        const { text, labels } = req.body;

        if (!text || typeof text !== 'string') {
          return res.status(400).json({ error: 'Text is required and must be a string' });
        }

        if (!Array.isArray(labels)) {
          return res.status(400).json({ error: 'Labels must be an array' });
        }

        const result = await weave.classify(text, labels);
        return res.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ error: message });
      }
    },

    /**
     * Handler for extract endpoint
     */
    extractHandler: async (req: Request, res: Response) => {
      try {
        const { text, schema } = req.body;

        if (!text || typeof text !== 'string') {
          return res.status(400).json({ error: 'Text is required and must be a string' });
        }

        if (!schema) {
          return res.status(400).json({ error: 'Schema is required' });
        }

        const result = await weave.extract(text, schema);
        return res.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ error: message });
      }
    },
  };
}

/**
 * Setup Express routes for Weave
 */
export function setupWeaveRoutes(
  app: any,
  weave: Weave,
  options?: WeaveMiddlewareOptions & { basePath?: string }
) {
  const basePath = options?.basePath || '/api/weave';
  const { middleware, generateHandler, classifyHandler, extractHandler } = createWeaveMiddleware(weave, options);

  app.use(middleware);

  app.post(`${basePath}/generate`, generateHandler);
  app.post(`${basePath}/classify`, classifyHandler);
  app.post(`${basePath}/extract`, extractHandler);
}
