# Weave - Universal AI Integration Framework

[![License: Apache 2.0)](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Yarn Workspaces](https://img.shields.io/badge/yarn-workspaces-blue)](https://yarnpkg.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)

> AI, native to your framework — Weave makes AI integration as natural as using state management in React, composables in Vue, or widgets in Flutter.

## What is Weave?

Weave is a universal AI integration framework that brings AI capabilities to any web or mobile application. It provides a consistent API across multiple AI providers (OpenAI, Anthropic, Google, etc.) and seamlessly integrates with your favorite framework using familiar patterns and idioms.

Whether you're building with React, Vue, Angular, Flutter, or Node.js backends, Weave helps you add intelligent features like text generation, classification, data extraction, and multi-turn conversations with minimal setup.

## Key Features

### AI Operations

- **Generate** — Create text from prompts
- **Classify** — Categorize text into predefined labels
- **Extract** — Pull structured data from unstructured text
- **Chat** — Multi-turn conversations
- **Summarize** — Create concise summaries
- **Search** — Find semantically similar documents
- **Translate** — Multi-language support
- **Sentiment** — Emotional tone analysis

### Framework Support

- **React** — Hooks + Components
- **Vue** — Composables + Components
- **Svelte** — Reactive stores
- **Angular** — RxJS integration
- **React Native** — Mobile apps
- **Flutter** — Cross-platform mobile
- **Node.js/Express** — Backend servers
- **Next.js** — Full-stack applications
- **NestJS** — Enterprise backend
- **Plain JavaScript** — No framework needed

### AI Providers

Works with any AI provider:

- OpenAI (GPT-4, GPT-3.5-turbo)
- Anthropic (Claude 3)
- Google (Gemini)
- Azure OpenAI
- Local models (Ollama, LLaMA)
- Custom providers

### Production Ready

- Full TypeScript support with strict mode
- Comprehensive error handling
- Built-in cost tracking and analytics
- Streaming support for real-time responses
- Rate limiting protection
- Security best practices

### Unified UI Building Blocks

- **Shared AI controllers** – Reuse the same budgeting, cost tracking, and execution logic across every framework.
- **Chat orchestration** – Vue composables, Svelte stores, Angular services, and React Native hooks now share the rich multi-turn chat engine from the React package.
- **Smart caching helpers** – Cache feedback, stats, and invalidation flows are exposed consistently through framework primitives.
- **Provider routing UI** – Monitor and steer provider fallbacks with unified state for Vue, Angular, Svelte, and React Native.

## Quick Start

### Installation

For your framework:

**React/Vue/Svelte/Angular:**

```bash
npm install @weaveai/core @weaveai/react
# or @weaveai/vue, @weaveai/svelte, @weaveai/angular
```

**Node.js/Express:**

```bash
npm install @weaveai/core @weaveai/nodejs
```

**Next.js:**

```bash
npm install @weaveai/core @weaveai/nextjs @weaveai/react
```

**NestJS:**

```bash
npm install @weaveai/core @weaveai/nestjs
```

**React Native:**

```bash
npm install @weaveai/core @weaveai/react-native
```

**Flutter:**

```bash
flutter pub add weave_flutter
```

### Basic Example

**React:**

```typescript
import { useAI } from '@weaveai/react';

function MyComponent() {
  const { data: result, loading } = useAI(async () => {
    return await weave.generate('Write a haiku about AI');
  });

  return (
    <div>
      {loading ? 'Thinking...' : result}
    </div>
  );
}
```

**Node.js/Express:**

```typescript
import { Weave } from '@weaveai/core';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! },
});

app.post('/api/generate', async (req, res) => {
  const result = await weave.generate(req.body.prompt);
  res.json(result);
});
```

**Vue:**

```typescript
import { useAI } from '@weaveai/vue';

export default {
  setup() {
    const { data: result, loading } = useAI(async () => {
      return await weave.generate('Write a haiku about AI');
    });

    return { result, loading };
  },
};
```

**Angular:**

```typescript
import { AIService } from '@weaveai/angular';

@Component({
  selector: 'app-chat',
  template: `<div>{{ result$ | async }}</div>`,
})
export class ChatComponent {
  result$ = this.ai.generate('Write a haiku about AI');

  constructor(private ai: AIService) {}
}
```

**Next.js API Route:**

```typescript
import { Weave } from '@weaveai/core';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await weave.generate(req.body.prompt);
  res.status(200).json(result);
}
```

**Svelte:**

```typescript
import { createAI } from '@weaveai/svelte';

const { result, loading } = createAI(() => weave.generate('Write a haiku about AI'));
```

**NestJS:**

```typescript
@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('generate')
  async generate(@Body() body: { prompt: string }) {
    return this.aiService.generate(body.prompt);
  }
}
```

**React Native:**

```typescript
import { useAI } from '@weaveai/react-native';

function ChatScreen() {
  const { data: result, loading } = useAI(async () => {
    return await weave.generate('Write a haiku about AI');
  });

  return (
    <View>
      <Text>{loading ? 'Thinking...' : result}</Text>
    </View>
  );
}
```

**Flutter:**

```dart
import 'package:weave_flutter/weave_flutter.dart';

class ChatScreen extends StatelessWidget {
  final WeaveAI weave = WeaveAI(
    provider: OpenAIProvider(apiKey: 'your-key'),
  );

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: weave.generate('Write a haiku about AI'),
      builder: (context, snapshot) {
        return Text(snapshot.data ?? 'Loading...');
      },
    );
  }
}
```

## API Overview

### Core Operations

All examples use this pattern:

```typescript
// Generate text
const result = await weave.generate(prompt, options);

// Classify text
const label = await weave.classify(text, ['positive', 'negative', 'neutral']);

// Extract structured data
const data = await weave.extract(text, schema);

// Multi-turn chat
const response = await weave.chat([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' },
]);
```

### Configuration Options

```typescript
const weave = await Weave.createAsync({
  provider: {
    type: 'openai', // or 'anthropic', 'google', 'azure'
    apiKey: process.env.API_KEY,
    model: 'gpt-4', // model name
  },
  streaming: true, // enable streaming
  timeout: 30000, // request timeout
  maxRetries: 3, // auto-retry failed requests
});
```

## Examples

Weave comes with comprehensive examples for every framework:

- **React Chat App** — Full-featured chat interface with hooks
- **Vue Chat App** — Composition API chat application
- **Svelte Chat App** — Reactive store-based chat
- **Angular Chat App** — RxJS Observable-based chat
- **Next.js** — Full-stack chat with SSR
- **NestJS API** — Enterprise backend API
- **Node.js/Express** — REST API with middleware
- **React Native** — Mobile chat application
- **Flutter** — Cross-platform mobile app

See [examples/README.md](./examples/README.md) for detailed setup and running instructions for each example.

## Environment Setup

Create a `.env` or `.env.local` file in your project root:

```bash
# OpenAI
OPENAI_API_KEY=sk_...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=AIza...

# Azure
AZURE_OPENAI_KEY=...
AZURE_OPENAI_ENDPOINT=...
```

For frontend apps (React, Vue, etc.), use framework-specific env variables:

```bash
REACT_APP_OPENAI_API_KEY=sk_...
VITE_OPENAI_API_KEY=sk_...
```

## Documentation

- [Getting Started Guide](./docs/GETTING_STARTED.md) — Detailed setup and first steps
- [API Reference](./docs/API_REFERENCE.md) — Complete API documentation
- [Best Practices](./docs/BEST_PRACTICES.md) — Tips and patterns
- [Architecture Guide](./docs/ARCHITECTURE.md) — System design and components
- [Deployment Guide](./docs/DEPLOYMENT.md) — Production deployment

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Weave is licensed under the Apache 2.0 License. See [LICENSE](./LICENSE) for details.
