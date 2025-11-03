# Weave Best Practices

Best practices and patterns for using Weave effectively in production.

## 1. Provider Configuration

### Use Environment Variables

```typescript
import { createWeave } from '@weaveai/core';
import { OpenAIProvider } from '@weaveai/core/providers';

// ✅ Good
const weave = createWeave({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.OPENAI_MODEL || 'gpt-4',
  }),
});

// ❌ Avoid
const weave = createWeave({
  provider: new OpenAIProvider({
    apiKey: 'sk-1234567890abcdef',
  }),
});
```

### Validate Configuration

```typescript
// ✅ Good
function createWeaveWithValidation() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return createWeave({
    provider: new OpenAIProvider({ apiKey }),
  });
}
```

## 2. Error Handling

### Handle Specific Errors

```typescript
import { RateLimitError, AuthenticationError, ValidationError, WeaveError } from '@weaveai/core';

try {
  const result = await weave.generate(prompt);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Implement exponential backoff
    await exponentialBackoff(() => weave.generate(prompt));
  } else if (error instanceof AuthenticationError) {
    // Handle auth errors - maybe refresh token
    refreshAuthToken();
  } else if (error instanceof ValidationError) {
    // Log validation error for debugging
    console.error('Invalid input:', error.message);
  } else if (error instanceof WeaveError) {
    // Handle other Weave errors
    logger.error('Weave error:', error);
  } else {
    // Handle unknown errors
    logger.error('Unexpected error:', error);
  }
}
```

### Provide User Feedback

```typescript
// React example
function MyComponent() {
  const { data, loading, error, generate } = useGenerateAI(weave);

  if (error instanceof RateLimitError) {
    return <div>Too many requests. Please try again later.</div>;
  }
  if (error instanceof ValidationError) {
    return <div>Invalid input. Please check your prompt.</div>;
  }
  if (error) {
    return <div>An error occurred. Please try again.</div>;
  }

  return <div>{/* ... */}</div>;
}
```

## 3. Performance Optimization

### Implement Caching

```typescript
class CachedWeave {
  private cache = new Map<string, string>();

  async generateCached(prompt: string): Promise<string> {
    const cacheKey = this.hash(prompt);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = await this.weave.generate(prompt);
    this.cache.set(cacheKey, result.text);
    return result.text;
  }

  private hash(str: string): string {
    return require('crypto').createHash('sha256').update(str).digest('hex');
  }
}
```

### Batch Operations

```typescript
// ✅ Good - batch requests
async function classifyMany(texts: string[], labels: string[]) {
  const results = await Promise.all(texts.map((text) => weave.classify(text, labels)));
  return results;
}

// ❌ Avoid - sequential requests
async function classifyManySequential(texts: string[], labels: string[]) {
  const results = [];
  for (const text of texts) {
    results.push(await weave.classify(text, labels));
  }
  return results;
}
```

### Stream for Large Outputs

```typescript
// React example
function LargeGenerationComponent() {
  const { fullText, stream, loading } = useAIStream(weave);

  const handleStream = async () => {
    await stream(async function* () {
      // Yield chunks as they arrive
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
      });
      const reader = response.body!.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield new TextDecoder().decode(value);
      }
    });
  };

  return (
    <div>
      <button onClick={handleStream} disabled={loading}>
        Generate
      </button>
      <p>{fullText}</p>
    </div>
  );
}
```

## 4. Input Validation

### Validate Before Sending

```typescript
import { z } from 'zod';

const GenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(4000, 'Prompt too long'),
  temperature: z.number().min(0).max(2).optional(),
});

async function safeGenerate(input: unknown) {
  const validated = GenerateSchema.parse(input);
  return await weave.generate(validated.prompt, {
    temperature: validated.temperature,
  });
}
```

### Clean Input Data

```typescript
function sanitizePrompt(prompt: string): string {
  return prompt
    .trim() // Remove whitespace
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .slice(0, 4000); // Enforce max length
}
```

## 5. State Management

### React: Use Context for Weave Instance

```typescript
import { createContext, useContext } from 'react';
import { Weave } from '@weaveai/core';

const WeaveContext = createContext<Weave | null>(null);

export function WeaveProvider({ children, weave }) {
  return (
    <WeaveContext.Provider value={weave}>
      {children}
    </WeaveContext.Provider>
  );
}

export function useWeave() {
  const weave = useContext(WeaveContext);
  if (!weave) {
    throw new Error('useWeave must be used within WeaveProvider');
  }
  return weave;
}
```

### Vue: Global Plugin

```typescript
// main.ts
import { createApp } from 'vue';
import { createWeave } from '@weaveai/core';

const weave = createWeave(/* ... */);

app.provide('weave', weave);
```

### Angular: Service Singleton

