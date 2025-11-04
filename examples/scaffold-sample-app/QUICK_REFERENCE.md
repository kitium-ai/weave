# Quick Reference Guide

Quick lookup for common tasks and patterns in the Weave Sample App.

## Quick Start (5 minutes)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local and add your API key

# 3. Run
npm run dev

# 4. Open browser
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

## Common Tasks

### Generate Content

**Frontend (React Hook)**
```typescript
import { useGeneration } from './hooks/useGeneration';

const { generate, loading, error, data } = useGeneration();

await generate('Write a poem about AI', 'openai');
```

**Backend (Service)**
```typescript
import { generationService } from './services/generationService';

const result = await generationService.generate(
  { prompt: 'Write a poem about AI' },
  { provider: generationService.getProvider('openai') }
);
```

### Manage Prompts

**Create**
```typescript
const prompt = promptService.createPrompt(
  'Article Writer',
  'Write an article about {{topic}} in {{style}} style',
  { tags: ['content', 'articles'] }
);
```

**Get All**
```typescript
const prompts = promptService.getAllPrompts();
```

**Update**
```typescript
promptService.updatePrompt(promptId, { template: 'New template' });
```

**Create Variant**
```typescript
const variant = promptService.createVariant(
  promptId,
  'Alternative template',
  'Variant B'
);
```

### Handle Errors

**Catch Weave Errors**
```typescript
try {
  const result = await generate(prompt);
} catch (error) {
  if (error instanceof WeaveError) {
    console.log(error.code);      // RATE_LIMIT_EXCEEDED
    console.log(error.message);   // Error message
    console.log(error.context);   // Additional context
  }
}
```

**Validate Input**
```typescript
if (!prompt || prompt.trim().length === 0) {
  throw WeaveError.validationError('Prompt cannot be empty');
}
```

### Cost Tracking

**Track Costs**
```typescript
const controller = new AIExecutionController({
  trackCosts: true,
  budget: {
    perSession: 1.00,
    perHour: 10.00,
    onBudgetExceeded: 'warn'
  }
});

const costSummary = controller.getState().cost;
console.log(`Used: $${costSummary?.totalCost}`);
```

**Get Stats**
```typescript
const stats = generationService.getStats();
// { totalGenerations, totalCost, averageTokensPerGeneration }
```

### Streaming Responses

**Frontend**
```typescript
const { generateStream, streamingText, progress } = useGeneration();

await generateStream(prompt, provider);
// Watch streamingText update as tokens arrive
```

**Backend**
```typescript
for await (const token of service.generateStream(prompt, provider)) {
  res.write(`data: ${JSON.stringify({ token })}\n\n`);
}
```

### Test Prompts

**Test Rendering**
```typescript
const result = await promptService.testPrompt(
  promptId,
  template,
  { topic: 'AI', style: 'professional' }
);
// { success, renderedPrompt, duration }
```

### Caching

**Query Cache**
```typescript
const cached = await cache.queryCache(prompt);
if (cached) {
  return cached;  // Cache hit!
}

// Generate if not cached
const result = await generate(prompt);
await cache.storeInCache(prompt, result, metadata);
```

## API Endpoints

### Generation
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/generate` | Generate content |
| POST | `/api/generate/stream` | Stream generation |
| POST | `/api/generate/test` | Test prompt |
| POST | `/api/generate/batch` | Batch generation |
| GET | `/api/generate/stats` | Get statistics |

### Prompts
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/prompts` | List all |
| POST | `/api/prompts` | Create |
| GET | `/api/prompts/:id` | Get one |
| PUT | `/api/prompts/:id` | Update |
| DELETE | `/api/prompts/:id` | Delete |
| GET | `/api/prompts/:id/variants` | List variants |
| POST | `/api/prompts/:id/variants` | Create variant |

## Environment Variables

**Required**
```env
VITE_WEAVE_API_KEY=sk-...
VITE_WEAVE_PROVIDER=openai
VITE_WEAVE_MODEL=gpt-4
```

**Optional but Recommended**
```env
ENABLE_CACHING=true
ENABLE_COST_TRACKING=true
BUDGET_PER_SESSION=1.00
LOG_LEVEL=info
```

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── generationService.ts      ← Content generation
│   │   ├── promptManagementService.ts ← Prompt management
│   │   └── cacheService.ts            ← Response caching
│   ├── controllers/
│   │   ├── generationController.ts   ← HTTP handlers
│   │   └── promptController.ts
│   ├── middleware/
│   │   ├── errorHandler.ts           ← Error handling
│   │   └── auth.ts
│   └── types/
│       └── index.ts                   ← TypeScript types

frontend/
├── src/
│   ├── hooks/
│   │   ├── useGeneration.ts          ← Generation hook
│   │   └── usePromptTemplate.ts      ← Prompt management
│   ├── components/
│   │   ├── GenerationPanel.tsx       ← Main UI
│   │   └── ...
│   └── types/
│       └── index.ts                   ← Types
```

## Debugging

**Enable Debug Mode**
```env
DEBUG=true
LOG_LEVEL=debug
```

**Check Network Requests**
1. Open DevTools (F12)
2. Go to Network tab
3. Check request/response bodies

**Check Logs**
```bash
# Frontend logs (console)
console.log()

# Backend logs (terminal)
LOG_LEVEL=debug npm run dev:backend
```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot find module" | Missing dependency | `npm install` |
| API Key Rejected | Wrong/invalid key | Check in provider dashboard |
| CORS Error | Backend not running | `npm run dev:backend` |
| 500 Error | Server error | Check backend logs |
| No streaming | Feature disabled | `ENABLE_STREAMING=true` |
| Budget exceeded | Over limit | Increase `BUDGET_PER_SESSION` |

## Performance Tips

1. **Enable Caching** - Avoid regenerating same prompts
2. **Use Streaming** - Better UX for long responses
3. **Set Budgets** - Prevent runaway costs
4. **Batch Requests** - Reduce API calls
5. **Optimize Prompts** - Less tokens = lower cost

## Security Tips

1. **Never commit .env.local** - Add to .gitignore
2. **Rotate API keys** - Monthly or after changes
3. **Validate inputs** - Always check user input
4. **Mask secrets in logs** - Never log full API keys
5. **Use HTTPS** - Always in production

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- generationService

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

## Deployment

### Vercel (Frontend)
```bash
vercel deploy
```

### Railway (Backend)
```bash
railway link
railway up
```

### Docker
```bash
docker-compose up -d
```

## Useful Links

- **Docs**: [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)
- **Best Practices**: [docs/BEST_PRACTICES.md](./docs/BEST_PRACTICES.md)
- **API Reference**: [docs/API.md](./docs/API.md)
- **Weave Docs**: https://docs.weave.ai
- **OpenAI API**: https://platform.openai.com/docs

## Need Help?

1. Check the documentation
2. Search existing issues
3. Open a new GitHub issue
4. Ask on community Discord

---

**Last Updated**: 2024
**Version**: 1.0.0
