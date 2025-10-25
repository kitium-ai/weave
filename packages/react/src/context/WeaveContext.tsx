/**
 * Weave React Context for providing Weave instance to components
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import type { Weave } from '@weave/core';

/**
 * Weave context type
 */
interface WeaveContextType {
  weave: Weave | null;
}

/**
 * Create Weave context
 */
const WeaveContext = createContext<WeaveContextType | undefined>(undefined);

/**
 * Weave Provider component props
 */
interface WeaveProviderProps {
  weave: Weave;
  children: ReactNode;
}

/**
 * Weave Provider component - provides Weave instance to child components
 */
export function WeaveProvider({ weave, children }: WeaveProviderProps): React.ReactElement {
  return (
    <WeaveContext.Provider value={{ weave }}>
      {children}
    </WeaveContext.Provider>
  );
}

/**
 * Hook to use Weave context
 */
export function useWeaveContext(): WeaveContextType {
  const context = useContext(WeaveContext);

  if (!context) {
    throw new Error('useWeaveContext must be used within a WeaveProvider');
  }

  return context;
}
