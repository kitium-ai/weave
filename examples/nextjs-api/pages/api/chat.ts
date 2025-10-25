/**
 * Next.js API Route for Chat
 * Handles chat requests with streaming support
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Weave } from '@weaveai/core';
import type { ChatMessage } from '@weaveai/core';

interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
}

interface ChatResponse {
  response: string;
}

interface ErrorResponse {
  error: string;
}

// Initialize Weave (cached for performance)
let weavePromise: Promise<Weave> | null = null;

function getWeave(): Promise<Weave> {
  if (!weavePromise) {
    weavePromise = Weave.createAsync({
      provider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      },
    });
  }
  return weavePromise;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, temperature, stream } = req.body as ChatRequest;

    // Validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    const weaveInstance = await getWeave();

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let accumulated = '';
      await weaveInstance.getModel().chat(messages, {
        temperature,
        streaming: true,
        onChunk: (chunk) => {
          accumulated += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        },
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    const response = await weaveInstance.getModel().chat(messages, { temperature });
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
