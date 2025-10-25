/**
 * Component type definitions for Weave React components
 */

export interface StreamingTextProps {
  /** Text to display with streaming effect */
  text: string;
  /** Animation speed: 'slow' | 'normal' | 'fast' */
  speed?: 'slow' | 'normal' | 'fast';
  /** Callback when streaming completes */
  onComplete?: () => void;
  /** CSS class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Enable typewriter effect */
  typewriter?: boolean;
  /** Characters per second for typewriter effect */
  charsPerSecond?: number;
}

export interface AIChatboxProps {
  /** Theme: 'light' | 'dark' | 'auto' */
  theme?: 'light' | 'dark' | 'auto';
  /** Callback when user sends a message */
  onSendMessage: (message: string) => Promise<void>;
  /** Initial messages to display */
  initialMessages?: ChatMessage[];
  /** Show message timestamps */
  showTimestamps?: boolean;
  /** Enable markdown rendering in messages */
  enableMarkdown?: boolean;
  /** CSS class name */
  className?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Max message length */
  maxLength?: number;
  /** Show character count */
  showCharCount?: boolean;
}

export interface AITextareaProps {
  /** Value of the textarea */
  value?: string;
  /** Callback on value change */
  onChange?: (value: string) => void;
  /** Callback for AI suggestions */
  onAISuggest?: (suggestion: string) => Promise<void>;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum rows */
  minRows?: number;
  /** Maximum rows */
  maxRows?: number;
  /** Show suggestion button */
  showSuggestions?: boolean;
  /** CSS class name */
  className?: string;
  /** Auto-expand textarea */
  autoExpand?: boolean;
}

export interface AIInputProps {
  /** Value of the input */
  value?: string;
  /** Callback on value change */
  onChange?: (value: string) => void;
  /** Suggestions to display */
  suggestions?: string[];
  /** Callback when suggestion is selected */
  onSelectSuggestion?: (suggestion: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show autocomplete dropdown */
  showDropdown?: boolean;
  /** CSS class name */
  className?: string;
  /** Max suggestions to show */
  maxSuggestions?: number;
}

export interface ContentGeneratorProps {
  /** Type of content: 'email' | 'article' | 'social' | 'ad' */
  type?: 'email' | 'article' | 'social' | 'ad' | 'custom';
  /** Callback when content is generated */
  onGenerate: (content: string) => void;
  /** Template for content generation */
  template?: string;
  /** Parameters for generation */
  parameters?: Record<string, string>;
  /** Show preview */
  showPreview?: boolean;
  /** CSS class name */
  className?: string;
}

export interface AISearchProps {
  /** Search results to display */
  results?: SearchResult[];
  /** Placeholder text */
  placeholder?: string;
  /** Callback on search */
  onSearch: (query: string) => Promise<void>;
  /** Show relevance score */
  showScore?: boolean;
  /** Callback when result is selected */
  onSelectResult?: (result: SearchResult) => void;
  /** CSS class name */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

export interface AIFormProps {
  /** Form schema defining fields */
  schema: FormField[];
  /** Callback when form is submitted */
  onSubmit: (values: Record<string, unknown>) => void;
  /** Callback for AI auto-fill */
  onAIFill?: (field: string, value: unknown) => Promise<void>;
  /** Show AI auto-fill button */
  showAIFill?: boolean;
  /** CSS class name */
  className?: string;
  /** Submit button text */
  submitText?: string;
}

export interface SentimentBadgeProps {
  /** Sentiment result containing scores */
  sentiment: SentimentScore;
  /** Size: 'small' | 'medium' | 'large' */
  size?: 'small' | 'medium' | 'large';
  /** Show percentage */
  showPercentage?: boolean;
  /** Show label */
  showLabel?: boolean;
  /** CSS class name */
  className?: string;
  /** Custom color mapping */
  colorMap?: Record<string, string>;
}

// Supporting types
export interface ChatMessage {
  /** Message role: 'user' | 'assistant' | 'system' */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp?: Date;
  /** Message ID for React key */
  id?: string;
}

export interface SearchResult {
  /** Result document or text */
  document: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** Index in results array */
  index: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface FormField {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox';
  /** Required field */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Options for select fields */
  options?: { label: string; value: unknown }[];
  /** Field validation */
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: unknown) => boolean | string;
  };
}

export interface SentimentScore {
  /** Compound score (-1 to 1) */
  compound: number;
  /** Positive score (0 to 1) */
  positive: number;
  /** Negative score (0 to 1) */
  negative: number;
  /** Neutral score (0 to 1) */
  neutral: number;
}

// Theme configuration
export interface ComponentTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    background: string;
    text: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: string;
  fontFamily: string;
  fontSize: {
    sm: string;
    base: string;
    lg: string;
    xl: string;
  };
}
