# Getting Started with Weave

Weave is a universal AI integration framework that works seamlessly across React, Vue, Svelte, Angular, Node.js, Next.js, NestJS, React Native, and Flutter. Get started in minutes.

## Installation

### Core Package

```bash
npm install @weave/core
# or
yarn add @weave/core
```

### Framework Integration

Choose the integration for your framework:

```bash
# React
npm install @weave/react

# Vue 3
npm install @weave/vue

# Svelte
npm install @weave/svelte

# Angular
npm install @weave/angular

# Next.js
npm install @weave/nextjs

# Node.js/Express
npm install @weave/nodejs

# NestJS
npm install @weave/nestjs

# React Native
npm install @weave/react-native

# Flutter
flutter pub add weave_flutter
```

## Quick Start

### 1. Initialize Weave with a Provider

```typescript
import { createWeave } from '@weave/core';
import { OpenAIProvider } from '@weave/core/providers';

const weave = createWeave({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  }),
});
```

### 2. Use in Your Framework

#### React
```jsx
import { useGenerateAI } from '@weave/react';

function MyComponent() {
  const { data, loading, error, generate } = useGenerateAI(weave);

  const handleGenerate = async () => {
    await generate('Write a poem about AI');
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {data && <p>{data}</p>}
      {error && <p style={{color: 'red'}}>{error.message}</p>}
    </div>
  );
}
```

#### Vue 3
```vue
<template>
  <div>
    <button @click="generate" :disabled="loading">
      {{ loading ? 'Generating...' : 'Generate' }}
    </button>
    <p v-if="data">{{ data }}</p>
    <p v-if="error" style="color: red">{{ error.message }}</p>
  </div>
</template>

<script setup>
import { useGenerateAI } from '@weave/vue';

const { data, loading, error, generate } = useGenerateAI(weave);
</script>
```

#### Svelte
```svelte
<script>
  import { createGenerateStore } from '@weave/svelte';

  const store = createGenerateStore(weave);
  const { state, generate } = store;

  async function handleGenerate() {
    await generate('Write a poem about AI');
  }
</script>

<button on:click={handleGenerate} disabled={$state.loading}>
  {$state.loading ? 'Generating...' : 'Generate'}
</button>
{#if $state.data}
  <p>{$state.data}</p>
{/if}
{#if $state.error}
  <p style="color: red">{$state.error.message}</p>
{/if}
```

#### Angular
```typescript
import { Component } from '@angular/core';
import { GenerateService } from '@weave/angular';

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
})
export class GenerateComponent {
  state$ = this.generateService.state$;
  loading$ = this.state$.pipe(map(s => s.loading));
  data$ = this.state$.pipe(map(s => s.data));
  error$ = this.state$.pipe(map(s => s.error));

  constructor(private generateService: GenerateService) {}

  async generate() {
    await this.generateService.generate('Write a poem about AI');
  }
}
```

#### Node.js/Express
```typescript
import express from 'express';
import { setupWeaveRoutes } from '@weave/nodejs';

const app = express();
app.use(express.json());

setupWeaveRoutes(app, weave, { basePath: '/api/ai' });

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('API available at http://localhost:3000/api/ai');
});
```

#### Next.js
```typescript
import { createGenerateHandler } from '@weave/nextjs';

export const POST = createGenerateHandler({ weave });

// Use in client components
import { useGenerateAI } from '@weave/nextjs';
```

#### NestJS
```typescript
import { Module } from '@nestjs/common';
import { WeaveModule } from '@weave/nestjs';

@Module({
  imports: [WeaveModule.register({ weave })],
})
export class AppModule {}
```

#### React Native
```jsx
import { useGenerateAI } from '@weave/react-native';

function MyComponent() {
  const { data, loading, error, generate } = useGenerateAI(weave);

  return (
    <View>
      <Pressable onPress={() => generate('Write a poem about AI')}>
        <Text>{loading ? 'Generating...' : 'Generate'}</Text>
      </Pressable>
      {data && <Text>{data}</Text>}
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
    </View>
  );
}
```

#### Flutter
```dart
class MyWidget extends StatefulWidget {
  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  late GenerateProvider provider;

  @override
  void initState() {
    super.initState();
    provider = GenerateProvider(baseUrl: 'http://localhost:3000/api');
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<GenerateProvider>.value(
      value: provider,
      child: Consumer<GenerateProvider>(
        builder: (context, provider, _) {
          return Column(
            children: [
              ElevatedButton(
                onPressed: () => provider.generate('Write a poem about AI'),
                child: Text(provider.state.loading ? 'Generating...' : 'Generate'),
              ),
              if (provider.state.data != null)
                Text(provider.state.data!),
              if (provider.state.error != null)
                Text(
                  provider.state.error!.toString(),
                  style: TextStyle(color: Colors.red),
                ),
            ],
          );
        },
      ),
    );
  }
}
```

## Core Operations

Weave provides 8 core AI operations:

- **Generate**: Create text from a prompt
- **Classify**: Categorize text into labels
- **Extract**: Extract structured data using schemas
- **Chat**: Multi-turn conversations
- **Summary**: Summarize long texts
- **Translate**: Translate between languages
- **Sentiment**: Analyze sentiment
- **Custom**: Define your own operations

## Supported Providers

- **OpenAI**: GPT-4, GPT-3.5-Turbo
- **Anthropic**: Claude 3 family
- **Google**: Gemini models
- **Local**: Ollama for local models
- **Mock**: For testing

## Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet

# Google
GOOGLE_API_KEY=AIza...
GOOGLE_MODEL=gemini-pro
```

## Next Steps

- Read the [API Reference](./API_REFERENCE.md)
- Explore [Examples](../examples)
- Check [Deployment Guide](./DEPLOYMENT.md)
- Review [Best Practices](./BEST_PRACTICES.md)

## Support

- GitHub Issues: https://github.com/kitium-ai/weave/issues
- Documentation: https://weave.ai/docs
- Community: https://discord.gg/weave

## License

Apache 2.0 - See LICENSE file for details
