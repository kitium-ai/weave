# Weave - Universal AI Integration Framework

[![License: Apache 2.0)](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Yarn Workspaces](https://img.shields.io/badge/yarn-workspaces-blue)](https://yarnpkg.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)

> AI, native to your framework — Weave makes AI integration as natural as using state management in React, composables in Vue, or widgets in Flutter.

## Vision

Weave makes AI feel native to any web or mobile framework using familiar idioms and patterns.

```typescript
// React - looks like a React hook
const { data: sentiment } = useAI(async () => {
  const analysis = await ai.generate(`Analyze: ${props.text}`);
  return await ai.classify(analysis, ['positive', 'negative']);
}, [props.text]);
```

## Features

### Universal AI Operations
- Generate — Create text from prompts
- Classify — Categorize text into predefined labels
- Extract — Pull structured data from unstructured text
- Summarize — Create concise summaries
- Search — Find semantically similar documents
- Translate — Multi-language support
- Sentiment — Emotional tone analysis
- Chat — Multi-turn conversations

### Framework Support
- React — Hooks + Components
- Vue — Composables + Components
- Svelte — Reactive stores
- Angular — RxJS integration
- Flutter — Native Dart
- SwiftUI — Swift concurrency
- Web Components — Framework-agnostic HTML elements
- Plain JS/HTML — No framework needed

### Provider Agnostic
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Google (Gemini)
- Azure OpenAI
- Local models (Ollama, LLaMA)
- Custom providers

### Production Ready
- TypeScript strict mode
- Tests across core and bindings
- Zero external dependencies in core
- Built-in observability
- Cost tracking and optimization
- Comprehensive error handling
- Security by default

## Quick Start

### Installation

```bash
yarn add @weaveai/core
```

### Basic Usage (async init)

```typescript
import { Weave } from '@weaveai/core';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY! }
});

const result = await weave.generate('Write a haiku about AI', {
  streaming: true,
  onChunk: (chunk) => process.stdout.write(chunk),
});
console.log('\nTokens:', result.tokenCount);
```

## Architecture

Weave uses a layered architecture that separates concerns:

```
Framework Layer (React/Vue/Flutter/etc.)
         |
@weaveai/core (Framework-agnostic AI logic)
         |
Provider Abstraction (OpenAI/Anthropic/etc.)
         |
External APIs
```

For detailed architecture, see docs/ARCHITECTURE.md

