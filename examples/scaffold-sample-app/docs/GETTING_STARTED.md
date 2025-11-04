# Getting Started with Weave Sample App

This guide will help you set up and run the Weave Sample App locally.

## Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** or **yarn** package manager
- **Git** for cloning the repository
- API keys from at least one AI provider:
  - OpenAI: https://platform.openai.com/api-keys
  - Anthropic: https://console.anthropic.com/
  - Google: https://ai.google.dev/

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/kitium-ai/weave.git
cd weave/examples/scaffold-sample-app

# Install dependencies
npm install
```

## Step 2: Configure Environment

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Provider Configuration
VITE_WEAVE_PROVIDER=openai
VITE_WEAVE_API_KEY=sk-your-api-key-here
VITE_WEAVE_MODEL=gpt-4

# Backend Configuration
BACKEND_PORT=3000
VITE_API_BASE_URL=http://localhost:3000

# Feature Flags
ENABLE_STREAMING=true
ENABLE_COST_TRACKING=true
ENABLE_CACHING=true
```

## Step 3: Start Development Servers

Open two terminal windows and run:

```bash
# Terminal 1: Start Backend
npm run dev:backend

# Terminal 2: Start Frontend
npm run dev:frontend
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## Step 4: Verify Installation

1. Open http://localhost:5173 in your browser
2. You should see the Generation Panel
3. Enter a prompt and click "Generate"
4. You should see a generated response

## Troubleshooting

### Issue: "Cannot find module '@weaveai/shared'"
**Solution**: Make sure you ran `npm install` in the root directory and `weave` packages are built.

```bash
npm run build
npm install
```

### Issue: API Key Rejected
**Solution**: Verify your API key is correct and has the right permissions:
- OpenAI: Check at https://platform.openai.com/account/api-keys
- Anthropic: Check at https://console.anthropic.com/account/keys
- Google: Check at https://aistudio.google.com/app/apikey

### Issue: CORS Errors
**Solution**: Make sure backend is running on port 3000 and frontend is set to `VITE_API_BASE_URL=http://localhost:3000`

### Issue: Streaming Not Working
**Solution**:
1. Check `ENABLE_STREAMING=true` in `.env.local`
2. Verify browser supports Fetch API
3. Check browser DevTools Network tab for SSE (Server-Sent Events)

## Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend    # Start frontend only
npm run dev:backend     # Start backend only

# Building
npm run build           # Build frontend
npm run build:backend   # Build backend

# Testing
npm run test            # Run tests
npm test:coverage       # Run tests with coverage
npm test:watch          # Watch mode

# Linting
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run type-check      # Run TypeScript type checking

# Production
npm run start           # Start production server
npm run preview         # Preview production build
```

## Project Structure

```
scaffold-sample-app/
├── backend/               # Express backend
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── services/     # Business logic
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Root component
│   └── package.json
│
└── shared/                # Shared types
    └── package.json
```

## Key Features to Explore

### 1. Content Generation
The main feature - generate content using different AI providers with real-time streaming.

**File**: `frontend/src/components/GenerationPanel.tsx`

### 2. Prompt Management
Create, version, and A/B test prompts.

**Files**:
- `backend/src/services/promptManagementService.ts`
- `frontend/src/hooks/usePromptTemplate.ts`

### 3. Cost Tracking
Track costs per generation, per session, per hour, and set budgets.

**File**: `backend/src/services/generationService.ts`

### 4. Streaming Responses
Get real-time token-by-token responses from the AI.

**Files**:
- Backend: `backend/src/api/routes/stream.ts`
- Frontend: `frontend/src/hooks/useGeneration.ts`

### 5. Error Handling
Comprehensive error handling with retry logic.

**File**: `backend/src/middleware/errorHandler.ts`

## API Endpoints

### Generation
- `POST /api/generate` - Generate content
- `POST /api/generate/stream` - Stream generation
- `POST /api/generate/test` - Test prompt
- `POST /api/generate/batch` - Batch generation
- `GET /api/generate/stats` - Get statistics

### Prompt Management
- `GET /api/prompts` - List prompts
- `POST /api/prompts` - Create prompt
- `GET /api/prompts/:id` - Get prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt
- `GET /api/prompts/:id/variants` - List variants
- `POST /api/prompts/:id/variants` - Create variant

## Best Practices

### 1. API Key Management
- Never commit `.env.local` to git
- Use environment variables for sensitive data
- Rotate keys regularly

### 2. Error Handling
Always handle errors gracefully:

```typescript
try {
  const result = await generate(prompt);
} catch (error) {
  if (error instanceof WeaveError) {
    console.log(`${error.code}: ${error.message}`);
  }
}
```

### 3. Cost Tracking
Monitor costs to avoid surprises:

```typescript
const { trackCosts, budget } = useGeneration({
  trackCosts: true,
  budget: { perSession: 1.00 }
});
```

### 4. Streaming for Large Responses
Use streaming for better UX with large responses:

```typescript
const { generateStream } = useGeneration();
await generateStream(prompt);
```

## Next Steps

1. **Customize Components** - Modify UI components to match your brand
2. **Add Database** - Persist prompts and results to a database
3. **Implement Authentication** - Add user authentication
4. **Deploy to Production** - Use Vercel, Railway, or your preferred hosting
5. **Add More Features** - Implement export, sharing, analytics, etc.

## Resources

- **Weave Docs**: https://docs.weave.ai
- **OpenAI API**: https://platform.openai.com/docs/api-reference
- **Anthropic API**: https://docs.anthropic.com/
- **Google Gemini**: https://ai.google.dev/docs
- **React Documentation**: https://react.dev
- **Express.js Documentation**: https://expressjs.com

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Read relevant documentation
3. Open an issue on GitHub
4. Ask on community Discord

## FAQ

**Q: Can I use this in production?**
A: Yes! The sample is designed with production patterns. Add database, auth, and deploy.

**Q: How do I add a new provider?**
A: Add provider config in `backend/src/services/generationService.ts`

**Q: Can I use this with different frameworks?**
A: Yes! The patterns work with Vue, Svelte, Angular, Next.js, etc.

**Q: How do I handle large responses?**
A: Use streaming mode with `generateStream()` for better UX.

---

Happy building! If you have questions, feel free to ask on our community Discord or open an issue on GitHub.
