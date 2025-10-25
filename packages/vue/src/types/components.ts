/**
 * Vue Component Types
 * Type definitions for all Vue 3 AI components
 */

export interface StreamingTextProps {
  text: string
  speed?: 'slow' | 'normal' | 'fast'
  onComplete?: () => void
  class?: string
  typewriter?: boolean
  charsPerSecond?: number
}

export interface AIChatboxProps {
  theme?: 'light' | 'dark'
  onSendMessage?: (message: string) => Promise<void>
  initialMessages?: ChatMessage[]
  showTimestamps?: boolean
  enableMarkdown?: boolean
  placeholder?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface AITextareaProps {
  value: string
  onChange: (value: string) => void
  onAISuggest?: (text: string) => Promise<string>
  placeholder?: string
  minRows?: number
  maxRows?: number
  disabled?: boolean
  readonly?: boolean
}

export interface AIInputProps {
  value: string
  onChange: (value: string) => void
  suggestions?: string[]
  onSelectSuggestion?: (suggestion: string) => void
  placeholder?: string
  disabled?: boolean
}

export interface ContentGeneratorProps {
  type: 'blog' | 'social' | 'email' | 'product' | 'documentation'
  onGenerate: (content: string) => Promise<void>
  template?: string
  parameters?: Record<string, unknown>
  showPreview?: boolean
  isLoading?: boolean
}

export interface AISearchProps {
  results?: SearchResult[]
  placeholder?: string
  onSearch?: (query: string) => Promise<void>
  showScore?: boolean
  isLoading?: boolean
}

export interface SearchResult {
  id: string
  title: string
  description: string
  score?: number
  url?: string
}

export interface AIFormProps {
  schema: FormFieldSchema[]
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  onAIFill?: (field: string, value: unknown) => Promise<unknown>
  showAIFill?: boolean
  isSubmitting?: boolean
  errors?: Record<string, string>
}

export interface FormFieldSchema {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: unknown }[]
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface SentimentBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral'
  size?: 'small' | 'medium' | 'large'
  showPercentage?: boolean
  showLabel?: boolean
  score?: number
}
