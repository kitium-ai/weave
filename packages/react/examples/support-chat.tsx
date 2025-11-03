import { WeaveProvider, useAIChat, AIChat } from '@weaveai/react';
import { Weave } from '@weaveai/core';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const weave = await Weave.createAsync({
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! },
});

function SupportChat() {
  const chat = useAIChat({
    systemPrompt: 'You are a concise assistant for app customers.',
    streaming: { enabled: true, renderer: 'markdown' },
    persistence: { localStorage: 'support-chat', autoSave: true },
    maxMessages: 40,
    onOverflow: 'summarize',
  });

  return <AIChat {...chat} title="Support Assistant" />;
}

export function Example() {
  return (
    <WeaveProvider weave={weave}>
      <SupportChat />
    </WeaveProvider>
  );
}
