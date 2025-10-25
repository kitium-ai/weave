import { Injectable, Inject } from '@nestjs/common';
import type { Weave } from '@weaveai/core';
import { WEAVE_INSTANCE } from './weave.module';

@Injectable()
export class ClassifyService {
  constructor(@Inject(WEAVE_INSTANCE) private readonly weave: Weave) {}

  async classify(text: string, labels: string[]) {
    return this.weave.classify(text, labels);
  }
}
