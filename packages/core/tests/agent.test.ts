/**
 * Agent framework tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../src/agents/agent.js';
import type { AgentTool, AgentConfig } from '../src/agents/types.js';
import type { ILanguageModel } from '../src/providers/interfaces.js';
import { Weave } from '../src/weave.js';

// Mock language model
const createMockModel = (): ILanguageModel => {
  return {
    generate: vi.fn().mockResolvedValue({
      text: 'TOOL: calculator, INPUT: {"operation": "add", "a": 2, "b": 2}, REASONING: Adding two numbers',
      tokenCount: { input: 10, output: 20 },
      finishReason: 'stop',
    }),
    classify: vi.fn(),
    extract: vi.fn(),
    chat: vi.fn(),
    countTokens: vi.fn(),
    validate: vi.fn().mockResolvedValue(true),
  } as unknown as ILanguageModel;
};

describe('Agent Framework', () => {
  let model: ILanguageModel;
  let agentConfig: AgentConfig;
  let calculatorTool: AgentTool;

  beforeEach(() => {
    model = createMockModel();

    calculatorTool = {
      name: 'calculator',
      description: 'Performs basic math operations',
      execute: vi.fn().mockResolvedValue({ result: 4, operation: 'add' }),
      schema: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          a: { type: 'number' },
          b: { type: 'number' },
        },
      },
      uiContext: {
        displayAs: 'json',
        displayElement: '#calc-results',
      },
    };

    agentConfig = {
      name: 'MathAgent',
      description: 'An agent that solves math problems',
      tools: [calculatorTool],
      maxSteps: 5,
      temperature: 0.7,
    };
  });

  describe('Agent initialization', () => {
    it('should create an agent with config', () => {
      const agent = new Agent(model, agentConfig);
      expect(agent.getName()).toBe('MathAgent');
      expect(agent.getDescription()).toBe('An agent that solves math problems');
    });

    it('should initialize with tools', () => {
      const agent = new Agent(model, agentConfig);
      const tools = agent.getTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('calculator');
    });

    it('should have default values for optional config', () => {
      const minimalConfig: AgentConfig = {
        name: 'SimpleAgent',
        description: 'A simple agent',
        tools: [],
      };
      const agent = new Agent(model, minimalConfig);
      expect(agent.getName()).toBe('SimpleAgent');
    });
  });

  describe('Agent tool management', () => {
    it('should add a tool to the agent', () => {
      const agent = new Agent(model, agentConfig);

      const webSearchTool: AgentTool = {
        name: 'web_search',
        description: 'Search the web for information',
        execute: vi.fn(),
      };

      agent.addTool(webSearchTool);
      const tools = agent.getTools();
      expect(tools).toHaveLength(2);
      expect(tools[1].name).toBe('web_search');
    });

    it('should remove a tool from the agent', () => {
      const agent = new Agent(model, agentConfig);
      agent.removeTool('calculator');
      expect(agent.getTools()).toHaveLength(0);
    });

    it('should not fail when removing non-existent tool', () => {
      const agent = new Agent(model, agentConfig);
      expect(() => agent.removeTool('non_existent')).not.toThrow();
      expect(agent.getTools()).toHaveLength(1);
    });
  });

  describe('Agent execution', () => {
    it('should execute agent and return response', async () => {
      const agent = new Agent(model, agentConfig);
      const response = await agent.execute('What is 2 + 2?');

      expect(response).toBeDefined();
      expect(response.result).toBeDefined();
      expect(response.steps).toBeDefined();
      expect(response.reasoning).toBeDefined();
      expect(response.tokenCount).toBeDefined();
    });

    it('should track execution steps', async () => {
      const agent = new Agent(model, agentConfig);
      const response = await agent.execute('What is 2 + 2?');

      expect(response.steps.length).toBeGreaterThanOrEqual(0);
    });

    it('should execute tools during agent reasoning', async () => {
      const agent = new Agent(model, agentConfig);
      await agent.execute('Calculate 5 + 3');

      expect(calculatorTool.execute).toHaveBeenCalled();
    });

    it('should include ui context and trigger thinking callbacks when configured', async () => {
      const onStep = vi.fn();
      const config: AgentConfig = {
        ...agentConfig,
        thinking: {
          displaySteps: true,
          updateUI: true,
          onStep,
        },
      };

      const agent = new Agent(model, config);
      const response = await agent.execute('Explain your math');

      expect(response.steps[0]?.ui).toEqual(calculatorTool.uiContext);
      expect(onStep).toHaveBeenCalled();
      expect(onStep.mock.calls[0][0].ui).toEqual(calculatorTool.uiContext);
    });

    it('should handle tool execution errors gracefully', async () => {
      const failingTool: AgentTool = {
        name: 'failing_tool',
        description: 'A tool that fails',
        execute: vi.fn().mockRejectedValue(new Error('Tool failed')),
      };

      const config: AgentConfig = {
        name: 'TestAgent',
        description: 'Test agent',
        tools: [failingTool],
      };

      const mockModel = createMockModel();
      (mockModel.generate as any).mockResolvedValueOnce({
        text: 'TOOL: failing_tool, INPUT: {}, REASONING: Testing error',
        tokenCount: { input: 10, output: 20 },
        finishReason: 'stop',
      });

      const agent = new Agent(mockModel, config);
      const response = await agent.execute('Test failing tool');

      expect(response).toBeDefined();
      expect(failingTool.execute).toHaveBeenCalled();
    });

    it('should respect max steps limit', async () => {
      const config: AgentConfig = {
        name: 'TestAgent',
        description: 'Test agent',
        tools: [calculatorTool],
        maxSteps: 2,
      };

      const agent = new Agent(model, config);
      const response = await agent.execute('Test goal');

      expect(response.steps.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Agent response structure', () => {
    it('should return structured response', async () => {
      const agent = new Agent(model, agentConfig);
      const response = await agent.execute('What is 2 + 2?');

      expect(response).toHaveProperty('result');
      expect(response).toHaveProperty('steps');
      expect(response).toHaveProperty('reasoning');
      expect(response).toHaveProperty('tokenCount');

      expect(response.tokenCount).toHaveProperty('input');
      expect(response.tokenCount).toHaveProperty('output');
    });

    it('should include action reasoning in steps', async () => {
      const agent = new Agent(model, agentConfig);
      const response = await agent.execute('Test goal');

      for (const step of response.steps) {
        expect(step).toHaveProperty('action');
        expect(step).toHaveProperty('observation');
        expect(step).toHaveProperty('timestamp');
        expect(step.action).toHaveProperty('tool');
        expect(step.action).toHaveProperty('input');
        expect(step.action).toHaveProperty('reasoning');
      }
    });
  });

  describe('Tool parsing', () => {
    it('should correctly parse tool execution commands', async () => {
      const mockModel = createMockModel();
      (mockModel.generate as any).mockResolvedValueOnce({
        text: 'TOOL: calculator, INPUT: {"operation": "multiply", "a": 5, "b": 3}, REASONING: Multiplying numbers',
        tokenCount: { input: 10, output: 20 },
        finishReason: 'stop',
      });

      const agent = new Agent(mockModel, agentConfig);
      await agent.execute('What is 5 * 3?');

      expect(calculatorTool.execute).toHaveBeenCalledWith({
        operation: 'multiply',
        a: 5,
        b: 3,
      });
    });

    it('should handle malformed tool commands', async () => {
      const mockModel = createMockModel();
      (mockModel.generate as any).mockResolvedValueOnce({
        text: 'This is not a valid tool command format',
        tokenCount: { input: 10, output: 20 },
        finishReason: 'stop',
      });

      const agent = new Agent(mockModel, agentConfig);
      const response = await agent.execute('Test goal');

      expect(response).toBeDefined();
      expect(response.steps.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('Weave agent factory', () => {
  it('should create an agent with built-in tools', () => {
    const weave = new Weave({ provider: { type: 'mock' } as any });
    const agent = weave.createAgent({ tools: ['generate', 'classify'], goal: 'Classify data' });

    const toolNames = agent.getTools().map((tool) => tool.name);
    expect(toolNames).toContain('generate');
    expect(toolNames).toContain('classify');
  });

  it('should keep custom ui-aware tools', async () => {
    const weave = new Weave({ provider: { type: 'mock' } as any });
    const displayTool: AgentTool = {
      name: 'display-result',
      description: 'Display data in UI',
      uiContext: {
        displayElement: '#analysis-panel',
        displayAs: 'markdown',
      },
      execute: vi.fn().mockResolvedValue({ success: true, displayed: true }),
    };

    const agent = weave.createAgent({
      tools: ['generate', displayTool],
      goal: 'Show answer',
      thinking: {
        updateUI: true,
        onStep: vi.fn(),
      },
    });

    const uiTool = agent.getTools().find((tool) => tool.name === 'display-result');
    expect(uiTool?.uiContext?.displayElement).toBe('#analysis-panel');
  });
});
