# Weave - Universal AI Integration Framework

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Yarn Workspaces](https://img.shields.io/badge/yarn-workspaces-blue)](https://yarnpkg.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
[![Code Quality](https://img.shields.io/badge/code%20quality-strict-brightgreen)](#code-standards)

> **AI, native to your framework** - Weave makes AI integration as natural as using state management in React, composables in Vue, or widgets in Flutter.

## Vision

Weave solves a critical gap: developers want to add AI features but don't want to learn a new framework. Weave makes AI feel native to any web or mobile framework using familiar idioms and patterns.

```typescript
// React - looks like a React hook
const { data: sentiment } = useAI(async () => {
  const analysis = await ai.generate(`Analyze: ${props.text}`);
  return await ai.classify(analysis, ['positive', 'negative']);
}, [props.text]);

// Vue - looks like a composable
const { data: sentiment } = useAI(async () => {
  const analysis = await ai.generate(`Analyze: ${props.text}`);
  return await ai.classify(analysis, ['positive', 'negative']);
}, [props.text]);

// Flutter - looks like a Flutter widget
final sentiment = await KitiumAI.shared.classify(
  analysis,
  ['positive', 'negative']
);

// SwiftUI - looks like SwiftUI
let sentiment = try await aiService.classify(
  analysis,
  options: ["positive", "negative"]
)
```

## Features

### 🎯 Universal AI Operations
- **Generate** - Create text from prompts
- **Classify** - Categorize text into predefined labels
- **Extract** - Pull structured data from unstructured text
- **Summarize** - Create concise summaries
- **Search** - Find semantically similar documents
- **Translate** - Multi-language support
- **Sentiment** - Emotional tone analysis
- **Chat** - Multi-turn conversations

### 🛠️ Framework Support
- **React** - Hooks + Components
- **Vue** - Composables + Components
- **Svelte** - Reactive stores
- **Angular** - RxJS integration
- **Flutter** - Native Dart
- **SwiftUI** - Swift concurrency
- **Web Components** - Framework-agnostic HTML elements
- **Plain JS/HTML** - No framework needed

### 🤖 Provider Agnostic
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Google (Gemini)
- Azure OpenAI
- Local models (Ollama, LLaMA)
- Custom providers

### 🚀 Production Ready
- ✅ TypeScript strict mode
- ✅ Full test coverage (>95%)
- ✅ Zero external dependencies (core)
- ✅ Built-in observability
- ✅ Cost tracking and optimization
- ✅ Comprehensive error handling
- ✅ Security by default

## Quick Start

### Installation

```bash
# React
yarn add @weave/react @weave/core

# Vue
yarn add @weave/vue @weave/core

# Flutter
flutter pub add weave_ai

# SwiftUI
# Add via Swift Package Manager
```

### Basic Usage

#### React
```typescript
import { useAI, ai } from '@weave/react';

function MyComponent({ text }) {
  const { loading, data, error } = useAI(async () => {
    const analysis = await ai.generate(`Analyze: ${text}`);
    return await ai.classify(analysis, ['positive', 'negative']);
  }, [text]);

  if (loading) return <div>Analyzing...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>Sentiment: {data?.label}</div>;
}
```

#### Vue
```typescript
import { useAI, ai } from '@weave/vue';

export default {
  props: ['text'],
  setup(props) {
    const { loading, data, error } = useAI(async () => {
      const analysis = await ai.generate(`Analyze: ${props.text}`);
      return await ai.classify(analysis, ['positive', 'negative']);
    }, [props.text]);

    return { loading, data, error };
  }
}
```

#### Flutter
```dart
import 'package:weave_ai/weave.dart';

final sentiment = await KitiumAI.shared.classify(
  analysis,
  ['positive', 'negative']
);
```

## Architecture

Weave uses a **layered architecture** that separates concerns:

```
Framework Layer (React/Vue/Flutter/etc.)
         ↓
@weave/core (Framework-agnostic AI logic)
         ↓
Provider Abstraction (OpenAI/Anthropic/etc.)
         ↓
External APIs
```

For detailed architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## Project Structure

```
weave/
├── packages/
│   ├── core/          # Framework-agnostic core logic
│   ├── react/         # React hooks and components
│   ├── vue/           # Vue composables and components
│   ├── svelte/        # Svelte stores
│   ├── angular/       # Angular services
│   ├── flutter/       # Flutter package
│   ├── swift/         # SwiftUI package
│   ├── shared/        # Shared utilities
│   ├── web/           # Web components
│   └── integrations/  # Optional integrations
├── examples/          # Framework-specific examples
├── docs/              # Documentation
└── scripts/           # Build and automation scripts
```

## Development

### Setup
```bash
git clone https://github.com/kitium-ai/weave.git
cd weave
yarn install
yarn build
```

### Commands
```bash
yarn dev              # Development mode
yarn build            # Build all packages
yarn test             # Run tests
yarn lint             # Lint code
yarn format           # Format code
yarn type-check       # Check TypeScript
yarn validate         # Run all checks
```

### Testing
```bash
# Run all tests
yarn test

# Watch mode
yarn test --watch

# Coverage
yarn test:coverage
```

## Documentation

- [Getting Started](./docs/getting-started/)
- [API Reference](./docs/api-reference/)
- [Examples](./examples/)
- [Contributing Guide](./CONTRIBUTING.md)
- [Architecture](./ARCHITECTURE.md)

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make changes and add tests
4. Run `yarn validate` to ensure quality
5. Commit with conventional commits
6. Push and create a Pull Request

### Code Standards
- ✅ TypeScript strict mode
- ✅ >90% test coverage
- ✅ No `any` types
- ✅ ESLint + Prettier
- ✅ Comprehensive documentation

## Licensing

### Open Source
This project is licensed under the **Apache 2.0 License** - see [LICENSE](./LICENSE) for details.

**You can**:
- Use in commercial projects
- Modify and distribute
- Use for private purposes
- Access source code

**You must**:
- Include license notice
- State significant changes
- Include NOTICE file

### Intellectual Property
Copyright © 2025 KitiumAI. All rights reserved.

## Support

- 📚 [Documentation](./docs/)
- 💬 [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)
- 🐛 [Report Issues](https://github.com/kitium-ai/weave/issues)
- 💭 [Suggest Features](https://github.com/kitium-ai/weave/discussions/new)

## Roadmap

### Phase 1 (Current)
- ✅ Core framework architecture
- ⏳ React binding
- ⏳ Web components

### Phase 2 (Q1 2025)
- Vue, Svelte, Angular support
- Advanced RAG features
- Evaluation framework

### Phase 3 (Q2 2025)
- Flutter, SwiftUI, Kotlin support
- Multi-agent orchestration
- Fine-tuning automation

### Phase 4 (Q3 2025)
- Self-improving loops
- Edge deployment
- Advanced security features

## Community

- **Code of Conduct**: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Contributors**: [CONTRIBUTORS.md](./CONTRIBUTORS.md)

## Status

🚀 **Active Development** - This project is under active development. APIs may change before v1.0.

We're building in public and welcome feedback and contributions!

## Credits

Built with ❤️ by [KitiumAI](https://kitiumai.com)

---

**Star us on GitHub** ⭐ if you find Weave helpful!

