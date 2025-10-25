import { Injectable, Inject } from '@nestjs/common';
import type { Weave } from '@weaveai/core';
import { WEAVE_INSTANCE } from './weave.module';

@Injectable()
export class GenerateService {
  constructor(@Inject(WEAVE_INSTANCE) private readonly weave: Weave) {}

  async generate(prompt: string, options?: { [key: string]: unknown }) {
    return this.weave.generate(prompt, options);
  }
}
