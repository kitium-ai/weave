/**
 * Core type definitions for Weave framework
 */

/**
 * Log level for operations
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Base operation options
 */
export interface BaseOperationOptions {
  model?: string;
  timeout?: number;
  cache?: boolean;
  logging?: LogLevel;
}

/**
 * Generate operation options
 */
export interface GenerateOptions extends BaseOperationOptions {
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  onChunk?: (chunk: string) => void;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

/**
 * Generate result
 */
export interface GenerateResult {
  text: string;
  tokenCount: {
    input: number;
    output: number;
  };
  finishReason: 'stop' | 'length' | 'error';
}

/**
 * Classification options
 */
export interface ClassifyOptions extends BaseOperationOptions {
  multiLabel?: boolean;
}

/**
 * Classification result
 */
export interface ClassificationResult {
  label: string;
  confidence: number;
  scores?: Record<string, number>;
}

/**
 * Extraction options
 */
export interface ExtractOptions extends BaseOperationOptions {
  schema: Record<string, string> | { type: string; properties: Record<string, unknown> };
  strict?: boolean;
}

/**
 * Summary options
 */
export interface SummaryOptions extends BaseOperationOptions {
  style?: 'bullet-points' | 'paragraph';
  sentences?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  document: string;
  similarity: number;
  index: number;
}

/**
 * Sentiment result
 */
export interface SentimentResult {
  compound: number;
  positive: number;
  negative: number;
  neutral: number;
}

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat options
 */
export interface ChatOptions extends BaseOperationOptions {
  streaming?: boolean;
  onChunk?: (chunk: string) => void;
  systemPrompt?: string;
}

/**
 * Provider type
 */
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'local' | 'mock' | string;

/**
 * Provider configuration
 */
export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  [key: string]: unknown;
}

/**
 * Weave configuration
 */
export interface WeaveConfig {
  provider: ProviderConfig;
  logging?: LogLevel;
  cache?: boolean;
  timeout?: number;
}

/**
 * Token count result
 */
export interface TokenCountResult {
  input: number;
  output: number;
  total: number;
}

/**
 * Cost estimation
 */
export interface CostEstimate {
  tokenCount: TokenCountResult;
  estimatedCost: number;
  currency: string;
}

/**
 * Operation metadata
 */
export interface OperationMetadata {
  id: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  error?: Error;
  tokenCount?: TokenCountResult;
  cost?: CostEstimate;
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool result
 */
export interface ToolResult {
  toolName: string;
  success: boolean;
  result?: unknown;
  error?: string;
}
