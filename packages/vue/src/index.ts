/**
 * @weave/vue - Vue 3 components and composables for Weave
 * Main entry point for Vue integration
 */

// Export components
export * from './components/index.js'

// Export composables
export * from './composables/index.js'

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
  SentimentBadgeProps
} from './types/components'
