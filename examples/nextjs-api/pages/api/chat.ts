/**
 * Next.js API Route for Chat
 * Handles chat requests with streaming support
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createWeave } from '@weave/core';
import { OpenAIProvider } from '@weave/core/providers';
import { Message } from '@weave/core';

interface ChatRequest {
  messages: Message[];
  temperature?: number;
}

interface ChatResponse {
  response: string;
}

interface ErrorResponse {
  error: string;
}

// Initialize Weave (cached for performance)
let weave: ReturnType<typeof createWeave> | null = null;

function getWeave() {
  if (!weave) {
    weave = createWeave({
      provider: new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY!,
        model: process.env.OPENAI_MODEL || 'gpt-4',
      }),
    });
  }
  return weave;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, temperature } = req.body as ChatRequest;

    // Validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    const weaveInstance = getWeave();

    // Get chat response
    const response = await weaveInstance.getModel().chat(messages, {
      temperature,
    });

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
