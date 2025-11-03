/**
 * NestJS service for Weave AI framework
 */

import { Injectable, Inject } from '@nestjs/common';
import type { Weave } from '@weaveai/core';
import { WEAVE_INSTANCE } from './weave.module.js';

/**
 * Base Weave service
 */
@Injectable()
export class WeaveService {
  constructor(@Inject(WEAVE_INSTANCE) protected weave: Weave) {}

  /**
   * Get Weave instance
   */
  getWeave(): Weave {
    return this.weave;
  }
}

/**
 * Generate service
 */
@Injectable()
export class GenerateServiceNest extends WeaveService {
  /**
   * Generate text from prompt
   */
  async generate(prompt: string, options?: { [key: string]: unknown }): Promise<string> {
    const result = await this.weave.generate(prompt, options);
    return result.data.text;
  }
}

/**
 * Classify service
 */
@Injectable()
export class ClassifyServiceNest extends WeaveService {
  /**
   * Classify text into categories
   */
  async classify(text: string, labels: string[]): Promise<unknown> {
    return await this.weave.classify(text, labels);
  }
}

/**
 * Extract service
 */
@Injectable()
export class ExtractServiceNest extends WeaveService {
  /**
   * Extract structured data from text
   */
  async extract(text: string, schema: unknown): Promise<unknown> {
    return await this.weave.extract(text, schema);
  }
}

// Re-export with shorter names for convenience
export {
  GenerateServiceNest as GenerateService,
  ClassifyServiceNest as ClassifyService,
  ExtractServiceNest as ExtractService,
};
