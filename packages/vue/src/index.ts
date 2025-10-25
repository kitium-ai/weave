/**
 * @weaveai/vue - Vue 3 composables for Weave
 * Main entry point for Vue integration
 */

// Export composables
export * from './composables/index.js';

// Export types
export type {
  StreamingTextProps,
  AIChatboxProps,
  ChatMessage,
  AITextareaProps,
  AIInputProps,
  ContentGeneratorProps,
  AISearchProps,
  SearchResult,
  AIFormProps,
  FormFieldSchema,
  SentimentBadgeProps,
} from './types/components';
