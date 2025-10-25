# Weave Framework: Architecture & Design Document

## Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Monorepo Structure](#monorepo-structure)
4. [Core Architecture](#core-architecture)
5. [Module Organization](#module-organization)
6. [API Design](#api-design)
7. [Quality Standards](#quality-standards)
8. [Performance & Scalability](#performance--scalability)
9. [Security & Compliance](#security--compliance)
10. [Testing Strategy](#testing-strategy)
11. [Documentation Standards](#documentation-standards)
12. [Governance & Contribution](#governance--contribution)

---

## Overview

**Weave** is a language-agnostic AI integration framework that makes AI feel native to any web or mobile framework (React, Vue, Svelte, Angular, Flutter, SwiftUI, etc.).

### Key Architecture Goals
- **Framework-Agnostic**: Core logic independent of framework
- **Production-Ready**: Enterprise-grade quality from day one
- **Type-Safe**: Full TypeScript support everywhere
- **Modular**: Composable, tree-shakeable packages
- **Observable**: Built-in tracing, logging, metrics
- **Extensible**: Plugin architecture for community

### Vision
```
Simple Weave + Framework = Native AI Integration
```

---

## Design Principles

### 1. Separation of Concerns
- **Core Layer**: Framework-agnostic AI logic
- **Binding Layer**: Framework-specific hooks/components
- **Provider Layer**: Model & service abstraction
- **Integration Layer**: External service connections

### 2. SOLID Principles

**Single Responsibility**
- Each module has one reason to change
- AI operations separated from state management
- Providers isolated from core logic

**Open/Closed**
- Open for extension via plugins
- Closed for modification via stable interfaces
- New providers without changing core

**Liskov Substitution**
- All providers implement consistent interface
- Swappable without changing consumer code
- Type-safe provider switching

**Interface Segregation**
- Small, focused interfaces
- No fat client interfaces
- Framework-specific APIs tailored to idioms

**Dependency Inversion**
- Depend on abstractions, not concretions
- Inject configuration, not hardcode
- Plugin system for extensibility

### 3. DRY (Don't Repeat Yourself)
- Shared logic in `@weaveai/core`
- Framework integrations only differ by idiom
- Common patterns extracted to utilities

### 4. Progressive Enhancement
- Simple use cases: Zero config
- Complex use cases: Full control
- Advanced features: Optional, opt-in

### 5. Zero Surprises
- Explicit over implicit
- Transparent operation tracing
- Clear error messages
- No magic or black boxes

---

## Monorepo Structure

### Why Monorepo?

1. **Code Sharing**: Core logic shared across all packages
2. **Unified Versioning**: Framework bindings stay synchronized
3. **Atomic Updates**: Fix core → all frameworks benefit
4. **Easier Testing**: Integration tests across packages
5. **Developer Experience**: Single clone, single dev setup

### Using Yarn Workspaces

```yaml
# package.json at root
{
  "private": true,
  "workspaces": [
    "packages/core",
    "packages/react",
    "packages/vue",
    "packages/svelte",
    "packages/angular",
    "packages/flutter",
    "packages/swift",
    "packages/shared",
    "packages/integrations/*",
    "examples/*"
  ]
}
```

---

## Directory Structure

```
weave/
├── .github/
│   ├── workflows/          # CI/CD pipelines
│   ├── CODEOWNERS          # Code ownership
│   └── ISSUE_TEMPLATE/     # Issue templates
│
├── packages/
│   ├── core/               # Framework-agnostic core
│   │   ├── src/
│   │   │   ├── operations/     # generate, classify, extract, etc.
│   │   │   ├── providers/      # Provider abstraction layer
│   │   │   ├── tools/          # Tool management
│   │   │   ├── types/          # Shared TypeScript types
│   │   │   ├── utils/          # Utilities
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── react/              # React-specific SDK
│   │   ├── src/
│   │   │   ├── hooks/      # useAI, useAIChat, useAIStream
│   │   │   ├── components/ # AIComponent, AIChat
│   │   │   ├── context/    # React Context for state
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── vue/                # Vue-specific SDK
│   │   ├── src/
│   │   │   ├── composables/    # useAI, useAIChat
│   │   │   ├── components/     # <AIComponent>, <AIChat>
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── svelte/             # Svelte-specific SDK
│   ├── angular/            # Angular-specific SDK
│   ├── flutter/            # Flutter SDK (Dart)
│   ├── swift/              # SwiftUI SDK
│   │
│   ├── integrations/       # Optional integrations
│   │   ├── openai/         # @weaveai/openai
│   │   ├── anthropic/      # @weaveai/anthropic
│   │   ├── google/         # @weaveai/google
│   │   ├── pinecone/       # @weaveai/pinecone (vector DB)
│   │   └── ... more
│   │
│   ├── shared/             # Shared utilities
│   │   ├── src/
│   │   │   ├── logger/
│   │   │   ├── errors/
│   │   │   ├── validation/
│   │   │   └── helpers/
│   │   └── package.json
│   │
│   └── web/                # Web components (framework-agnostic)
│       ├── src/
│       │   └── components/ # <weave-generate>, <weave-chat>
│       └── package.json
│
├── examples/
│   ├── react-sentiment/
│   ├── vue-chat/
│   ├── flutter-analyzer/
│   └── ... more examples
│
├── docs/
│   ├── getting-started/
│   ├── core-concepts/
│   ├── api-reference/
│   ├── examples/
│   ├── contributing/
│   └── architecture/
│
├── scripts/
│   ├── build.ts
│   ├── test.ts
│   ├── publish.ts
│   └── version.ts
│
├── .eslintrc.json          # Linting rules
├── .prettierrc              # Code formatting
├── tsconfig.base.json      # Base TypeScript config
├── yarn.lock               # Dependency lock file
├── package.json            # Root package config
├── LICENSE                 # Apache 2.0 or similar
├── CODE_OF_CONDUCT.md      # Community guidelines
├── CONTRIBUTING.md         # Contribution guide
└── README.md               # Project overview
```

---

## Core Architecture

### Layered Architecture

```
┌──────────────────────────────────────────────────────────┐
│         Developer (Using Weave in their app)             │
├──────────────────────────────────────────────────────────┤
│  Framework-Specific Layer (React, Vue, Flutter, etc.)    │
│  ─────────────────────────────────────────────────────── │
│  Hooks, Components, State Management, Idioms             │
├──────────────────────────────────────────────────────────┤
│  @weaveai/core - Framework-Agnostic Logic                  │
│  ─────────────────────────────────────────────────────── │
│  AI Operations, Orchestration, State, Memory             │
├──────────────────────────────────────────────────────────┤
│  Provider Abstraction Layer                              │
│  ─────────────────────────────────────────────────────── │
│  OpenAI, Anthropic, Google, Local, Custom                │
├──────────────────────────────────────────────────────────┤
│  Integration Layer                                        │
│  ─────────────────────────────────────────────────────── │
│  Vector DBs, External APIs, Monitoring                   │
├──────────────────────────────────────────────────────────┤
│  External Services                                        │
│  ─────────────────────────────────────────────────────── │
│  OpenAI API, Anthropic API, Pinecone, Datadog, etc.      │
└──────────────────────────────────────────────────────────┘
```

### Core Layer: @weaveai/core

**Responsibilities**:
1. AI operation execution (generate, classify, extract, etc.)
2. Provider abstraction and management
3. Tool management and execution
4. State and memory management
5. Error handling and validation
6. Tracing and observability

**Key Components**:

#### 1. Operations Layer
```
operations/
├── base.ts          # Abstract operation class
├── generate.ts      # Text generation
├── classify.ts      # Classification
├── extract.ts       # Data extraction
├── summary.ts       # Summarization
├── search.ts        # Semantic search
├── translate.ts     # Translation
├── sentiment.ts     # Sentiment analysis
└── chat.ts          # Multi-turn conversation
```

**Design Pattern**: Each operation implements `IOperation<Input, Output>`

#### 2. Provider Layer
```
providers/
├── interfaces/      # IProvider, ILanguageModel
├── base/           # BaseProvider abstract class
├── registry/       # ProviderRegistry singleton
├── openai/         # OpenAI implementation
├── anthropic/      # Anthropic implementation
├── google/         # Google implementation
├── local/          # Local model support
└── custom/         # Custom provider interface
```

**Design Pattern**: Strategy pattern for swappable providers

#### 3. Tools Layer
```
tools/
├── interfaces/      # ITool interface
├── base/           # BaseTool abstract class
├── registry/       # Tool registry
└── built-in/       # Web search, calculator, etc.
```

#### 4. Types Layer
```
types/
├── ai.types.ts          # AI operation types
├── provider.types.ts    # Provider types
├── tool.types.ts        # Tool types
├── memory.types.ts      # Memory types
└── common.types.ts      # Shared types
```

### Framework Binding Layer

Each framework gets a minimal binding that:
1. Wraps core operations in framework idioms
2. Manages loading/error/success states
3. Handles framework-specific cleanup
4. Provides type-safe hooks/components
5. Integrates with framework state management

**React Example**:
```typescript
// Hook wraps core operation with React state
export function useAI<T>(
  fn: () => Promise<T>,
  deps: DependencyList
): { loading: boolean; data: T | null; error: Error | null }
```

---

## Module Organization

### Dependency Graph

```
@weaveai/shared
    ↑
    │
@weaveai/core (depends on @weaveai/shared)
    ↑
    │
@weaveai/react   @weaveai/vue   @weaveai/flutter
(depend on @weaveai/core, some @weaveai/shared)
    ↑
    │
@weaveai/integrations/* (depend on @weaveai/core, @weaveai/shared)
    ↑
    │
User Applications
```

### Package Exports Strategy

**@weaveai/core** exports:
```typescript
// Main API
export { WeaveAI } from './core';
export { useOperation } from './operations';

// Providers
export { OpenAIProvider } from './providers/openai';
export { AnthropicProvider } from './providers/anthropic';

// Tools
export { Tool, BaseTool } from './tools';

// Types
export type { IOperation, IProvider, ITool } from './types';

// Utilities
export { createWeaveConfig, validateConfig } from './utils';
```

**@weaveai/react** exports:
```typescript
// Hooks
export { useAI } from './hooks/useAI';
export { useAIChat } from './hooks/useAIChat';
export { useAIStream } from './hooks/useAIStream';

// Components
export { AIComponent } from './components/AIComponent';
export { AIChat } from './components/AIChat';

// Provider
export { WeaveProvider } from './context/WeaveProvider';

// Types
export type { UseAIOptions, UseAIChatOptions } from './types';
```

### Tree-Shaking Strategy

Each package is designed for optimal tree-shaking:

1. **ES Modules**: Primary build target
2. **Side Effects**: Marked `sideEffects: false` in package.json
3. **Unused Code**: Removed by bundlers
4. **Modular Imports**: Users can import only what they need

---

## API Design

### Guiding Principles

1. **Progressive Disclosure**: Simple for simple things, advanced for advanced
2. **Sensible Defaults**: Works out-of-the-box with minimal config
3. **Explicit Over Implicit**: Clear what's happening
4. **Type Safety**: Full TypeScript support
5. **Composability**: Combine small pieces

### Core API Example

**Generation**:
```typescript
interface GenerateOptions {
  model?: string;           // Defaults to configured model
  temperature?: number;     // 0-1, default 0.7
  maxTokens?: number;
  streaming?: boolean;
  onChunk?: (chunk: string) => void;
  cache?: boolean;
}

async function generate(
  prompt: string,
  options?: GenerateOptions
): Promise<string>
```

**Classification**:
```typescript
interface ClassificationResult {
  label: string;
  confidence: number;
  scores?: Record<string, number>;
}

async function classify(
  text: string,
  labels: string[],
  options?: ClassifyOptions
): Promise<ClassificationResult>
```

**Extraction**:
```typescript
interface ExtractionOptions {
  schema: ZodSchema | JSONSchema;
  strict?: boolean;  // Validate against schema
}

async function extract<T>(
  text: string,
  options: ExtractionOptions
): Promise<T>
```

### React Hook API Example

```typescript
interface UseAIOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  cache?: boolean | number;  // ms
  revalidateOnFocus?: boolean;
}

interface UseAIResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useAI<T>(
  fn: () => Promise<T>,
  deps: DependencyList,
  options?: UseAIOptions<T>
): UseAIResult<T>
```

---

## Quality Standards

### Code Quality

**TypeScript Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "moduleResolution": "node",
    "module": "esnext",
    "target": "es2020"
  }
}
```

**Linting**: ESLint with strict rules
```json
{
  "extends": ["eslint:recommended", "prettier"],
  "rules": {
    "no-console": "warn",
    "no-debugger": "error",
    "@typescript-eslint/explicit-function-return-types": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Formatting**: Prettier with consistent config
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

### Testing Standards

**Coverage Goals**:
- Core functionality: >95%
- Integration tests: >80%
- Framework bindings: >90%

**Testing Pyramid**:
```
         UI Tests (5%)
          /        \
    Integration (20%)
      /            \
  Unit Tests (75%)
```

**Testing Tools**:
- **Unit**: Vitest (fast, esbuild-based)
- **Integration**: Vitest + Testing Library
- **E2E**: Playwright (framework examples)
- **Type**: TypeScript strict mode

### Naming Conventions

**Files**:
- Source: `.ts` or `.tsx`
- Tests: `.test.ts`, `.spec.ts`
- Types: `.types.ts`
- Index files: `index.ts` (barrel exports)

**Code**:
```typescript
// Classes: PascalCase
class WeaveAI {}

// Functions/variables: camelCase
function generateText() {}

// Constants: UPPER_SNAKE_CASE
const DEFAULT_TIMEOUT = 5000;

// Interfaces: PascalCase, I prefix optional
interface IOperation {}
type Operation = {};

// Types: PascalCase
type GenerateOptions = {};
```

### Documentation Standards

**JSDoc Comments**:
```typescript
/**
 * Generates text based on a prompt.
 *
 * @param prompt - The input prompt for generation
 * @param options - Generation options
 * @returns Promise resolving to generated text
 *
 * @example
 * ```typescript
 * const text = await weave.generate('Write a poem');
 * ```
 *
 * @throws {WeaveError} If generation fails
 */
async function generate(
  prompt: string,
  options?: GenerateOptions
): Promise<string>
```

---

## Performance & Scalability

### Performance Targets

- **Operation Latency**: <2s (p95)
- **Memory per instance**: <10MB
- **Bundle size (core)**: <50KB gzipped
- **Initialization**: <100ms

### Optimization Strategies

1. **Lazy Loading**: Providers loaded on demand
2. **Code Splitting**: Framework bindings separate
3. **Caching**: Response caching, embedding caching
4. **Streaming**: Stream responses when possible
5. **Connection Pooling**: Reuse HTTP connections
6. **Request Batching**: Batch operations when safe

### Scalability Considerations

1. **Horizontal**: Stateless operations
2. **Vertical**: Efficient memory usage
3. **Distributed**: Works in serverless/edge
4. **Long-running**: Proper cleanup and resources

---

## Security & Compliance

### Security Principles

1. **Input Validation**: Validate all user inputs
2. **API Key Protection**: Never log, mask in errors
3. **No Eval**: Never execute untrusted code
4. **Data Encryption**: TLS for external communication
5. **Audit Logging**: Log all significant operations

### Configuration Management

```typescript
interface WeaveConfig {
  apiKey: string;           // Loaded from env variables
  provider: string;         // 'openai' | 'anthropic' | etc.
  baseURL?: string;
  timeout?: number;
  retries?: number;
  logging?: LogLevel;      // 'debug' | 'info' | 'error'
  tracing?: TracingConfig;
}

// Never hardcode secrets
const config = {
  apiKey: process.env.WEAVE_API_KEY,
  provider: process.env.WEAVE_PROVIDER || 'openai'
};
```

### Error Handling

Custom error hierarchy:
```typescript
class WeaveError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WeaveError';
  }
}

class ProviderError extends WeaveError {}
class ValidationError extends WeaveError {}
class RateLimitError extends WeaveError {}
class AuthenticationError extends WeaveError {}
```

### Compliance

- **GDPR Ready**: No user data persistence without consent
- **SOC 2**: Audit logging, access controls
- **HIPAA**: Optional data encryption at rest
- **CCPA**: Data export/deletion support

---

## Testing Strategy

### Unit Testing

**Structure**:
```
packages/core/tests/
├── operations/
│   ├── generate.test.ts
│   ├── classify.test.ts
│   └── ...
├── providers/
│   ├── openai.test.ts
│   └── anthropic.test.ts
└── tools/
    └── tool-registry.test.ts
```

**Pattern**:
```typescript
describe('generate operation', () => {
  describe('basic generation', () => {
    it('should generate text from prompt', async () => {
      // Arrange
      const prompt = 'Write hello world';
      const mockProvider = createMockProvider();

      // Act
      const result = await generate(prompt, { provider: mockProvider });

      // Assert
      expect(result).toContain('hello');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid prompt', async () => {
      // Test error case
    });
  });
});
```

### Integration Testing

```typescript
describe('React useAI hook integration', () => {
  it('should handle async operation correctly', async () => {
    const { result } = renderHook(() =>
      useAI(async () => {
        return await weave.generate('test');
      }, [])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Type Testing

```typescript
// Using `@arethetypeswrong/cli` for package export validation
// Using `tsd` for TypeScript definition testing

// tests/types.test-d.ts
import { expectType } from 'tsd';
import { generate } from '@weaveai/core';

// Should compile - explicit return type
const result: Promise<string> = generate('test');
expectType<Promise<string>>(result);
```

---

## Documentation Standards

### README Structure

```markdown
# @weaveai/react

Brief description

## Installation
## Quick Start
## API Reference
## Examples
## Contributing
## License
```

### API Documentation

```markdown
## API Reference

### generate(prompt, options?)

Description with purpose

**Parameters:**
- `prompt` (string): The input prompt
- `options` (GenerateOptions): Optional configuration

**Returns:** Promise<string>

**Example:**
```typescript
const text = await weave.generate('Write a poem');
```

**Errors:**
- Throws `ProviderError` if provider fails
- Throws `ValidationError` if validation fails
```

### Architecture Decision Records (ADRs)

```markdown
# ADR 001: Use Monorepo Structure

## Status
Accepted

## Context
We need to share code between framework-specific implementations.

## Decision
Use Yarn workspaces for monorepo management.

## Consequences
- Easier code sharing (positive)
- Single versioning for all packages (positive)
- More complex build process (minor negative)
```

---

## Governance & Contribution

### Licensing

**Dual License Model**:
1. **Open Source**: Apache 2.0 (or MIT)
   - Free for community use
   - Open-source projects can use freely
   - Commercial use allowed with attribution

2. **Commercial**: Paid license for enterprises
   - Additional support
   - Custom integrations
   - Commercial guarantees

### Intellectual Property

```
Copyright © 2025 KitiumAI
Licensed under Apache 2.0

All source code: Apache 2.0
All documentation: CC-BY-4.0
All examples: MIT
```

### Contribution Guidelines

**Workflow**:
1. Fork repository
2. Create feature branch (`feature/my-feature`)
3. Commit with conventional commits
4. Push and create PR
5. Pass CI/CD checks
6. Code review by maintainers
7. Merge and release

**Commit Message Format**:
```
type(scope): subject

[optional body]

[optional footer]

Examples:
- feat(core): add streaming support
- fix(react): handle unmount properly
- docs(getting-started): update examples
- test(classification): add edge cases
```

**Code Review Checklist**:
- ✅ Tests included and passing
- ✅ TypeScript strict mode passes
- ✅ Linting passes (ESLint, Prettier)
- ✅ Documentation updated
- ✅ No breaking changes without RFC
- ✅ Performance impact assessed

### Decision Making

**For Small Changes**:
- Maintainer review + approval
- Can merge once approved

**For Features**:
- RFC (Request for Comments) process
- Community discussion (1-2 weeks)
- Implementation after consensus

**For Major Changes**:
- Steering committee vote
- Extended community discussion
- Documented decision

---

## Build & Deployment

### Build Process

```bash
# Build all packages
yarn build

# Build single package
yarn workspace @weaveai/core build

# Watch mode
yarn dev
```

**Build Output**:
```
dist/
├── esm/        # ES modules (main)
├── cjs/        # CommonJS (legacy)
├── types/      # TypeScript definitions
└── docs/       # Generated documentation
```

### Versioning

**Semantic Versioning** (SemVer):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

**Release Process**:
1. Update version in package.json
2. Update CHANGELOG.md
3. Tag commit with version
4. GitHub workflow publishes to npm
5. Release notes on GitHub

### CI/CD Pipeline

**GitHub Actions**:
```yaml
on: [push, pull_request]

jobs:
  test:
    - Install dependencies
    - Lint code
    - Run tests
    - Type check
    - Build artifacts

  publish:
    (on: version tag)
    - Publish to npm
    - Publish docs
    - Create GitHub release
```

---

## Success Metrics

### Code Health
- ✅ Zero `any` types
- ✅ 95%+ test coverage
- ✅ 0 critical security issues
- ✅ <2% failing tests in CI

### Performance
- ✅ <50KB core bundle (gzipped)
- ✅ <2s operation latency (p95)
- ✅ <10MB memory per instance

### Community
- ✅ 5,000+ GitHub stars (year 1)
- ✅ 1,000+ active users
- ✅ 50+ community extensions
- ✅ 98%+ API backward compatibility

---

## Next Steps

1. Initialize monorepo with yarn workspaces
2. Create core package with base operations
3. Implement provider abstraction
4. Build React binding
5. Set up CI/CD pipeline
6. Create comprehensive tests
7. Write documentation
8. Public beta launch
