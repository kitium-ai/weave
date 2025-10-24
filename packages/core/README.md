# @weave/core

The framework-agnostic core of Weave - universal AI operations without framework dependencies.

## Features

- 🎯 Universal AI operations (generate, classify, extract, etc.)
- 🤖 Provider-agnostic (OpenAI, Anthropic, Google, local, custom)
- 🔧 Tool integration framework
- 💾 Memory and state management
- 📊 Built-in observability
- ⚡ Streaming support
- 🛡️ Type-safe with TypeScript strict mode

## Installation

```bash
yarn add @weave/core
# or
npm install @weave/core
```

## Quick Start

```typescript
import { WeaveAI, OpenAIProvider } from '@weave/core';

// Initialize with provider
const weave = new WeaveAI({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

// Generate text
const text = await weave.generate('Write a haiku about AI');
console.log(text);

// Classify text
const sentiment = await weave.classify(
  'I love this framework!',
  ['positive', 'negative', 'neutral']
);
console.log(sentiment); // { label: 'positive', confidence: 0.98 }

// Extract structured data
const data = await weave.extract(
  'John Doe, 30 years old, john@example.com',
  {
    schema: {
      name: 'string',
      age: 'number',
      email: 'string',
    },
  }
);
console.log(data); // { name: 'John Doe', age: 30, email: 'john@example.com' }
```

## API Reference

### WeaveAI

Main entry point for all AI operations.

```typescript
const weave = new WeaveAI(config: WeaveConfig);
```

**Config Options**:
- `provider` (IProvider): AI provider (OpenAI, Anthropic, etc.)
- `cache` (boolean): Enable response caching (default: true)
- `logging` (LogLevel): Log level ('debug' | 'info' | 'error')
- `timeout` (number): Request timeout in ms (default: 30000)

### Operations

#### generate(prompt, options?)

Generate text from a prompt.

```typescript
const text = await weave.generate('Write a poem about AI', {
  model: 'gpt-4',
  temperature: 0.8,
  maxTokens: 500,
  streaming: true,
  onChunk: (chunk) => console.log(chunk),
});
```

#### classify(text, labels, options?)

Classify text into predefined categories.

```typescript
const result = await weave.classify(
  'This product is amazing!',
  ['positive', 'negative', 'neutral'],
  { model: 'gpt-3.5-turbo' }
);
// Returns: { label: 'positive', confidence: 0.95, scores: {...} }
```

#### extract(text, schema, options?)

Extract structured data from unstructured text.

```typescript
const schema = {
  name: 'string',
  email: 'string',
  phone: 'string?',
};

const data = await weave.extract(resume, { schema });
```

#### summary(text, options?)

Create a concise summary of text.

```typescript
const brief = await weave.summary(longArticle, {
  style: 'bullet-points',
  sentences: 3,
});
```

#### search(query, documents, options?)

Find semantically similar documents.

```typescript
const results = await weave.search(
  'How do I reset password?',
  documentList
);
// Returns: [{ document, similarity: 0.92 }, ...]
```

#### translate(text, targetLanguage, options?)

Translate text to another language.

```typescript
const spanish = await weave.translate(
  'Hello, how are you?',
  'Spanish'
);
```

#### sentiment(text, options?)

Analyze emotional tone.

```typescript
const analysis = await weave.sentiment('I am very happy!');
// Returns: { compound: 0.84, positive: 0.76, negative: 0, neutral: 0.24 }
```

#### chat(messages, options?)

Multi-turn conversation.

```typescript
const response = await weave.chat([
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'What is AI?' },
]);
```

## Providers

### Built-in Providers

**OpenAI**
```typescript
import { OpenAIProvider } from '@weave/core';

const weave = new WeaveAI({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  }),
});
```

**Anthropic**
```typescript
import { AnthropicProvider } from '@weave/core';

const weave = new WeaveAI({
  provider: new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
});
```

**Google**
```typescript
import { GoogleProvider } from '@weave/core';

const weave = new WeaveAI({
  provider: new GoogleProvider({
    apiKey: process.env.GOOGLE_API_KEY,
  }),
});
```

**Local (Ollama)**
```typescript
import { OllamaProvider } from '@weave/core';

const weave = new WeaveAI({
  provider: new OllamaProvider({
    baseURL: 'http://localhost:11434',
    model: 'llama2',
  }),
});
```

### Custom Provider

```typescript
import { BaseProvider, ILanguageModel } from '@weave/core';

class MyCustomProvider extends BaseProvider {
  public async generate(prompt: string): Promise<string> {
    // Your implementation
  }

  public async embed(text: string): Promise<number[]> {
    // Your implementation
  }
}

const weave = new WeaveAI({
  provider: new MyCustomProvider(),
});
```

## Tools

Add custom tools for AI to use.

```typescript
import { Tool } from '@weave/core';

const searchTool = new Tool({
  name: 'web_search',
  description: 'Search the web for information',
  inputSchema: {
    query: 'string',
  },
  execute: async (input) => {
    return await performWebSearch(input.query);
  },
});

weave.addTool(searchTool);

// AI can now use this tool automatically
const result = await weave.generate(
  'Find information about TypeScript',
  { tools: [searchTool] }
);
```

## Testing

```typescript
import { createMockProvider } from '@weave/core/testing';

const mockProvider = createMockProvider({
  generate: async () => 'mocked response',
});

const weave = new WeaveAI({ provider: mockProvider });

const result = await weave.generate('test prompt');
expect(result).toBe('mocked response');
```

## Error Handling

```typescript
import {
  WeaveError,
  ProviderError,
  ValidationError,
  RateLimitError,
} from '@weave/core';

try {
  const result = await weave.generate(prompt);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited:', error.statusCode);
  } else if (error instanceof ProviderError) {
    console.error('Provider error:', error.code);
  } else if (error instanceof WeaveError) {
    console.error('Weave error:', error.message);
  }
}
```

## Performance Tips

1. **Enable Caching**: Cache responses for repeated operations
   ```typescript
   const weave = new WeaveAI({ cache: true });
   ```

2. **Use Streaming**: Stream responses instead of waiting
   ```typescript
   await weave.generate(prompt, { streaming: true });
   ```

3. **Batch Operations**: Group multiple operations
   ```typescript
   const results = await Promise.all([
     weave.classify(text1, labels),
     weave.classify(text2, labels),
   ]);
   ```

4. **Model Cascading**: Use cheaper models first
   ```typescript
   // Implement in your application layer
   ```

## API Reference

See [API Reference](../../docs/api-reference/) for complete documentation.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

Apache 2.0 - See [LICENSE](../../LICENSE)
