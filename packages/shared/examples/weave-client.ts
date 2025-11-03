import { Weave } from '@weaveai/core';

export const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! },
});
