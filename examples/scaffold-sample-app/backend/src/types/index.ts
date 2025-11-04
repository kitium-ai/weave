/**
 * Type Definitions for Sample App
 * Shared types used across backend services
 */

/**
 * Generation Request
 */
export interface GenerateRequest {
  prompt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generation Response
 */
export interface GenerateResponse {
  text: string;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Prompt Status
 */
export type PromptStatus = 'draft' | 'published' | 'archived' | 'deprecated';

/**
 * Prompt Template
 */
export interface Prompt {
  id: string;
  name: string;
  template: string;
  version: number;
  status: PromptStatus;
  created: Date;
  updated: Date;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
  averageQuality?: number;
  successRate?: number;
}

/**
 * Prompt Variant for A/B Testing
 */
export interface PromptVariant {
  id: string;
  name: string;
  template: string;
  created: Date;
  updated: Date;
  metrics?: PromptMetrics;
}

/**
 * Prompt Metrics
 */
export interface PromptMetrics {
  totalRuns: number;
  successRate?: number;
  averageQuality?: number;
  avgResponseTime?: number;
  errors?: number;
  lastUsed?: Date;
  customMetrics?: Record<string, number | string>;
}

/**
 * Prompt Test Result
 */
export interface PromptTestResult {
  success: boolean;
  renderedPrompt: string;
  variables: Record<string, unknown>;
  duration: number;
  error?: string;
}

/**
 * Cost Tracking Record
 */
export interface CostRecord {
  timestamp: Date;
  operation: string;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  metadata?: Record<string, unknown>;
}

/**
 * Cost Summary
 */
export interface CostSummaryRecord {
  totalCost: number;
  sessionCost: number;
  hourlyCost: number;
  dayCost: number;
  records: CostRecord[];
  budgetLimit?: number;
  budgetExceeded: boolean;
}

/**
 * API Error Response
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: Date;
  };
}

/**
 * API Success Response
 */
export interface ApiSuccess<T> {
  data: T;
  timestamp: Date;
  meta?: {
    duration?: number;
    cached?: boolean;
  };
}

/**
 * Pagination Query
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Request Context
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

/**
 * Cache Entry
 */
export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  ttl: number;
  hits: number;
}

/**
 * Cache Statistics
 */
export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageTTL: number;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: Record<string, {
    status: 'up' | 'down';
    latency?: number;
    error?: string;
  }>;
}

/**
 * Stream Event
 */
export interface StreamEvent {
  type: 'start' | 'token' | 'complete' | 'error';
  timestamp: Date;
  data?: string | Record<string, unknown>;
  error?: string;
}

/**
 * Provider Info
 */
export interface ProviderInfo {
  type: 'openai' | 'anthropic' | 'google';
  name: string;
  models: string[];
  maxTokens: number;
  costPerToken: number;
}

/**
 * Model Info
 */
export interface ModelInfo {
  name: string;
  provider: string;
  maxTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  description?: string;
}

/**
 * Configuration
 */
export interface AppConfig {
  providers: Record<string, ProviderInfo>;
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  budget: {
    enabled: boolean;
    perSession: number;
    perHour: number;
    perDay: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destination: 'console' | 'file';
  };
}
