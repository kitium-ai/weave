/**
 * Debug Helper
 * Utilities for debugging and inspecting Weave operations
 */

import { getLogger } from '@weaveai/shared';

/**
 * Operation trace
 */
export interface OperationTrace {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  input?: unknown;
  output?: unknown;
  error?: Error;
  tags: Record<string, string>;
}

/**
 * Debug helper for tracing and debugging operations
 */
export class DebugHelper {
  private traces: Map<string, OperationTrace> = new Map();
  private readonly logger = getLogger();
  private enabled: boolean = true;

  /**
   * Start tracing an operation
   */
  public startTrace(
    id: string,
    name: string,
    input?: unknown,
    tags: Record<string, string> = {}
  ): void {
    if (!this.enabled) {
      return;
    }

    const trace: OperationTrace = {
      id,
      name,
      startTime: new Date(),
      status: 'pending',
      input,
      tags,
    };

    this.traces.set(id, trace);
    this.logger.debug(`Trace started: ${name}`, { id, input });
  }

  /**
   * End trace with success
   */
  public endTrace(id: string, output?: unknown): OperationTrace | null {
    if (!this.enabled) {
      return null;
    }

    const trace = this.traces.get(id);
    if (!trace) {
      return null;
    }

    const now = new Date();
    trace.endTime = now;
    trace.duration = now.getTime() - trace.startTime.getTime();
    trace.status = 'success';
    trace.output = output;

    this.logger.debug(`Trace completed: ${trace.name}`, {
      id,
      duration: trace.duration,
      output,
    });

    return trace;
  }

  /**
   * End trace with error
   */
  public endTraceWithError(id: string, error: Error): OperationTrace | null {
    if (!this.enabled) {
      return null;
    }

    const trace = this.traces.get(id);
    if (!trace) {
      return null;
    }

    const now = new Date();
    trace.endTime = now;
    trace.duration = now.getTime() - trace.startTime.getTime();
    trace.status = 'error';
    trace.error = error;

    this.logger.error(`Trace failed: ${trace.name}`, {
      id,
      duration: trace.duration,
      error: error.message,
    });

    return trace;
  }

  /**
   * Get trace by ID
   */
  public getTrace(id: string): OperationTrace | undefined {
    return this.traces.get(id);
  }

  /**
   * Get all traces
   */
  public getAllTraces(): OperationTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get traces by status
   */
  public getTracesByStatus(status: 'pending' | 'success' | 'error'): OperationTrace[] {
    return Array.from(this.traces.values()).filter((t) => t.status === status);
  }

  /**
   * Clear traces
   */
  public clearTraces(): void {
    this.traces.clear();
    this.logger.debug('Traces cleared');
  }

  /**
   * Enable/disable debugging
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get debugging statistics
   */
  public getStats(): {
    totalTraces: number;
    successCount: number;
    errorCount: number;
    pendingCount: number;
    averageDuration: number;
  } {
    const traces = Array.from(this.traces.values());
    const completed = traces.filter((t) => t.duration !== undefined);

    return {
      totalTraces: traces.length,
      successCount: traces.filter((t) => t.status === 'success').length,
      errorCount: traces.filter((t) => t.status === 'error').length,
      pendingCount: traces.filter((t) => t.status === 'pending').length,
      averageDuration:
        completed.length > 0
          ? completed.reduce((sum, t) => sum + (t.duration || 0), 0) / completed.length
          : 0,
    };
  }

  /**
   * Format trace as string for logging
   */
  public formatTrace(trace: OperationTrace): string {
    const lines = [
      `Operation: ${trace.name}`,
      `Status: ${trace.status}`,
      `Duration: ${trace.duration || 'pending'}ms`,
    ];

    if (trace.input) {
      lines.push(`Input: ${JSON.stringify(trace.input, null, 2)}`);
    }

    if (trace.output) {
      lines.push(`Output: ${JSON.stringify(trace.output, null, 2)}`);
    }

    if (trace.error) {
      lines.push(`Error: ${trace.error.message}`);
    }

    return lines.join('\n');
  }
}

/**
 * Global debug helper instance
 */
let globalDebugHelper: DebugHelper | null = null;

/**
 * Get global debug helper
 */
export function getDebugHelper(): DebugHelper {
  if (!globalDebugHelper) {
    globalDebugHelper = new DebugHelper();
  }
  return globalDebugHelper;
}
