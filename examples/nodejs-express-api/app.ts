/**
 * Node.js/Express API Example
 * Demonstrates Weave middleware integration with Express
 */

import express, { Express, Request, Response } from 'express';
import { createWeave } from '@weave/core';
import { OpenAIProvider } from '@weave/core/providers';
import { createWeaveMiddleware } from '@weave/nodejs';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize Weave
const weave = createWeave({
  provider: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
  }),
});

// Create and use Weave middleware
const weaveMiddleware = createWeaveMiddleware(weave);
app.use((req, res, next) => {
  weaveMiddleware.middleware(req, res, next);
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Generate text endpoint
app.post('/api/generate', weaveMiddleware.generateHandler);

// Classify text endpoint
app.post('/api/classify', weaveMiddleware.classifyHandler);

// Extract data endpoint
app.post('/api/extract', weaveMiddleware.extractHandler);

// Chat endpoint with messages
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, temperature } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const model = weave.getModel();
    const response = await model.chat(messages, { temperature });

    return res.status(200).json({
      response,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Chat API error:', error);

    if (error.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Chat endpoint: POST http://localhost:${port}/api/chat`);
});

export default app;
