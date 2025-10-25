/**
 * Vue composables tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAI } from '../src/composables/useAI.js';

describe('useAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with idle state', () => {
    const { data, loading, error, status } = useAI();
    expect(data.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(status.value).toBe('idle');
  });

  it('should execute async function successfully', async () => {
    const { data, loading, error, status, execute } = useAI<string>();
    const fn = vi.fn().mockResolvedValue('result');

    const result = await execute(fn);

    expect(result).toBe('result');
    expect(data.value).toBe('result');
    expect(status.value).toBe('success');
    expect(error.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it('should handle errors', async () => {
    const { error, status, execute } = useAI();
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    const result = await execute(fn);

    expect(result).toBeNull();
    expect(error.value?.message).toBe('Test error');
    expect(status.value).toBe('error');
  });

  it('should call onStart callback', async () => {
    const onStart = vi.fn();
    const { execute } = useAI<string>({
      onStart,
    });

    const fn = vi.fn().mockResolvedValue('result');
    await execute(fn);

    expect(onStart).toHaveBeenCalled();
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { execute } = useAI<string>({
      onSuccess,
    });

    const fn = vi.fn().mockResolvedValue('result');
    const result = await execute(fn);

    expect(onSuccess).toHaveBeenCalledWith('result');
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();
    const { execute } = useAI<string>({
      onError,
    });

    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);
    await execute(fn);

    expect(onError).toHaveBeenCalledWith(testError);
  });

  it('should reset state on successful execution', async () => {
    const { data, error, execute } = useAI<string>();

    // First fail
    const failFn = vi.fn().mockRejectedValue(new Error('fail'));
    await execute(failFn);
    expect(error.value?.message).toBe('fail');

    // Then succeed
    const successFn = vi.fn().mockResolvedValue('success');
    const result = await execute(successFn);

    expect(result).toBe('success');
    expect(data.value).toBe('success');
    expect(error.value).toBeNull();
  });

  it('should handle null execute function', async () => {
    const { data, execute } = useAI<string>();
    const result = await execute(null as any);

    expect(result).toBeNull();
    expect(data.value).toBeNull();
  });

  it('should properly transition through loading states', async () => {
    const { loading, execute } = useAI<string>();

    const states: boolean[] = [];
    const fn = vi.fn().mockImplementation(async () => {
      states.push(loading.value);
      await new Promise(r => setTimeout(r, 10));
      return 'result';
    });

    await execute(fn);

    // Loading should be true during execution
    expect(states[0]).toBe(true);
    expect(loading.value).toBe(false); // Should be false after completion
  });
});
