# Weave React Native

React Native hooks that bridge the Weave AI framework into mobile apps. Pair
native UI with shared controllers for AI execution, chat, caching, and provider
routing.

## Highlights

- **Execution-aware hooks** – `useAI`, `useGenerateAI`, `useClassifyAI`, and
  `useExtractAI` expose budgeting, cost tracking, and error handling from the
  shared `AIExecutionController`.
- **Streaming chat** – `useAIChat` powers multi-turn conversations with message
  persistence, overflow summarisation, and streaming updates.
- **Cache insights** – `useCache` surfaces cache hits, misses, and savings so
  you can optimise mobile bandwidth.
- **Provider awareness** – `useProviderRouting` keeps dashboards in sync with
  the `UIAwareProviderRouter` from `@weaveai/core`.

## Installation

```bash
npm install @weaveai/core @weaveai/react-native
# or
yarn add @weaveai/core @weaveai/react-native
```

## Quick Start

```tsx
import { useGenerateAI } from '@weaveai/react-native';
import { Weave } from '@weaveai/core';
import { useEffect } from 'react';
import { SafeAreaView, Text, Button, ActivityIndicator } from 'react-native';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.WEAVE_OPENAI_KEY! },
});

export function InspirationCard() {
  const { generate, data, loading, cost } = useGenerateAI(weave, {
    trackCosts: true,
  });

  useEffect(() => {
    void generate('Write a short, uplifting message for teammates.');
  }, [generate]);

  return (
    <SafeAreaView>
      {loading && <ActivityIndicator />}
      {data && <Text>{data.data.text}</Text>}
      {cost && <Text>Cost: ${cost.totalCost.toFixed(4)}</Text>}
      <Button
        title="Generate again"
        onPress={() => generate('Share another motivational note.')}
      />
    </SafeAreaView>
  );
}
```

## Chat Experiences

```tsx
import { useAIChat } from '@weaveai/react-native';
import { FlatList, Text, View, TextInput, Button } from 'react-native';
import { useState } from 'react';

export function ConciergeChat({ weave }: { weave: Weave }) {
  const chat = useAIChat(weave, {
    systemPrompt: 'You are a helpful concierge.',
    streaming: { enabled: true, renderer: 'markdown' },
    persistence: { localStorage: 'concierge-chat', autoSave: true },
  });
  const [input, setInput] = useState('');

  const send = async () => {
    if (!input.trim()) return;
    await chat.sendMessage(input);
    setInput('');
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={chat.messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>
              {item.role}: {item.content}
            </Text>
          </View>
        )}
      />
      <TextInput value={input} onChangeText={setInput} placeholder="Ask anything…" />
      <Button title="Send" onPress={send} disabled={chat.isLoading} />
    </View>
  );
}
```

## Cache & Routing

```tsx
import { useCache, useProviderRouting } from '@weaveai/react-native';
import type { CacheConfig, UIAwareProviderRouter } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 900,
};

export function CacheAwarePrompt({ prompt }: { prompt: string }) {
  const cache = useCache({ cacheConfig });

  useEffect(() => {
    cache.queryCache(prompt).then((hit) => {
      if (!hit) {
        // call weave.generate here and then store the result
      }
    });
  }, [cache, prompt]);

  return null;
}

export function ProviderSummary({ router }: { router: UIAwareProviderRouter }) {
  const routing = useProviderRouting(router, { autoRefresh: true });

  return (
    <View>
      {routing.providers.map((provider) => (
        <View key={provider.name}>
          <Text>{provider.name}</Text>
          <Text>Status: {provider.healthy ? 'Healthy' : 'Offline'}</Text>
        </View>
      ))}
    </View>
  );
}
```

## Examples

The [`examples`](./examples) directory includes self-contained snippets:

- `InspirationCard.tsx` – `useGenerateAI` for optimistic copy creation.
- `ConciergeChat.tsx` – streaming chat interface using `useAIChat`.
- `CacheInspector.ts` – integrate cache events, stats, and savings.
- `ProviderHub.tsx` – render provider status and routing events.

Import the examples into any Expo or bare React Native app after configuring a
`Weave` instance. All hooks share the controllers defined in
`@weaveai/shared`, so behaviour matches the React, Vue, Angular, and Svelte
bindings.
