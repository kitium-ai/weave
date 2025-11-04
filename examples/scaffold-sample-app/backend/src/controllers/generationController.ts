/**
 * Generation Controller
 * Handles HTTP requests for AI content generation
 */

import { Request, Response } from 'express';
import { generationService } from '../services/generationService.js';
import { promptService } from '../services/promptManagementService.js';
import { WeaveError, logInfo, logError } from '@weaveai/shared';
import type { ApiSuccess, ApiError, GenerateRequest, GenerateResponse } from '../types/index.js';

/**
 * POST /api/generate
 * Generate content using specified provider
 */
export async function generateContent(
  req: Request,
  res: Response<ApiSuccess<GenerateResponse> | ApiError>
): Promise<void> {
  const requestId = req.id || `req_${Date.now()}`;

  try {
    const { prompt, provider = 'default', metadata } = req.body as {
      prompt: string;
      provider?: string;
      metadata?: Record<string, unknown>;
    };

    if (!prompt || typeof prompt !== 'string') {
      throw WeaveError.validationError('Prompt is required and must be a string');
    }

    logInfo('generation.request.received', {
      requestId,
      promptLength: prompt.length,
      provider,
    });

    const generationRequest: GenerateRequest = { prompt, metadata };
    const result = await generationService.generate(generationRequest, {
      provider: generationService.getProvider(provider),
    });

    logInfo('generation.response.sent', {
      requestId,
      duration: result.cost,
    });

    res.json({
      data: result,
      timestamp: new Date(),
      meta: { duration: 100 }, // Would calculate actual duration
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (error instanceof WeaveError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.context,
          timestamp: error.timestamp,
        },
      });
    } else {
      logError('generation.error', err);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Generation failed',
          timestamp: new Date(),
        },
      });
    }
  }
}

/**
 * POST /api/generate/stream
 * Generate content with streaming response
 */
export async function generateContentStream(
  req: Request,
  res: Response
): Promise<void> {
  const requestId = req.id || `req_${Date.now()}`;

  try {
    const { prompt, provider = 'default' } = req.body as {
      prompt: string;
      provider?: string;
    };

    if (!prompt || typeof prompt !== 'string') {
      throw WeaveError.validationError('Prompt is required');
    }

    logInfo('generation.stream.started', { requestId, provider });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const providerConfig = generationService.getProvider(provider);

    // Stream tokens
    for await (const token of generationService.generateStream(
      prompt,
      providerConfig
    )) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    logInfo('generation.stream.completed', { requestId });
    res.end();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError('generation.stream.error', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

/**
 * GET /api/generate/stats
 * Get generation statistics
 */
export async function getStats(
  req: Request,
  res: Response<ApiSuccess>
): Promise<void> {
  try {
    const stats = generationService.getStats();

    res.json({
      data: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError('stats.fetch.error', err);
    res.status(500).json({
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to fetch statistics',
        timestamp: new Date(),
      },
    });
  }
}

/**
 * POST /api/generate/test
 * Test prompt rendering and generation
 */
export async function testGeneration(
  req: Request,
  res: Response<ApiSuccess | ApiError>
): Promise<void> {
  try {
    const { promptId, template, variables } = req.body as {
      promptId?: string;
      template?: string;
      variables?: Record<string, unknown>;
    };

    const actualTemplate = template || (promptId && promptService.getPrompt(promptId)?.template);

    if (!actualTemplate) {
      throw WeaveError.validationError('Template or promptId is required');
    }

    const testVariables = variables || {};

    const result = await promptService.testPrompt(
      promptId || 'test',
      actualTemplate,
      testVariables
    );

    res.json({
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError('test.generation.error', err);
    res.status(400).json({
      error: {
        code: 'TEST_ERROR',
        message: 'Generation test failed',
        timestamp: new Date(),
      },
    });
  }
}

/**
 * POST /api/generate/batch
 * Generate content for multiple prompts
 */
export async function batchGenerate(
  req: Request,
  res: Response<ApiSuccess | ApiError>
): Promise<void> {
  try {
    const { prompts, provider = 'default' } = req.body as {
      prompts: Array<{ prompt: string; metadata?: Record<string, unknown> }>;
      provider?: string;
    };

    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw WeaveError.validationError('Prompts array is required');
    }

    logInfo('batch.generation.started', { count: prompts.length, provider });

    const results = await Promise.all(
      prompts.map(p =>
        generationService.generate(p, {
          provider: generationService.getProvider(provider),
        }).catch(err => ({
          text: '',
          provider: 'error',
          model: 'error',
          tokensUsed: 0,
          cost: 0,
          timestamp: new Date(),
          error: (err as Error).message,
        }))
      )
    );

    logInfo('batch.generation.completed', { count: results.length });

    res.json({
      data: { results, total: results.length },
      timestamp: new Date(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError('batch.generation.error', err);
    res.status(400).json({
      error: {
        code: 'BATCH_ERROR',
        message: 'Batch generation failed',
        timestamp: new Date(),
      },
    });
  }
}
