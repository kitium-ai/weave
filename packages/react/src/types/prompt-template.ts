/**
 * Prompt Template Types
 * Type definitions for prompt management system
 */

export interface PromptVariable {
  name: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: string | number | boolean;
  placeholder?: string;
  validation?: (value: unknown) => boolean | string;
}

export interface PromptVariant {
  id: string;
  name?: string;
  template: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metrics?: PromptMetrics;
}

export interface PromptMetrics {
  totalRuns: number;
  averageQuality?: number;
  successRate?: number;
  avgResponseTime?: number;
  errors?: number;
  lastUsed?: Date;
  customMetrics?: Record<string, number | string>;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  variables: PromptVariable[];
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  editable: boolean;
  public: boolean;
  author?: string;
  metrics?: PromptMetrics;
}

export interface PromptTestResult {
  success: boolean;
  renderedPrompt: string;
  variables: Record<string, unknown>;
  duration: number;
  error?: string;
}

export interface PromptRenderOptions {
  strict?: boolean; // Throw on missing variables
  skipValidation?: boolean;
  trim?: boolean;
}

export interface UsePromptTemplateOptions {
  name: string;
  template?: string;
  variables?: PromptVariable[];
  editable?: boolean;
  trackMetrics?: boolean;
  variants?: PromptVariant[];
  category?: string;
  tags?: string[];
  onError?: (error: Error) => void;
  onMetricsUpdate?: (metrics: PromptMetrics) => void;
  onTemplateChange?: (template: string) => void;
  persistToLocalStorage?: boolean;
  storageKey?: string;
}

export interface UsePromptTemplateReturn {
  // State
  currentTemplate: PromptTemplate;
  templates: PromptTemplate[];
  variants: PromptVariant[];
  currentVariant: PromptVariant | null;
  metrics: PromptMetrics | null;
  isLoading: boolean;
  error: Error | null;

  // Template Management
  setTemplate: (template: string | PromptTemplate) => void;
  updateVariable: (name: string, value: unknown) => void;
  setVariables: (variables: Record<string, unknown>) => void;
  getVariables: () => Record<string, unknown>;
  clearVariables: () => void;

  // Variant Management
  setVariant: (variantId: string) => void;
  addVariant: (variant: PromptVariant) => void;
  removeVariant: (variantId: string) => void;
  updateVariant: (variantId: string, updates: Partial<PromptVariant>) => void;

  // Rendering
  render: (variables?: Record<string, unknown>, options?: PromptRenderOptions) => string;
  testRender: (variables?: Record<string, unknown>) => Promise<PromptTestResult>;
  validateTemplate: () => { valid: boolean; errors: string[] };
  validateVariables: (variables?: Record<string, unknown>) => { valid: boolean; errors: string[] };

  // A/B Testing
  getVariantMetrics: (variantId: string) => PromptMetrics | null;
  compareVariants: (variantIds: string[]) => PromptMetricsComparison;

  // Persistence
  save: () => Promise<void>;
  load: (templateId: string) => Promise<void>;
  export: () => string;
  import: (data: string) => void;
  reset: () => void;
}

export interface PromptMetricsComparison {
  variants: {
    id: string;
    name?: string;
    metrics: PromptMetrics;
    winner?: boolean;
  }[];
  bestVariant?: string;
  significance?: number;
}

export interface PromptEditorProps {
  template: PromptTemplate | string;
  variables?: PromptVariable[] | Record<string, unknown>;
  onChange?: (template: string) => void;
  onTest?: (variables: Record<string, unknown>) => Promise<PromptTestResult>;
  onSave?: (template: string) => void;
  editable?: boolean;
  showVariables?: boolean;
  showMetrics?: boolean;
  showHistory?: boolean;
  variants?: PromptVariant[];
  onVariantChange?: (variantId: string) => void;
  className?: string;
  testData?: Record<string, unknown>;
}

export interface PromptHistoryEntry {
  id: string;
  template: string;
  timestamp: Date;
  variables?: Record<string, unknown>;
  result?: string;
  metrics?: {
    quality?: number;
    responseTime?: number;
  };
}

export interface PromptVariableValue {
  name: string;
  value: unknown;
  validated: boolean;
  error?: string;
}
