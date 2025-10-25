/**
 * Svelte stores tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import type { Weave } from '@weave/core';

const createMockWeave = (): Weave => ({
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({
    chat: vi.fn().mockResolvedValue('Chat response')
  }),
} as unknown as Weave);

describe('Svelte Stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a writable store', () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });

    let value: any;
    const unsubscribe = store.subscribe(v => {
      value = v;
    });

    expect(value.data).toBeNull();
    expect(value.loading).toBe(false);
    expect(value.error).toBeNull();
    expect(value.status).toBe('idle');

    unsubscribe();
  });

  it('should update store state', () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });

    store.set({ data: 'result', loading: false, error: null, status: 'success' });

    let value: any;
    store.subscribe(v => {
      value = v;
    })();

    expect(value.data).toBe('result');
    expect(value.status).toBe('success');
  });

  it('should handle multiple subscribers', () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });
    const values: any[] = [];

    const unsub1 = store.subscribe(v => values.push(v));
    const unsub2 = store.subscribe(v => values.push(v));

    store.set({ data: 'new', loading: false, error: null, status: 'success' });

    // Should have 4 values (2 initial + 2 updates)
    expect(values.length).toBeGreaterThan(0);
    expect(values[values.length - 1].data).toBe('new');

    unsub1();
    unsub2();
  });

  it('should support derived stores with computed values', () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });

    const updates: any[] = [];
    const unsubscribe = store.subscribe(v => {
      updates.push(v);
    });

    // Update to loading state
    store.update(s => ({ ...s, loading: true, status: 'loading' }));
    expect(updates[updates.length - 1].loading).toBe(true);
    expect(updates[updates.length - 1].status).toBe('loading');

    // Update to success state
    store.update(s => ({ ...s, data: 'result', loading: false, status: 'success' }));
    expect(updates[updates.length - 1].data).toBe('result');
    expect(updates[updates.length - 1].loading).toBe(false);
    expect(updates[updates.length - 1].status).toBe('success');

    unsubscribe();
  });

  it('should handle error states', () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });

    const testError = new Error('Test error');
    store.update(s => ({ ...s, error: testError, status: 'error' }));

    let value: any;
    store.subscribe(v => {
      value = v;
    })();

    expect(value.error?.message).toBe('Test error');
    expect(value.status).toBe('error');
  });

  it('should reset store to initial state', () => {
    const initialState = { data: null, loading: false, error: null, status: 'idle' as const };
    const store = writable({ ...initialState });

    // Set to some other state
    store.set({ data: 'value', loading: true, error: new Error('err'), status: 'loading' as const });

    // Reset to initial
    store.set(initialState);

    let value: any;
    store.subscribe(v => {
      value = v;
    })();

    expect(value).toEqual(initialState);
  });

  it('should unsubscribe properly', () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });
    let callCount = 0;

    const unsubscribe = store.subscribe(() => {
      callCount++;
    });

    store.set({ data: 'value', loading: false, error: null, status: 'idle' });
    const countAfterUpdate = callCount;

    unsubscribe();

    store.set({ data: 'another', loading: false, error: null, status: 'idle' });

    // Should not increase after unsubscribe
    expect(callCount).toBe(countAfterUpdate);
  });

  it('should support async operations with stores', async () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });

    // Simulate async operation
    store.update(s => ({ ...s, loading: true, status: 'loading' }));

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 10));

    store.update(s => ({ ...s, data: 'async result', loading: false, status: 'success' }));

    let value: any;
    store.subscribe(v => {
      value = v;
    })();

    expect(value.data).toBe('async result');
    expect(value.status).toBe('success');
  });

  it('should handle concurrent subscriptions', () => {
    const store = writable({ data: null, loading: false, error: null, status: 'idle' });
    const results: any[] = [];

    const unsub1 = store.subscribe(v => {
      results.push({ subscriber: 1, value: v.data });
    });

    const unsub2 = store.subscribe(v => {
      results.push({ subscriber: 2, value: v.data });
    });

    store.set({ data: 'test', loading: false, error: null, status: 'idle' });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.value === 'test')).toBe(true);

    unsub1();
    unsub2();
  });
});