```typescript
import { Injectable } from '@angular/core';
import { createWeave } from '@weaveai/core';

@Injectable({ providedIn: 'root' })
export class WeaveService {
  private weave = createWeave(/* ... */);

  generate(prompt: string) {
    return this.weave.generate(prompt);
  }
}
```

## 6. Testing

### Mock Weave for Tests

```typescript
import { vi } from 'vitest';

const mockWeave = {
  generate: vi.fn().mockResolvedValue({ text: 'mocked response' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive' }),
  extract: vi.fn().mockResolvedValue({ data: 'extracted' }),
} as unknown as Weave;

describe('MyComponent', () => {
  it('should generate text', async () => {
    const { getByText } = render(<MyComponent weave={mockWeave} />);
    fireEvent.click(getByText('Generate'));
    await waitFor(() => {
      expect(getByText('mocked response')).toBeInTheDocument();
    });
  });
});
```

### Test Error Handling

```typescript
it('should handle generation errors', async () => {
  const mockWeave = {
    generate: vi.fn().mockRejectedValue(new Error('API Error')),
  } as unknown as Weave;

  const { getByText } = render(<MyComponent weave={mockWeave} />);
  fireEvent.click(getByText('Generate'));

  await waitFor(() => {
    expect(getByText(/error/i)).toBeInTheDocument();
  });
});
```

## 7. Monitoring and Logging

### Log Operations

```typescript
async function generateWithLogging(prompt: string) {
  const startTime = Date.now();
  const logger = getLogger();

  logger.info('Generate operation started', { prompt: prompt.slice(0, 100) });

  try {
    const result = await weave.generate(prompt);
    const duration = Date.now() - startTime;

    logger.info('Generate operation completed', {
      duration,
      tokens: result.tokens,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Generate operation failed', {
      duration,
      error: error.message,
    });
    throw error;
  }
}
```

### Track Metrics

```typescript
interface OperationMetrics {
  duration: number;
  tokensUsed: number;
  success: boolean;
  errorType?: string;
}

class MetricsCollector {
  private metrics: OperationMetrics[] = [];

  recordOperation(metrics: OperationMetrics) {
    this.metrics.push(metrics);
    this.sendToAnalytics(metrics);
  }

  getAverageLatency() {
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  private sendToAnalytics(metrics: OperationMetrics) {
    // Send to your analytics service
  }
}
```

## 8. Security

### Validate API Keys

```typescript
function validateApiKey(key: string): boolean {
  if (!key) return false;
  if (key.length < 20) return false;
  if (key.includes(' ')) return false;
  return true;
}
```

### Sanitize Sensitive Data

```typescript
function sanitizeError(error: Error): string {
  // Remove API keys from error messages
  return error.message
    .replace(/sk_[a-zA-Z0-9]{20,}/g, 'sk_***')
    .replace(/Bearer .*/g, 'Bearer ***');
}
```

### Rate Limiting

```typescript
class RateLimitedWeave {
  private requestTimes: number[] = [];
  private maxRequests = 100;
  private windowMs = 60000; // 1 minute

  async generate(prompt: string) {
    this.checkRateLimit();
    return this.weave.generate(prompt);
  }

  private checkRateLimit() {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter((t) => now - t < this.windowMs);

    if (this.requestTimes.length >= this.maxRequests) {
      throw new RateLimitError(
        `Rate limit exceeded: ${this.maxRequests} requests per ${this.windowMs}ms`
      );
    }

    this.requestTimes.push(now);
  }
}
```

## 9. Cost Management

### Monitor Token Usage

```typescript
class CostTracker {
  private tokensUsed = 0;
  private costPerMillionTokens = 0.01;

  recordTokens(count: number) {
    this.tokensUsed += count;
    const cost = (this.tokensUsed / 1_000_000) * this.costPerMillionTokens;
    console.log(`Total tokens: ${this.tokensUsed}, Cost: $${cost.toFixed(4)}`);
  }

  async generateWithCostTracking(prompt: string) {
    const result = await weave.generate(prompt);
    if (result.tokens) {
      this.recordTokens(result.tokens.total);
    }
    return result;
  }
}
```

### Limit Tokens

```typescript
async function generateWithTokenLimit(prompt: string, maxTokens = 500) {
  return weave.generate(prompt, {
    maxTokens,
    temperature: 0.7,
  });
}
```

## 10. Production Checklist

- [ ] Environment variables configured
- [ ] Error handling implemented
- [ ] Logging in place
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] Tests passing (>90% coverage)
- [ ] Type checking passes
- [ ] Security audit completed
- [ ] Performance benchmarked
- [ ] Documentation updated
- [ ] Monitoring setup
- [ ] Cost tracking enabled

## Resources

- [API Reference](./API_REFERENCE.md)
- [Getting Started](./GETTING_STARTED.md)
- [Deployment Guide](./DEPLOYMENT.md)
