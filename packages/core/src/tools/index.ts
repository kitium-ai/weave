/**
 * Tools module - placeholder for future implementation
 * Tools will allow AI models to perform actions
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  toolName: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

export class Tool {
  public constructor(
    public readonly definition: ToolDefinition,
    public readonly execute: (input: unknown) => Promise<unknown>
  ) {}
}
