import { WeaveProvider, useAIChat, AIChat } from '@weaveai/react';
import { Weave } from '@weaveai/core';

const weave = await Weave.createAsync({
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
