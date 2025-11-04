# Best Practices for Building with Weave

Learn proven patterns and practices from this sample app for building production-ready Weave applications.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Cost Management](#cost-management)
3. [Performance](#performance)
4. [Security](#security)
5. [Testing](#testing)
6. [Monitoring & Logging](#monitoring--logging)
7. [Code Organization](#code-organization)

## Error Handling

### Use WeaveError for Consistent Error Handling

```typescript
import { WeaveError } from '@weaveai/shared';

// ✅ Good - Using WeaveError
if (!prompt) {
  throw WeaveError.validationError('Prompt is required');
}

// ❌ Avoid - Using generic Error
if (!prompt) {
  throw new Error('Prompt is required');
}
```

### Handle Different Error Types

```typescript
try {
  const result = await generate(prompt);
} catch (error) {
  if (error instanceof WeaveError) {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Handle rate limit - maybe retry
        await new Promise(r => setTimeout(r, 2000));
        break;
      case 'AUTHENTICATION_FAILED':
        // Handle auth - refresh token
        break;
      case 'OPERATION_TIMEOUT':
        // Handle timeout - show user message
        break;
      default:
        // Handle other errors
    }
  }
}
```

### Use Retry Logic for Transient Errors

```typescript
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  backoffMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
```

## Cost Management

### Set Budget Limits

```typescript
// ✅ Always set budget limits
const controller = new AIExecutionController({
  trackCosts: true,
  budget: {
    perSession: 1.00,      // $1 per session
    perHour: 10.00,        // $10 per hour
    perDay: 50.00,         // $50 per day
    onBudgetExceeded: 'warn' // 'warn', 'error', 'ignore'
  }
});

// ❌ Avoid - No budget limits
const controller = new AIExecutionController({
  trackCosts: true
});
```

### Monitor Cost in Real-time

```typescript
// ✅ Track costs continuously
const costSummary = controller.getState().cost;
console.log(`Current cost: $${costSummary?.totalCost || 0}`);

// Alert on high costs
if (costSummary && costSummary.totalCost > 50) {
  logWarn('High cost alert: $' + costSummary.totalCost);
}
```

### Optimize Token Usage

```typescript
// ✅ Use caching to avoid redundant calls
const cached = await cache.queryCache(prompt);
if (cached) {
  return cached; // No tokens spent
}

// ✅ Use streaming to show progress
for await (const token of generateStream(prompt)) {
  // Process token-by-token
}

// ❌ Avoid - Generating multiple times
for (let i = 0; i < 5; i++) {
  await generate(samePrompt); // Wastes tokens
}
```

## Performance

### Implement Response Caching

```typescript
interface CacheConfig {
  enabled: boolean;
  ttl: number;        // Time to live in seconds
  maxSize: number;    // Max entries
}

// ✅ Cache similar prompts
const cacheKey = hashPrompt(prompt);
let result = cache.get(cacheKey);

if (!result) {
  result = await generate(prompt);
  cache.set(cacheKey, result, { ttl: 3600 });
}

return result;
```

### Use Streaming for Large Responses

```typescript
// ✅ Streaming for better UX
for await (const token of generateStream(prompt)) {
  display(token);
}

// ❌ Avoid - Waiting for complete response
const result = await generate(prompt);
display(result.text);
```

### Implement Request Batching

```typescript
// ✅ Batch multiple requests
const results = await batchGenerate([
  { prompt: 'Generate article about AI' },
  { prompt: 'Generate SEO title' },
  { prompt: 'Generate meta description' }
]);

// ❌ Avoid - Sequential requests
const r1 = await generate('Generate article about AI');
const r2 = await generate('Generate SEO title');
const r3 = await generate('Generate meta description');
```

## Security

### Validate All Inputs

```typescript
// ✅ Validate before processing
function validatePrompt(prompt: unknown): string {
  if (typeof prompt !== 'string') {
    throw WeaveError.validationError('Prompt must be a string');
  }

  if (prompt.length < 1) {
    throw WeaveError.validationError('Prompt cannot be empty');
  }

  if (prompt.length > 2000) {
    throw WeaveError.validationError('Prompt too long (max 2000 chars)');
  }

  return prompt.trim();
}

// Use it
const cleanPrompt = validatePrompt(req.body.prompt);
```

### Protect API Keys

```typescript
// ✅ Store in environment variables
const apiKey = process.env.WEAVE_API_KEY;

// ✅ Never log API keys
logInfo('Generation started'); // Good

// ❌ Avoid - Logging sensitive data
logInfo('Using API key: ' + apiKey); // BAD!

// ✅ Use masked values in logs
const maskedKey = apiKey.slice(0, 4) + '***';
logInfo('Using API key: ' + maskedKey); // Good
```

### Implement Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
});

app.post('/api/generate', limiter, async (req, res) => {
  // Handle request
});
```

### Sanitize User Input

```typescript
// ✅ Sanitize HTML/SQL injection attempts
import xss from 'xss';
import sql from 'sqlstring';

const cleanPrompt = xss(prompt);
const safeQuery = sql.escape(searchTerm);

// ✅ Use parameterized queries
const result = await db.query(
  'SELECT * FROM prompts WHERE user_id = ?',
  [userId]
);
```

## Testing

### Unit Test Error Cases

```typescript
describe('GenerationService', () => {
  it('should throw validation error for empty prompt', async () => {
    const service = new GenerationService();

    expect(() => {
      service.validatePrompt('');
    }).toThrow(WeaveError);
  });

  it('should handle rate limit errors with retry', async () => {
    const service = new GenerationService();

    // Mock API to fail first, then succeed
    const spy = jest.spyOn(service, 'callProvider')
      .mockRejectedValueOnce(new Error('Rate limited'))
      .mockResolvedValueOnce('Success');

    const result = await service.generateWithRetry('prompt');

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toBe('Success');
  });
});
```

### Test Cost Tracking

```typescript
it('should track costs correctly', async () => {
  const controller = new AIExecutionController({
    trackCosts: true,
    budget: { perSession: 10 }
  });

  await controller.execute(() => generateContent());

  const state = controller.getState();
  expect(state.cost).toBeDefined();
  expect(state.cost?.totalCost).toBeLessThan(10);
});
```

### Test Streaming

```typescript
it('should stream tokens correctly', async () => {
  const service = new GenerationService();
  const tokens: string[] = [];

  for await (const token of service.generateStream('prompt')) {
    tokens.push(token);
  }

  expect(tokens.length).toBeGreaterThan(0);
  expect(tokens.join('').length).toBeGreaterThan(0);
});
```

## Monitoring & Logging

### Use Structured Logging

```typescript
// ✅ Use structured logs with context
logInfo('generation.complete', {
  duration: 1234,
  tokensUsed: 150,
  cost: 0.0045,
  provider: 'openai',
  status: 'success'
});

// ❌ Avoid - Unstructured logs
console.log('Generation completed');
```

### Track Key Metrics

```typescript
// ✅ Monitor important metrics
interface GenerationMetrics {
  totalGenerations: number;
  totalCost: number;
  averageLatency: number;
  errorRate: number;
  cacheHitRate: number;
}

function recordMetric(metric: string, value: number) {
  logInfo('metric.recorded', {
    metric,
    value,
    timestamp: new Date()
  });
}

// Use it
recordMetric('generation.latency', duration);
recordMetric('generation.cost', cost);
```

### Set Up Health Checks

```typescript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      openai: { status: 'up', latency: 145 },
      anthropic: { status: 'up', latency: 189 },
      cache: { status: 'up', latency: 5 }
    }
  };

  res.json(health);
});
```

## Code Organization

### Separation of Concerns

```typescript
// ✅ Good structure
backend/
├── services/          # Business logic
│   ├── generationService.ts
│   ├── promptService.ts
│   └── cacheService.ts
├── controllers/       # Request handlers
│   ├── generationController.ts
│   └── promptController.ts
├── middleware/        # Express middleware
│   ├── errorHandler.ts
│   ├── auth.ts
│   └── logging.ts
├── types/             # TypeScript types
│   └── index.ts
└── utils/             # Utilities
    ├── validation.ts
    └── cache.ts

