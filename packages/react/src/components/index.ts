/**
 * Weave React Components
 * Production-ready AI-powered UI components
 */

export { AIComponent } from './AIComponent.js';
export type { AIComponentProps } from './AIComponent.js';

export { AIChat } from './AIChat.js';
export type { AIChatProps } from './AIChat.js';

export { StreamingText } from './StreamingText.js';
export { AIChatbox } from './AIChatbox.js';
export { AITextarea } from './AITextarea.js';
export { AIInput } from './AIInput.js';
export { ContentGenerator } from './ContentGenerator.js';
export { AISearch } from './AISearch.js';
export { AIForm } from './AIForm.js';
export { SentimentBadge } from './SentimentBadge.js';

export { PromptEditor } from './PromptEditor.js';

// Re-export types and ChatMessage from core
export type {
  StreamingTextProps,
  AIChatboxProps,
  AITextareaProps,
  AIInputProps,
  ContentGeneratorProps,
  AISearchProps,
  AIFormProps,
  SentimentBadgeProps,
  ChatMessage,
  SearchResult,
  FormField,
  SentimentScore,
  ComponentTheme,
} from '../types/components.js';

export type { PromptEditorProps } from '../types/prompt-template.js';
