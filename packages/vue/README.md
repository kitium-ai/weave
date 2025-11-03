# Weave Vue

Composition API bindings for the Weave AI framework. Combine Vue composables
with the shared controllers that power the React, Angular, Svelte, and
React&nbsp;Native integrations.

## Highlights

- **Composable AI state** – `useAI`, `useGenerateAI`, `useClassifyAI`, and
  `useExtractAI` expose the budgeting and cost tracking from
  `AIExecutionController`.
- **Conversation management** – `useAIChat` delivers multi-turn conversations
  with persistence, overflow summarisation, and streaming updates.
- **Cache awareness** – `useCache` turns the smart Weave cache manager into a
  Vue-friendly store so you can surface savings, misses, and stats.
- **Provider routing insights** – `useProviderRouting` keeps your UI in sync
  with the `UIAwareProviderRouter`.

## Installation

```bash
npm install @weaveai/core @weaveai/vue
# or
yarn add @weaveai/core @weaveai/vue
```

## Quick Start

```ts
import { createApp } from 'vue';
import { Weave } from '@weaveai/core';
import App from './App.vue';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: import.meta.env.VITE_OPENAI_KEY },
});

const app = createApp(App);
app.provide('weave', weave);
app.mount('#app');
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useGenerateAI } from '@weaveai/vue';

const prompt = ref('Write a product tagline for a collaborative AI canvas.');
const { generate, data, loading, cost } = useGenerateAI({
  trackCosts: true,
});

const run = () => generate(prompt.value);
</script>

<template>
  <section>
    <textarea v-model="prompt" rows="3" />
    <button :disabled="loading" @click="run">
      {{ loading ? 'Generating…' : 'Generate tagline' }}
    </button>

    <pre v-if="data">{{ data.data.text }}</pre>
    <p v-if="cost">Cost: {{ cost.totalCost.toFixed(4) }} {{ cost.currency }}</p>
  </section>
</template>
```

## Chat Experiences

```vue
<script setup lang="ts">
import { useAIChat } from '@weaveai/vue';

const chat = useAIChat({
  systemPrompt: 'You are a friendly concierge.',
  streaming: { enabled: true, renderer: 'markdown' },
  persistence: { localStorage: 'concierge-chat', autoSave: true },
  trackCosts: true,
});

const send = (message: string) => chat.sendMessage(message);
</script>

<template>
  <div class="chat">
    <ul>
      <li v-for="(message, index) in chat.messages" :key="index">
        <strong>{{ message.role }}:</strong>
        <span>{{ message.content }}</span>
      </li>
    </ul>

    <form @submit.prevent="send($event.target.elements.message.value)">
      <input name="message" placeholder="Ask the concierge…" />
      <button type="submit" :disabled="chat.isLoading">Send</button>
    </form>
  </div>
</template>
```

## Cache & Provider Routing

```ts
import { computed, onMounted } from 'vue';
import { useCache, useProviderRouting } from '@weaveai/vue';
import type { CacheConfig, UIAwareProviderRouter } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 15 * 60,
};

export function useCachedPrompt(prompt: string) {
  const cache = useCache({ cacheConfig, showNotification: true });

  onMounted(async () => {
    const hit = await cache.queryCache(prompt);
    if (!hit) {
      // call weave.generate and then store the result
    }
  });

  return {
    lastFeedback: cache.lastFeedback,
    feedbackHistory: cache.feedbackHistory,
  };
}

export function useRoutingPanel(router: UIAwareProviderRouter) {
  const routing = useProviderRouting({ router, autoRefresh: true });
  const healthyProviders = computed(() => routing.providers.filter((provider) => provider.healthy));

  return { routing, healthyProviders };
}
```

## Examples

The [`examples`](./examples) directory contains drop-in Vue SFC snippets:

- `GenerateSnippet.vue` – minimal `useGenerateAI` usage
- `ConciergeChat.vue` – chat interface with streaming and persistence
- `CacheInspector.ts` – cache feedback integration
- `ProviderPanel.vue` – routing dashboard component

Each example assumes that a `Weave` instance has been provided on the Vue app
instance (see Quick Start). Copy the files into your Vite-based workspace to try
them quickly.
