/**
 * NestJS module for Weave AI framework
 */

import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import type { Weave } from '@weaveai/core';
import { WeaveService } from './weave.service.js';
import { GenerateService } from './generate.service.js';
import { ClassifyService } from './classify.service.js';
import { ExtractService } from './extract.service.js';

export interface WeaveModuleOptions {
  weave: Weave;
}

export const WEAVE_INSTANCE = 'WEAVE_INSTANCE';

/**
 * Global Weave module for NestJS
 */
@Global()
@Module({
  providers: [WeaveService, GenerateService, ClassifyService, ExtractService],
  exports: [WeaveService, GenerateService, ClassifyService, ExtractService],
})
export class WeaveModule {
  /**
   * Register Weave instance
   */
  static register(options: WeaveModuleOptions): DynamicModule {
    const weaveProvider: Provider = {
      provide: WEAVE_INSTANCE,
      useValue: options.weave,
    };

    return {
      module: WeaveModule,
      providers: [weaveProvider, WeaveService, GenerateService, ClassifyService, ExtractService],
      exports: [weaveProvider, WeaveService, GenerateService, ClassifyService, ExtractService],
    };
  }
}