// ❌ Avoid - Mixed concerns
backend/
├── index.ts           # Everything here
└── utils.ts
```

### Use Dependency Injection

```typescript
// ✅ Good - Testable
export class GenerationController {
  constructor(
    private generationService: GenerationService,
    private promptService: PromptService,
    private cacheService: CacheService
  ) {}

  async generate(req: Request, res: Response) {
    const result = await this.generationService.generate(req.body.prompt);
    res.json(result);
  }
}

// ❌ Avoid - Hard to test
export class GenerationController {
  async generate(req: Request, res: Response) {
    const service = new GenerationService(); // Tightly coupled
    const result = await service.generate(req.body.prompt);
    res.json(result);
  }
}
```

### Use Type Safety

```typescript
// ✅ Use proper types
interface GenerateRequest {
  prompt: string;
  provider: 'openai' | 'anthropic' | 'google';
  metadata?: Record<string, unknown>;
}

async function generate(request: GenerateRequest): Promise<GenerateResponse> {
  // Type-safe implementation
}

// ❌ Avoid - Using any
async function generate(request: any): Promise<any> {
  // Loss of type safety
}
```

## Deployment Checklist

- [ ] Remove debug logging
- [ ] Set appropriate cache TTLs
- [ ] Configure budget limits
- [ ] Enable cost tracking
- [ ] Set up monitoring/alerting
- [ ] Add rate limiting
- [ ] Sanitize all inputs
- [ ] Use environment variables for secrets
- [ ] Test error scenarios
- [ ] Test scaling/load
- [ ] Document API endpoints
- [ ] Set up automated backups

## Summary

Follow these practices to build reliable, secure, and cost-effective applications with Weave:

1. **Always handle errors** with appropriate types
2. **Always set budget limits** to avoid surprises
3. **Use caching** to optimize costs
4. **Stream responses** for better UX
5. **Validate inputs** thoroughly
6. **Log structured data** for monitoring
7. **Organize code** with clear separation of concerns
8. **Write tests** for critical paths
9. **Monitor costs** continuously
10. **Keep secrets** secure with environment variables

---

For more information, see the [README.md](../README.md) and other documentation.
