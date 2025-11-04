# Weave React

Rich React bindings for the Weave AI framework. Ship AI-driven features with
first-class hooks, context, and UI components that share the same execution
controllers used across every Weave integration.

## Highlights

- **AI orchestration hooks** – `useAI`, `useGenerateAI`, `useClassifyAI`, and
  friends expose budgeting, cost tracking, and error handling powered by the
  shared `AIExecutionController`.
- **Chat experiences out of the box** – `useAIChat`, `AIChat`, and the
  supporting UI helpers manage message persistence, streaming updates, and
  overflow policies.
- **Smart caching helpers** – `useCache` combines the Weave cache manager with
  UI-friendly feedback so you can surface hits, misses, and savings inside your
  product.
- **Provider visibility** – `useProviderRouting`, `ProviderSwitch`, and
  `ProviderEventFeed` keep users informed as routing falls back between AI
  providers.

## Installation

```bash
npm install @weaveai/core @weaveai/react
# or
yarn add @weaveai/core @weaveai/react
```

## Quick Start

```tsx
import { WeaveProvider, useGenerateAI } from '@weaveai/react';
import { Weave } from '@weaveai/core';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! },
});

function HaikuGenerator() {
  const { generate, data, loading, cost } = useGenerateAI({
    onError: (error) => logError(error.message),
    trackCosts: true,
  });

  return (
    <div>
      <button
        onClick={() => generate('Write a haiku about cherry blossoms in spring.')}
        disabled={loading}
      >
        {loading ? 'Dreaming…' : 'Create haiku'}
      </button>

      {data && <pre>{data.data.text}</pre>}
      {cost && <small>Cost so far: ${cost.totalCost.toFixed(4)}</small>}
    </div>
  );
}

export function App() {
  return (
    <WeaveProvider weave={weave}>
      <HaikuGenerator />
    </WeaveProvider>
  );
}
```

## Chat Experiences

```tsx
import { useAIChat, AIChat } from '@weaveai/react';

function SupportAssistant() {
  const chat = useAIChat({
    systemPrompt: 'You are a friendly support agent. Answer concisely.',
    streaming: { enabled: true, renderer: 'markdown' },
    persistence: { localStorage: 'support-chat', autoSave: true },
    trackCosts: true,
    maxMessages: 40,
    onOverflow: 'summarize',
  });

  return <AIChat {...chat} title="Support Assistant" />;
}
```

## Caching & Provider Routing

```tsx
import { useCache, useProviderRouting, ProviderSwitch, ProviderEventFeed } from '@weaveai/react';
import { CacheConfig } from '@weaveai/core';
import { createUIRouter } from './router-factory';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 60 * 15,
  onCacheHit: ({ savings }) => console.log('Cache savings', savings),
};

function ProvidersPanel() {
  const router = createUIRouter(); // wraps UIAwareProviderRouter
  const routing = useProviderRouting({
    router,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  return (
    <section>
      <ProviderSwitch
        providers={routing.providers}
        currentProvider={routing.currentProvider ?? undefined}
        onProviderSelect={routing.selectProvider}
      />
      <ProviderEventFeed events={routing.events} />
    </section>
  );
}

function CachedResponse({ prompt }: { prompt: string }) {
  const cache = useCache({
    cacheConfig,
    showNotification: true,
  });

  useEffect(() => {
    cache.queryCache(prompt).then((cached) => {
      if (!cached) {
        // run fresh AI call and then storeInCache(...)
      }
    });
  }, [prompt]);

  return null;
}
```

## Examples

See the [`examples`](./examples) directory for runnable snippets that expand on
the sections above:

- `haiku-generator.tsx` – minimal `useGenerateAI` usage
- `support-chat.tsx` – conversational UI with streaming
- `providers-panel.tsx` – monitoring provider routing events
- `cache-check.ts` – cache hits/misses with savings reporting

Each example is framework-agnostic and can be dropped into a Vite or CRA
playground with the `WeaveProvider` configured. The shared controllers ensure
behavior stays consistent with Vue, Angular, Svelte, and React Native bindings.

## Further Reading

- [Core package](../core) for provider configuration and low-level APIs.
- [Shared package](../shared) for the reusable controllers that power the React
  bindings.
- [Examples workspace](../../examples) for full framework demos.\*\*\* End Patch
