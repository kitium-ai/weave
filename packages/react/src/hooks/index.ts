/**
 * Weave React Hooks
 * Custom hooks for AI integration
 */

export { useAI, useGenerateAI, useClassifyAI, useExtractAI } from './useAI.js';
export type { AIStatus, UseAIOptions, UseAIReturn } from './useAI.js';

export { useAIChat } from './useAIChat.js';
export type { UseAIChatOptions, UseAIChatReturn } from './useAIChat.js';

export { useAIForm } from './useAIForm.js';
export type { UseAIFormOptions, UseAIFormReturn } from './useAIForm.js';

export { useFormValidator } from './useFormValidator.js';
export type {
  UseFormValidatorOptions,
  UseFormValidatorReturn,
  FormValidationIssue,
  FormValidatorOperation,
} from './useFormValidator.js';

export { useAIStream } from './useAIStream.js';
export type { UseAIStreamOptions, UseAIStreamReturn } from './useAIStream.js';

export { useComponentGenerator } from './useComponentGenerator.js';
export type { UseComponentGeneratorReturn } from './useComponentGenerator.js';

export { useHookGenerator } from './useHookGenerator.js';
export type { UseHookGeneratorReturn } from './useHookGenerator.js';

export { useTypeGenerator } from './useTypeGenerator.js';
export type { UseTypeGeneratorReturn } from './useTypeGenerator.js';

export { useUtilGenerator } from './useUtilGenerator.js';
export type { UseUtilGeneratorReturn } from './useUtilGenerator.js';

export { useQueryGenerator } from './useQueryGenerator.js';
export type { UseQueryGeneratorReturn } from './useQueryGenerator.js';

export { useSmartExtract } from './useSmartExtract.js';
export type {
  UseSmartExtractOptions,
  UseSmartExtractReturn,
  SmartExtractResult,
  UseSmartExtractRunOptions,
} from './useSmartExtract.js';

export { usePromptTemplate } from './use-prompt-template.js';
export type {
  UsePromptTemplateOptions,
  UsePromptTemplateReturn,
  PromptTemplate,
  PromptVariable,
  PromptVariant,
  PromptMetrics,
  PromptTestResult,
} from '../types/prompt-template.js';

export { useCache } from './useCache.js';
export type { UseCacheOptions, UseCacheReturn, CacheFeedbackEvent } from './useCache.js';

export { useProviderRouting, useProviderNotifications } from './useProviderRouting.js';
export type {
  UseProviderRoutingOptions,
  UseProviderRoutingReturn,
  UseProviderNotificationsOptions,
} from './useProviderRouting.js';
