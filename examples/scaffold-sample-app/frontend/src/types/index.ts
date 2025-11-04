/**
 * Frontend Type Definitions
 * Shared types for React frontend
 */

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
 * Prompt Types
 */
export interface Prompt {
  id: string;
  name: string;
  template: string;
  version: number;
  status: 'draft' | 'published' | 'archived' | 'deprecated';
  created: Date;
  updated: Date;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
}

export interface PromptVariant {
  id: string;
  name: string;
  template: string;
  created: Date;
  updated: Date;
  metrics?: PromptMetrics;
}

export interface PromptMetrics {
  totalRuns: number;
  successRate?: number;
  averageQuality?: number;
  avgResponseTime?: number;
}

export interface PromptTestResult {
  success: boolean;
  renderedPrompt: string;
  variables: Record<string, unknown>;
  duration: number;
  error?: string;
}

/**
 * Provider Types
 */
export interface Provider {
  type: 'openai' | 'anthropic' | 'google';
  name: string;
  models: string[];
  icon?: string;
}

export interface Model {
  name: string;
  provider: string;
  costPerToken: number;
  maxTokens: number;
}

/**
 * UI Component Props
 */
export interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
}

export interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined';
}

/**
 * Cost Tracking
 */
export interface CostSummary {
  totalCost: number;
  lastGenerationCost: number;
  tokensUsed: number;
  generationsCount: number;
}

/**
 * Statistics
 */
export interface GenerationStats {
  totalGenerations: number;
  totalCost: number;
  averageTokensPerGeneration: number;
  successRate: number;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  data: T;
  timestamp: Date;
  meta?: {
    duration?: number;
    cached?: boolean;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: Date;
  };
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * History Entry
 */
export interface HistoryEntry {
  id: string;
  prompt: string;
  result: string;
  provider: string;
  model: string;
  cost: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
