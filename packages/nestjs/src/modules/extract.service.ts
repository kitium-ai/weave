import { Injectable, Inject } from '@nestjs/common';
import type { Weave } from '@weaveai/core';
import { WEAVE_INSTANCE } from './weave.module';

@Injectable()
export class ExtractService {
  constructor(@Inject(WEAVE_INSTANCE) private readonly weave: Weave) {}

  async extract(text: string, schema: unknown) {
    return this.weave.extract(text, schema);
  }
}
