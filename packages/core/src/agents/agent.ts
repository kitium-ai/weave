/**
 * Base Agent class for multi-step reasoning
 */

import { getLogger } from '@weave/shared';
import type { ILanguageModel } from '../providers/interfaces.js';
import type {
  AgentConfig,
  AgentResponse,
  AgentStepResult,
  AgentAction,
  AgentExecutionContext,
  AgentTool,
} from './types.js';

/**
 * Base Agent class
 */
export class Agent {
  protected readonly logger = getLogger();
  private readonly name: string;
  private readonly description: string;
  private readonly tools: Map<string, AgentTool>;
  private readonly maxSteps: number;
  private readonly temperature: number;
  private readonly systemPrompt: string;
  private readonly model: ILanguageModel;

  public constructor(model: ILanguageModel, config: AgentConfig) {
    this.name = config.name;
    this.description = config.description;
    this.tools = new Map(config.tools.map(tool => [tool.name, tool]));
    this.maxSteps = config.maxSteps ?? 10;
    this.temperature = config.temperature ?? 0.7;
    this.systemPrompt = config.systemPrompt ?? this.getDefaultSystemPrompt();
    this.model = model;

    this.logger.debug('Agent initialized', {
      name: this.name,
      tools: Array.from(this.tools.keys()),
      maxSteps: this.maxSteps,
    });
  }

  /**
   * Execute the agent with a goal
   */
  public async execute(goal: string): Promise<AgentResponse> {
    this.logger.debug('Agent executing', { goal });

    const context: AgentExecutionContext = {
      goal,
      steps: [],
      availableTools: Array.from(this.tools.values()),
      maxSteps: this.maxSteps,
      currentStep: 0,
      memory: new Map(),
    };

    let result: unknown = null;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      while (context.currentStep < context.maxSteps) {
        context.currentStep++;

        // Get next action from model
        const action = await this.getNextAction(context);

        if (!action) {
          break;
        }

        // Execute the action
        const tool = this.tools.get(action.tool);
        if (!tool) {
          this.logger.warn('Tool not found', { tool: action.tool });
          continue;
        }

        try {
          const observation = await tool.execute(action.input);

          const step: AgentStepResult = {
            action,
            observation,
            timestamp: Date.now(),
          };

          context.steps.push(step);
          context.memory.set(`step_${context.currentStep}`, observation);

          this.logger.debug('Agent step completed', {
            step: context.currentStep,
            tool: action.tool,
            observation,
          });

          // Check if we have a final answer
          if (this.isFinalAnswer(observation)) {
            result = observation;
            break;
          }
        } catch (err) {
          this.logger.error('Tool execution failed', {
            tool: action.tool,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return {
        result: result ?? this.buildFinalResponse(context),
        steps: context.steps,
        reasoning: this.buildReasoning(context),
        tokenCount: {
          input: totalInputTokens,
          output: totalOutputTokens,
        },
      };
    } catch (err) {
      this.logger.error('Agent execution failed', {
        error: err instanceof Error ? err.message : String(err),
      });

      throw err;
    }
  }

  /**
   * Get the next action from the model
   */
  private async getNextAction(context: AgentExecutionContext): Promise<AgentAction | null> {
    const prompt = this.buildPrompt(context);

    try {
      const response = await this.model.generate(prompt, {
        temperature: this.temperature,
      });

      const action = this.parseAction(response.text);
      return action;
    } catch (err) {
      this.logger.error('Failed to get next action', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  /**
   * Build the prompt for the model
   */
  private buildPrompt(context: AgentExecutionContext): string {
    const toolDescriptions = Array.from(this.tools.values())
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    const stepsHistory = context.steps
      .map((step, i) => `Step ${i + 1}: Executed ${step.action.tool} with reasoning "${step.action.reasoning}"\nObservation: ${JSON.stringify(step.observation)}`)
      .join('\n\n');

    return `${this.systemPrompt}

Goal: ${context.goal}

Available tools:
${toolDescriptions}

${stepsHistory ? `Previous steps:\n${stepsHistory}\n` : ''}

Next action (respond in format: TOOL: <tool_name>, INPUT: <json>, REASONING: <reasoning>):`;
  }

  /**
   * Parse the action from model response
   */
  private parseAction(response: string): AgentAction | null {
    try {
      const toolMatch = response.match(/TOOL:\s*([^\n,]+)/);
      const inputMatch = response.match(/INPUT:\s*({[^}]*}|[^\n]*)/);
      const reasoningMatch = response.match(/REASONING:\s*(.+?)(?=\n|$)/);

      if (!toolMatch || !inputMatch) {
        return null;
      }

      const tool = toolMatch[1].trim();
      const inputStr = inputMatch[1].trim();
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';

      let input: unknown;
      try {
        input = JSON.parse(inputStr);
      } catch {
        input = inputStr;
      }

      return {
        tool,
        input,
        reasoning,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if the observation is a final answer
   */
  private isFinalAnswer(observation: unknown): boolean {
    if (typeof observation === 'string') {
      return observation.toLowerCase().includes('final answer') || observation.toLowerCase().includes('done');
    }

    if (typeof observation === 'object' && observation !== null) {
      const obj = observation as Record<string, unknown>;
      return obj.final === true || obj.done === true;
    }

    return false;
  }

  /**
   * Build the final response
   */
  private buildFinalResponse(context: AgentExecutionContext): unknown {
    if (context.steps.length === 0) {
      return { message: 'No steps executed', goal: context.goal };
    }

    const lastStep = context.steps[context.steps.length - 1];
    return lastStep?.observation ?? { goal: context.goal, status: 'no result' };
  }

  /**
   * Build the reasoning string
   */
  private buildReasoning(context: AgentExecutionContext): string {
    return context.steps
      .map((step, i) => `Step ${i + 1} (${step.action.tool}): ${step.action.reasoning}`)
      .join(' → ');
  }

  /**
   * Get the default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are an intelligent agent that solves problems step by step.
You have access to various tools to help you achieve your goals.
When responding, always provide your reasoning and the tool you want to use next.
Think carefully about which tool to use and what input to provide.`;
  }

  /**
   * Add a tool to the agent
   */
  public addTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
    this.logger.debug('Tool added to agent', { tool: tool.name });
  }

  /**
   * Remove a tool from the agent
   */
  public removeTool(toolName: string): void {
    this.tools.delete(toolName);
    this.logger.debug('Tool removed from agent', { tool: toolName });
  }

  /**
   * Get agent name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get agent description
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Get available tools
   */
  public getTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }
}
