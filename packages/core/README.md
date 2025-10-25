# @weaveai/core

The framework-agnostic core of Weave — universal AI operations without framework dependencies.

## Features

- Universal AI operations (generate, classify, extract, etc.)
- Provider-agnostic (OpenAI, Anthropic, Google, local, custom)
- Tool integration framework
- Memory and state management
- Built-in observability and cost tracking
- Streaming support (onChunk)
- Type-safe with TypeScript strict mode

## Installation

```bash
yarn add @weaveai/core
# or
npm install @weaveai/core
```

## Quick Start (async init)

```typescript
import { Weave } from '@weaveai/core';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! },
});

const { text, tokenCount } = await weave.generate('Write a haiku about AI', {
  streaming: true,
  onChunk: (chunk) => process.stdout.write(chunk),
});
console.log('\nTokens:', tokenCount);
```

## API Reference

### Weave

Main entry point for all AI operations.

```typescript
const weave = await Weave.createAsync(config: WeaveConfig);
```

**Config Options**:
- `provider` (ProviderConfig): AI provider configuration (OpenAI, Anthropic, Google, etc.)
- `cache` (boolean): Enable response caching
- `logging` (LogLevel): Log level ('debug' | 'info' | 'error')
- `timeout` (number): Request timeout in ms

### Operations

#### generate(prompt, options?)

Generate text from a prompt.

```typescript
const { text } = await weave.generate('Write a poem about AI', {
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
  ['positive', 'negative', 'neutral']
);
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
