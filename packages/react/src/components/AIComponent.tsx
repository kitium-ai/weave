/**
 * AIComponent - Render props component for executing AI operations
 */

import React, { type ReactNode } from 'react';
import { useAI, type AIStatus } from '../hooks';

/**
 * AIComponent render props
 */
export interface AIComponentProps<T = unknown> {
  onExecute: () => Promise<T>;
  children: (props: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    status: AIStatus;
    execute: () => Promise<void>;
  }) => ReactNode;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

/**
 * AIComponent - Wrapper component for AI operations with render props
 */
export function AIComponent<T = unknown>({
  onExecute,
  children,
  onSuccess,
  onError,
  onStart,
}: AIComponentProps<T>): React.ReactElement {
  const { data, loading, error, status, execute } = useAI<T>({
    onSuccess,
    onError,
    onStart,
  });

  const handleExecute = async () => {
    await execute(onExecute);
  };

  return <>{children({ data, loading, error, status, execute: handleExecute })}</>;
}
