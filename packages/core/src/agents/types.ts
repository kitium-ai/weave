/**
 * Agent framework types
 */

// import type { GenerateOptions } from '../types/index.js';

/**
 * Agent tool definition
 */
export type AgentUiDisplayType = 'text' | 'markdown' | 'json' | 'html' | 'component';

export interface AgentToolUiContext {
  displayElement?: string;
  displayAs?: AgentUiDisplayType;
  additionalProps?: Record<string, unknown>;
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (input: unknown) => Promise<unknown>;
  schema?: Record<string, unknown>;
  uiContext?: AgentToolUiContext;
}

/**
 * Agent action to execute
 */
export interface AgentAction {
  tool: string;
  input: unknown;
  reasoning: string;
}

/**
 * Agent step result
 */
export interface AgentStepResult {
  action: AgentAction;
  observation: unknown;
  timestamp: number;
  ui?: AgentToolUiContext;
}

/**
 * Agent execution plan
 */
export interface AgentExecutionPlan {
  goal: string;
  steps: AgentAction[];
  reasoning: string;
}

/**
 * Agent response
 */
export interface AgentResponse {
  result: unknown;
  steps: AgentStepResult[];
  reasoning: string;
  tokenCount: {
    input: number;
    output: number;
  };
}

export interface AgentThinkingConfig {
  displaySteps?: boolean;
  updateUI?: boolean;
  onStep?: (step: AgentStepResult) => void;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  description: string;
  tools: AgentTool[];
  maxSteps?: number;
  temperature?: number;
  systemPrompt?: string;
  goal?: string;
  thinking?: AgentThinkingConfig;
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  goal: string;
  steps: AgentStepResult[];
  availableTools: AgentTool[];
  maxSteps: number;
  currentStep: number;
  memory: Map<string, unknown>;
  thinking?: AgentThinkingConfig;
}
