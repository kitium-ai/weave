/**
 * Core type definitions for Weave framework
 */

import type { StreamResult, StreamingConfig } from '../streaming/stream-handler.js';

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
  streaming?: boolean | StreamingConfig<string>;
  onChunk?: (chunk: string) => void | Promise<void>;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

/**
 * Generate result
 */
export interface GenerateData {
  text: string;
  tokenCount: {
    input: number;
    output: number;
  };
  finishReason: 'stop' | 'length' | 'error';
  stream?: StreamResult<string>;
}

export type GenerateResult = WeaveOperationResult<GenerateData>;

/**
 * Classification options
 */
export interface ClassifyOptions extends BaseOperationOptions {
  multiLabel?: boolean;
}

/**
 * Classification result
 */
export interface ClassificationData {
  label: string;
  confidence: number;
  scores?: Record<string, number>;
}

export type ClassificationResult = WeaveOperationResult<ClassificationData>;

/**
 * Extraction options
 */
export interface ExtractOptions extends BaseOperationOptions {
  schema: Record<string, string> | { type: string; properties: Record<string, unknown> };
  strict?: boolean;
}

export type ExtractResult<T = unknown> = WeaveOperationResult<T>;

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
  streaming?: boolean | StreamingConfig<string>;
  onChunk?: (chunk: string) => void | Promise<void>;
  systemPrompt?: string;
}

// Import and export provider config types early (use discriminated union)
export type {
  OpenAIProviderConfig,
  AnthropicProviderConfig,
  GoogleProviderConfig,
  LocalProviderConfig,
  MockProviderConfig,
  BaseProviderConfig,
  ProviderFallback,
  ProviderConfig,
  ProviderType,
} from './provider-config.js';

export {
  isProviderConfig,
  isProviderType,
  validateProviderConfig,
  getProviderConfigFromEnv,
} from './provider-config.js';

// Import for use in type definitions
import type { ProviderConfig } from './provider-config.js';

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
  provider?: string;
  model?: string;
  cached?: boolean;
  cacheKey?: string;
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

export type WeaveDisplayType = 'text' | 'markdown' | 'json' | 'html' | 'component';
export type WeaveEstimatedSize = 'small' | 'medium' | 'large';

export interface WeaveOperationUiMetadata {
  displayAs: WeaveDisplayType;
  canStream: boolean;
  estimatedSize: WeaveEstimatedSize;
}

export interface WeaveOperationCostMetadata {
  input: number;
  output: number;
  total: number;
  currency: string;
}

export interface WeaveOperationTokenMetadata {
  input: number;
  output: number;
}

export interface WeaveOperationMetadata {
  operationId: string;
  duration: number;
  timestamp: Date;
  provider: string;
  model: string;
  ui: WeaveOperationUiMetadata;
  cost?: WeaveOperationCostMetadata;
  tokens?: WeaveOperationTokenMetadata;
  cached: boolean;
  cacheKey?: string;
}

export interface WeaveOperationError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestion?: string;
}

export interface WeaveOperationResult<T = unknown> {
  status: 'success' | 'error' | 'pending';
  data: T;
  metadata: WeaveOperationMetadata;
  error?: WeaveOperationError;
}
