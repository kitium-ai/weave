# Weave API Reference

Complete API documentation for the Weave AI framework.

## Core Classes

### Weave

Main class for AI operations.

```typescript
class Weave {
  constructor(config: WeaveConfig);

  // Core operations
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  classify(text: string, labels: string[]): Promise<ClassifyResult>;
  extract(text: string, schema: unknown): Promise<unknown>;
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
  summary(text: string, options?: SummaryOptions): Promise<string>;
  translate(text: string, targetLanguage: string): Promise<string>;
  sentiment(text: string): Promise<SentimentResult>;

  // Utility methods
  getModel(): ILanguageModel;
  countTokens(text: string): Promise<TokenCount>;
  validate(text: string): Promise<ValidationResult>;
}
```

### GenerateOptions

```typescript
interface GenerateOptions {
  temperature?: number;        // 0-2, controls randomness
  maxTokens?: number;         // Maximum tokens to generate
  topP?: number;              // Nucleus sampling parameter
  frequencyPenalty?: number;  // Reduce repetition
  presencePenalty?: number;   // Encourage new topics
  stopSequences?: string[];   // Stop generation at these sequences
}
```

### GenerateResult

```typescript
interface GenerateResult {
  text: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
}
```

### ClassifyResult

```typescript
interface ClassifyResult {
  label: string;
  confidence?: number;
  scores?: Record<string, number>;
}
```

### Message

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}
```

## React Hooks

### useAI

Generic hook for any AI operation.

```typescript
function useAI<T = unknown>(
  weave: Weave,
  options?: UseAIOptions
): UseAIReturn<T>

interface UseAIOptions {
  onStart?: () => void;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseAIReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  execute: (fn: () => Promise<T>) => Promise<T | null>;
}
```

### useGenerateAI

Specialized hook for text generation.

```typescript
function useGenerateAI(weave: Weave, options?: UseAIOptions) {
  data: string | null;
  loading: boolean;
  error: Error | null;
  status: AIStatus;
  generate: (prompt: string, options?: GenerateOptions) => Promise<string | null>;
}
```

### useClassifyAI

Specialized hook for text classification.

```typescript
function useClassifyAI(weave: Weave, options?: UseAIOptions) {
  data: ClassifyResult | null;
  loading: boolean;
  error: Error | null;
  status: AIStatus;
  classify: (text: string, labels: string[]) => Promise<ClassifyResult | null>;
}
```

### useExtractAI

Specialized hook for data extraction.

```typescript
function useExtractAI(weave: Weave, options?: UseAIOptions) {
  data: unknown | null;
  loading: boolean;
  error: Error | null;
  status: AIStatus;
  extract: (text: string, schema: unknown) => Promise<unknown | null>;
}
```

### useAIChat

Hook for multi-turn conversations.

```typescript
function useAIChat(weave: Weave, options?: UseAIChatOptions) {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  status: AIStatus;
  sendMessage: (message: string) => Promise<string | null>;
  addMessage: (message: Message) => void;
  removeMessage: (index: number) => void;
  clearMessages: () => void;
}
```

### useAIStream

Hook for streaming responses.

```typescript
function useAIStream(weave: Weave, options?: UseAIStreamOptions) {
  fullText: string;
  loading: boolean;
  error: Error | null;
  stream: (fn: AsyncGenerator<string>) => Promise<void>;
  clear: () => void;
}
```

## Vue 3 Composables

### useAI

```typescript
function useAI<T = unknown>(options?: UseAIOptions) {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: ComputedRef<AIStatus>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
}
```

### useGenerateAI, useClassifyAI, useExtractAI

Similar to React hooks with Ref and ComputedRef returns for reactivity.

## Svelte Stores

### createAIStore

```typescript
function createAIStore<T = unknown>(weave: Weave) {
  state: Readable<AIState<T>>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}
```

### createGenerateStore, createClassifyStore, createExtractStore

Specialized stores with domain-specific methods.

## Angular Services

### AIService

```typescript
@Injectable({ providedIn: 'root' })
class AIService<T = unknown> {
  state$: Observable<AIState<T>>;
  getState(): AIState<T>;
  execute(fn: () => Promise<T>): Promise<T | null>;
  reset(): void;
}
```

### GenerateService, ClassifyService, ExtractService

Specialized services with domain-specific methods and Observable patterns.

## Node.js/Express

### setupWeaveRoutes

```typescript
function setupWeaveRoutes(
  app: Express,
  weave: Weave,
  options?: WeaveRouteOptions & { basePath?: string }
): void
```

Creates three endpoints:
- `POST /generate`
- `POST /classify`
- `POST /extract`

### Request/Response Examples

**Generate**
```json
POST /api/ai/generate
Content-Type: application/json

{
  "prompt": "Write a haiku about AI",
  "options": { "temperature": 0.7 }
}

Response: 200 OK
{
  "text": "Logic flows like streams...",
  "tokens": { "input": 5, "output": 6, "total": 11 }
}
```

**Classify**
```json
POST /api/ai/classify
Content-Type: application/json

{
  "text": "This product is amazing!",
  "labels": ["positive", "negative", "neutral"]
}

Response: 200 OK
{
  "label": "positive",
  "confidence": 0.98
}
```

## Next.js

### createGenerateHandler

```typescript
export const POST = createGenerateHandler({ weave });
```

Returns a handler compatible with Next.js 13+ App Router.

## NestJS

### WeaveModule

```typescript
@Module({})
export class AppModule {
  imports: [WeaveModule.register({ weave })]
}
```

Provides services with dependency injection.

## React Native

Similar to React hooks but with proper cleanup using isMounted ref.

## Flutter

### GenerateProvider, ClassifyProvider, ExtractProvider

```dart
class GenerateProvider extends AIProvider<String> with ChangeNotifier {
  Future<String?> generate(String prompt, [Map<String, dynamic>? options]);
}
```

Uses ChangeNotifier for state management compatible with Provider package.

## Advanced Features

### Agent Framework

```typescript
class Agent {
  constructor(config: AgentConfig);
  execute(goal: string): Promise<AgentResponse>;
  addTool(tool: AgentTool): void;
  removeTool(toolName: string): void;
}
```

### RAG System

```typescript
class RAGSystem {
  indexDocuments(documents: Document[]): Promise<void>;
  query(query: string, options?: RAGOptions): Promise<RAGResult>;
  addDocument(document: Document): Promise<void>;
}
```

### Evaluation Framework

```typescript
class Evaluator {
  evaluateTest(test: TestCase): Promise<EvaluationResult>;
  runTestSuite(suite: TestSuite): Promise<TestResults>;
  runABTest(testA: TestCase, testB: TestCase): Promise<ABTestResults>;
}
```

## Error Handling

### Error Types

```typescript
class WeaveError extends Error {}
class ProviderError extends WeaveError {}
class ValidationError extends WeaveError {}
class RateLimitError extends WeaveError {}
class AuthenticationError extends WeaveError {}
```

### Example Error Handling

```typescript
try {
  const result = await weave.generate(prompt);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retrying in 1 second');
    setTimeout(() => retry(), 1000);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof ValidationError) {
    console.log('Invalid input:', error.message);
  }
}
```

## TypeScript Support

Weave is fully typed with TypeScript strict mode enabled.

```typescript
// Fully typed operations
const result = await weave.generate('Hello');
// result is inferred as GenerateResult

const classified = await weave.classify('text', ['label1', 'label2']);
// classified is inferred as ClassifyResult
```

## More Information

- [Getting Started](./GETTING_STARTED.md)
- [Best Practices](./BEST_PRACTICES.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Examples](../examples)
