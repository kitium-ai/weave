import { useEffect } from 'react';
import { WeaveProvider, useGenerateAI } from '@weaveai/react';
import { Weave } from '@weaveai/core';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const client = await Weave.createAsync({
  provider: {
    type: 'openai',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    apiKey: process.env.OPENAI_API_KEY!,
  },
});

function HaikuGenerator() {
  const { generate, data, loading, cost } = useGenerateAI({
    trackCosts: true,
  });

  useEffect(() => {
    void generate('Write a haiku about weaving ideas together.');
  }, [generate]);

  return (
    <article>
      <h2>Weave Haiku</h2>
      {loading && <p>Weaving words…</p>}
      {data && <pre>{data.data.text}</pre>}
      {cost && <small>Tokens used: {cost.tokens.output}</small>}
    </article>
  );
}

export function Example() {
  return (
    <WeaveProvider weave={client}>
      <HaikuGenerator />
    </WeaveProvider>
  );
}
