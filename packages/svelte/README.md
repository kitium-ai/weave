# Weave Svelte

Reactive Svelte stores that wrap the shared Weave controllers. Compose AI
features with idiomatic reactivity—whether you need one-shot generation,
multi-turn chat, caching feedback, or provider routing dashboards.

## Highlights

- **AI operation stores** – `createAIStore`, `createGenerateStore`,
  `createClassifyStore`, and `createExtractStore` expose state, cost summaries,
  and configurable budget limits.
- **Chat experiences** – `createChatStore` manages streaming updates,
  persistence, and overflow behaviours.
- **Cache monitoring** – `createCacheStore` tracks hits, misses, cost savings,
  and aggregate stats.
- **Provider routing** – `createProviderRoutingStore` mirrors provider status
  and routing events into the Svelte reactivity graph.

## Installation

```bash
npm install @weaveai/core @weaveai/svelte
# or
yarn add @weaveai/core @weaveai/svelte
```

## Quick Start

```ts
// weave-client.ts
import { Weave } from '@weaveai/core';

export const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: import.meta.env.VITE_OPENAI_KEY },
});
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { createGenerateStore } from '@weaveai/svelte';
  import { weave } from '../weave-client';

  const generator = createGenerateStore(weave, { trackCosts: true });

  const run = async () => {
    await generator.generate('Write a warm welcome message for new teammates.');
  };
</script>

<section>
  <button on:click={run} disabled={$generator.state.loading}>
    {$generator.state.loading ? 'Generating…' : 'Generate copy'}
  </button>

  {#if $generator.state.data}
    <pre>{$generator.state.data.data.text}</pre>
  {/if}

  {#if $generator.state.cost}
    <small>
      Cost: {$generator.state.cost.totalCost.toFixed(4)} {$generator.state.cost.currency}
    </small>
  {/if}
</section>
```

## Chat Store

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createChatStore } from '@weaveai/svelte';
  import { weave } from '../weave-client';

  const chat = createChatStore(weave, {
    systemPrompt: 'You are a helpful concierge.',
    streaming: { enabled: true, renderer: 'markdown', framework: 'svelte' },
    persistence: { key: 'concierge-chat', autoSave: true },
  });

  let input = '';

  const send = async () => {
    if (!input.trim()) return;
    await chat.sendMessage(input);
    input = '';
  };

  onDestroy(() => chat.dispose());
</script>

<section>
  <ul>
    {#each $chat.state.messages as message, index}
      <li>
        <strong>{message.role}</strong>: {message.content}
      </li>
    {/each}
  </ul>

  <input bind:value={input} placeholder="Ask the concierge…" />
  <button on:click={send} disabled={$chat.state.isLoading}>Send</button>
</section>
```

## Cache & Routing Stores

```ts
import { createCacheStore, createProviderRoutingStore } from '@weaveai/svelte';
import type { CacheConfig, UIAwareProviderRouter } from '@weaveai/core';
import { weave } from '../weave-client';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 900,
};

export const cacheStore = createCacheStore({ cacheConfig });

export function initialiseRouter(router: UIAwareProviderRouter) {
  return createProviderRoutingStore(router, { autoRefresh: true });
}
```

## Examples

Browse the [`examples`](./examples) directory for ready-to-use snippets:

- `generate-card.svelte` – trigger `createGenerateStore`.
- `chat-console.svelte` – build a streaming chat console.
- `cache-inspector.ts` – monitor cache feedback.
- `provider-panel.svelte` – display provider health and routing events.

Drop the components into any SvelteKit or Vite-based project that initialises a
`Weave` client; the shared controllers keep behaviour consistent across the
entire Weave ecosystem.
