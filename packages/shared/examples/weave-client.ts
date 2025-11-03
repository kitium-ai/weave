import { Weave } from '@weaveai/core';

export const weave = await Weave.createAsync({
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! },
});
