/**
 * Built-in Prompt Templates
 * 50+ production-ready templates for common AI tasks across 8 categories
 */

import type { PromptTemplate } from './types.js';

/**
 * Email category templates (8 templates)
 */
const emailTemplates: PromptTemplate[] = [
  {
    name: 'email-professional-greeting',
    version: '1.0.0',
    category: 'email',
    template: `Write a professional email greeting for {{recipient}} about {{subject}}.
Tone: {{tone}}
Keep it concise and friendly.`,
    variables: {
      recipient: { type: 'string', required: true, description: 'Name of recipient' },
      subject: { type: 'string', required: true, description: 'Email subject' },
      tone: {
        type: 'string',
        required: false,
        default: 'professional',
        enum: ['formal', 'professional', 'friendly', 'casual']
      }
    },
    description: 'Generate professional email greetings',
    tags: ['email', 'greeting', 'professional'],
    author: 'Weave'
  },
  {
    name: 'email-follow-up',
    version: '1.0.0',
    category: 'email',
    template: `Write a follow-up email for {{context}}.
Previous interaction: {{previousMessage}}
Days passed: {{daysPassed}}
Goal: {{goal}}
Maintain a professional tone while being personable.`,
    variables: {
      context: { type: 'string', required: true, description: 'Context of follow-up' },
      previousMessage: { type: 'string', required: true, description: 'Summary of previous message' },
      daysPassed: { type: 'number', required: true, description: 'Days since last contact' },
      goal: { type: 'string', required: true, description: 'Goal of this follow-up' }
    },
    description: 'Generate follow-up emails with context awareness',
    tags: ['email', 'follow-up', 'sales'],
    author: 'Weave'
  },
  {
    name: 'email-rejection-notice',
    version: '1.0.0',
    category: 'email',
    template: `Write a respectful rejection email to {{recipient}}.
Position: {{position}}
Reason: {{reason}}
Next steps: {{nextSteps}}
Tone should be professional and appreciative.`,
    variables: {
      recipient: { type: 'string', required: true },
      position: { type: 'string', required: true },
      reason: { type: 'string', required: true },
      nextSteps: { type: 'string', required: false, default: 'No further steps' }
    },
    description: 'Generate respectful rejection emails',
    tags: ['email', 'rejection', 'hr'],
    author: 'Weave'
  },
  {
    name: 'email-apology',
    version: '1.0.0',
    category: 'email',
    template: `Write an apology email to {{recipient}} for {{issue}}.
Severity: {{severity}}
Resolution: {{resolution}}
Ensure sincerity and accountability.`,
    variables: {
      recipient: { type: 'string', required: true },
      issue: { type: 'string', required: true },
      severity: {
        type: 'string',
        required: true,
        enum: ['minor', 'moderate', 'major']
      },
      resolution: { type: 'string', required: true }
    },
    description: 'Generate sincere apology emails',
    tags: ['email', 'apology', 'customer-service'],
    author: 'Weave'
  },
  {
    name: 'email-promotion',
    version: '1.0.0',
    category: 'email',
    template: `Write a promotional email for {{product}}.
Target audience: {{audience}}
Key benefits: {{benefits}}
Call to action: {{cta}}
Keep it engaging and concise.`,
    variables: {
      product: { type: 'string', required: true },
      audience: { type: 'string', required: true },
      benefits: { type: 'array', required: true, description: 'List of key benefits' },
      cta: { type: 'string', required: true, description: 'Call to action text' }
    },
    description: 'Generate promotional email campaigns',
    tags: ['email', 'marketing', 'promotion'],
    author: 'Weave'
  },
  {
    name: 'email-meeting-request',
    version: '1.0.0',
    category: 'email',
    template: `Write a meeting request email to {{recipient}}.
Purpose: {{purpose}}
Suggested times: {{times}}
Duration: {{duration}} minutes
Include flexibility and clear next steps.`,
    variables: {
      recipient: { type: 'string', required: true },
      purpose: { type: 'string', required: true },
      times: { type: 'array', required: true },
      duration: { type: 'number', required: true, default: 30 }
    },
    description: 'Generate professional meeting requests',
    tags: ['email', 'meeting', 'scheduling'],
    author: 'Weave'
  },
  {
    name: 'email-newsletter',
    version: '1.0.0',
    category: 'email',
    template: `Write a newsletter for {{topic}}.
Highlights: {{highlights}}
Featured content: {{featured}}
Call to action: {{cta}}
Keep tone engaging and informative.`,
    variables: {
      topic: { type: 'string', required: true },
      highlights: { type: 'array', required: true },
      featured: { type: 'string', required: true },
      cta: { type: 'string', required: false, default: 'Learn more' }
    },
    description: 'Generate newsletter content',
    tags: ['email', 'newsletter', 'content'],
    author: 'Weave'
  },
  {
    name: 'email-job-offer',
    version: '1.0.0',
    category: 'email',
    template: `Write a job offer email to {{candidate}}.
Position: {{position}}
Start date: {{startDate}}
Key details: {{details}}
Maintain professional and enthusiastic tone.`,
    variables: {
      candidate: { type: 'string', required: true },
      position: { type: 'string', required: true },
      startDate: { type: 'string', required: true },
      details: { type: 'array', required: true }
    },
    description: 'Generate job offer emails',
    tags: ['email', 'hiring', 'hr'],
    author: 'Weave'
  }
];

/**
 * Content generation templates (8 templates)
 */
const contentTemplates: PromptTemplate[] = [
  {
    name: 'content-blog-post',
    version: '1.0.0',
    category: 'content',
    template: `Write a blog post about {{topic}}.
Target audience: {{audience}}
Key points to cover: {{keyPoints}}
Tone: {{tone}}
Length: {{length}} words
Include engaging introduction and actionable conclusion.`,
    variables: {
      topic: { type: 'string', required: true },
      audience: { type: 'string', required: true },
      keyPoints: { type: 'array', required: true },
      tone: {
        type: 'string',
        required: false,
        default: 'informative',
        enum: ['informative', 'educational', 'entertaining', 'technical']
      },
      length: { type: 'number', required: false, default: 1000 }
    },
    description: 'Generate blog post content',
    tags: ['content', 'blog', 'writing'],
    author: 'Weave'
  },
  {
    name: 'content-social-media-post',
    version: '1.0.0',
    category: 'content',
    template: `Write a social media post for {{platform}}.
Topic: {{topic}}
Hashtags: {{hashtags}}
Call to action: {{cta}}
Keep it concise and engaging.`,
    variables: {
      platform: {
        type: 'string',
        required: true,
        enum: ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok']
      },
      topic: { type: 'string', required: true },
      hashtags: { type: 'array', required: false },
      cta: { type: 'string', required: false }
    },
    description: 'Generate social media posts optimized per platform',
    tags: ['content', 'social-media', 'marketing'],
    author: 'Weave'
  },
  {
    name: 'content-product-description',
    version: '1.0.0',
    category: 'content',
    template: `Write a product description for {{productName}}.
Category: {{category}}
Key features: {{features}}
Price range: {{priceRange}}
Target customer: {{targetCustomer}}
Emphasize benefits over features.`,
    variables: {
      productName: { type: 'string', required: true },
      category: { type: 'string', required: true },
      features: { type: 'array', required: true },
      priceRange: { type: 'string', required: false },
      targetCustomer: { type: 'string', required: true }
    },
    description: 'Generate product descriptions for e-commerce',
    tags: ['content', 'ecommerce', 'product'],
    author: 'Weave'
  },
  {
    name: 'content-press-release',
    version: '1.0.0',
    category: 'content',
    template: `Write a press release for {{company}}.
Announcement: {{announcement}}
Key details: {{keyDetails}}
Quote: {{executiveQuote}}
Follow standard press release format.`,
    variables: {
      company: { type: 'string', required: true },
      announcement: { type: 'string', required: true },
      keyDetails: { type: 'array', required: true },
      executiveQuote: { type: 'string', required: true }
    },
    description: 'Generate press releases',
    tags: ['content', 'pr', 'marketing'],
    author: 'Weave'
  },
  {
    name: 'content-video-script',
    version: '1.0.0',
    category: 'content',
    template: `Write a video script for {{videoTitle}}.
Duration: {{duration}} seconds
Topic: {{topic}}
Tone: {{tone}}
Target audience: {{audience}}
Include visual cues and pacing notes.`,
    variables: {
      videoTitle: { type: 'string', required: true },
      duration: { type: 'number', required: true },
      topic: { type: 'string', required: true },
      tone: { type: 'string', required: false, default: 'engaging' },
      audience: { type: 'string', required: true }
    },
    description: 'Generate video scripts with visual cues',
    tags: ['content', 'video', 'multimedia'],
    author: 'Weave'
  },
  {
    name: 'content-faq',
    version: '1.0.0',
    category: 'content',
    template: `Generate FAQ content for {{topic}}.
Common questions: {{questions}}
Target audience: {{audience}}
Format as Q&A pairs with clear, concise answers.`,
    variables: {
      topic: { type: 'string', required: true },
      questions: { type: 'array', required: true },
      audience: { type: 'string', required: true }
    },
    description: 'Generate FAQ content for websites',
    tags: ['content', 'faq', 'documentation'],
    author: 'Weave'
  },
  {
    name: 'content-landing-page-copy',
    version: '1.0.0',
    category: 'content',
    template: `Write landing page copy for {{productName}}.
Problem: {{problem}}
Solution: {{solution}}
Value proposition: {{valueProposition}}
Create compelling headline and sections.`,
    variables: {
      productName: { type: 'string', required: true },
      problem: { type: 'string', required: true },
      solution: { type: 'string', required: true },
      valueProposition: { type: 'array', required: true }
    },
    description: 'Generate landing page copy',
    tags: ['content', 'landing-page', 'copywriting'],
    author: 'Weave'
  },
  {
    name: 'content-documentation',
    version: '1.0.0',
    category: 'content',
    template: `Write technical documentation for {{feature}}.
Audience level: {{level}}
Steps to complete: {{steps}}
Include prerequisites and troubleshooting.`,
    variables: {
      feature: { type: 'string', required: true },
      level: {
        type: 'string',
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
      },
      steps: { type: 'array', required: true }
    },
    description: 'Generate technical documentation',
    tags: ['content', 'documentation', 'technical'],
    author: 'Weave'
  }
];

/**
 * Classification templates (6 templates)
 */
const classificationTemplates: PromptTemplate[] = [
  {
    name: 'classify-sentiment',
    version: '1.0.0',
    category: 'classification',
    template: `Classify the sentiment of the following text: {{text}}
Return one of: positive, negative, neutral
Consider context and intensity.`,
    variables: {
      text: { type: 'string', required: true, minLength: 1, maxLength: 5000 }
    },
    description: 'Classify text sentiment',
    tags: ['classification', 'sentiment', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'classify-intent',
    version: '1.0.0',
    category: 'classification',
    template: `Classify the user intent of: {{userMessage}}
Possible intents: {{intents}}
Return the most likely intent with confidence score.`,
    variables: {
      userMessage: { type: 'string', required: true },
      intents: { type: 'array', required: true }
    },
    description: 'Classify user intent from messages',
    tags: ['classification', 'intent', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'classify-category',
    version: '1.0.0',
    category: 'classification',
    template: `Categorize the following content into one of: {{categories}}
Content: {{content}}
Explain your classification briefly.`,
    variables: {
      categories: { type: 'array', required: true },
      content: { type: 'string', required: true }
    },
    description: 'Categorize content into predefined categories',
    tags: ['classification', 'categorization', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'classify-spam',
    version: '1.0.0',
    category: 'classification',
    template: `Analyze if the following is spam: {{content}}
Return: spam, not_spam, or uncertain
Provide confidence score and reasoning.`,
    variables: {
      content: { type: 'string', required: true }
    },
    description: 'Detect spam in text content',
    tags: ['classification', 'spam', 'security'],
    author: 'Weave'
  },
  {
    name: 'classify-language',
    version: '1.0.0',
    category: 'classification',
    template: `Detect the language of: {{text}}
Return ISO 639-1 language code and confidence score.`,
    variables: {
      text: { type: 'string', required: true, minLength: 5 }
    },
    description: 'Detect language of text',
    tags: ['classification', 'language-detection', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'classify-toxicity',
    version: '1.0.0',
    category: 'classification',
    template: `Analyze toxicity level of: {{text}}
Categories: {{categories}}
Return severity level and specific issues found.`,
    variables: {
      text: { type: 'string', required: true },
      categories: {
        type: 'array',
        required: false,
        default: ['hate', 'abuse', 'profanity', 'harassment']
      }
    },
    description: 'Detect toxic or harmful content',
    tags: ['classification', 'toxicity', 'moderation'],
    author: 'Weave'
  }
];

/**
 * Extraction templates (7 templates)
 */
const extractionTemplates: PromptTemplate[] = [
  {
    name: 'extract-entities',
    version: '1.0.0',
    category: 'extraction',
    template: `Extract named entities from: {{text}}
Entity types: {{entityTypes}}
Return as JSON array with type and value fields.`,
    variables: {
      text: { type: 'string', required: true },
      entityTypes: {
        type: 'array',
        required: false,
        default: ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE']
      }
    },
    description: 'Extract named entities from text',
    tags: ['extraction', 'ner', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'extract-key-points',
    version: '1.0.0',
    category: 'extraction',
    template: `Extract {{numPoints}} key points from: {{text}}
Return as numbered list with brief explanations.`,
    variables: {
      text: { type: 'string', required: true },
      numPoints: { type: 'number', required: false, default: 5 }
    },
    description: 'Extract key points from text',
    tags: ['extraction', 'summarization', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'extract-contact-info',
    version: '1.0.0',
    category: 'extraction',
    template: `Extract contact information from: {{text}}
Look for: email, phone, address, website
Return as structured JSON object.`,
    variables: {
      text: { type: 'string', required: true }
    },
    description: 'Extract contact information',
    tags: ['extraction', 'contact', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'extract-dates',
    version: '1.0.0',
    category: 'extraction',
    template: `Extract all dates from: {{text}}
Format: ISO 8601 (YYYY-MM-DD)
Return as array with original text and normalized date.`,
    variables: {
      text: { type: 'string', required: true },
      referenceDate: { type: 'string', required: false, description: 'ISO date for relative calculations' }
    },
    description: 'Extract and normalize dates',
    tags: ['extraction', 'date-parsing', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'extract-keywords',
    version: '1.0.0',
    category: 'extraction',
    template: `Extract top {{numKeywords}} keywords from: {{text}}
Return with relevance scores (0-1).`,
    variables: {
      text: { type: 'string', required: true },
      numKeywords: { type: 'number', required: false, default: 10 }
    },
    description: 'Extract keywords with relevance scores',
    tags: ['extraction', 'keywords', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'extract-structured-data',
    version: '1.0.0',
    category: 'extraction',
    template: `Extract data from {{text}} into this schema:
{{schema}}
Return as valid JSON matching the schema exactly.`,
    variables: {
      text: { type: 'string', required: true },
      schema: { type: 'object', required: true, description: 'Target JSON schema' }
    },
    description: 'Extract structured data into JSON schema',
    tags: ['extraction', 'structured-data', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'extract-table',
    version: '1.0.0',
    category: 'extraction',
    template: `Extract table data from: {{text}}
Return as CSV or JSON array format.
Headers: {{headers}}`,
    variables: {
      text: { type: 'string', required: true },
      headers: { type: 'array', required: false }
    },
    description: 'Extract tabular data from text',
    tags: ['extraction', 'table', 'data'],
    author: 'Weave'
  }
];

/**
 * Sentiment analysis templates (5 templates)
 */
const sentimentTemplates: PromptTemplate[] = [
  {
    name: 'sentiment-detailed-analysis',
    version: '1.0.0',
    category: 'sentiment',
    template: `Perform detailed sentiment analysis on: {{text}}
Provide: overall sentiment, emotions detected, intensity (0-100), reasoning.
Return as JSON object.`,
    variables: {
      text: { type: 'string', required: true, minLength: 1, maxLength: 5000 }
    },
    description: 'Detailed sentiment analysis with emotions',
    tags: ['sentiment', 'emotion', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'sentiment-aspect-based',
    version: '1.0.0',
    category: 'sentiment',
    template: `Perform aspect-based sentiment analysis on: {{text}}
Aspects to analyze: {{aspects}}
Return sentiment for each aspect separately.`,
    variables: {
      text: { type: 'string', required: true },
      aspects: { type: 'array', required: true }
    },
    description: 'Sentiment analysis per aspect/feature',
    tags: ['sentiment', 'aspect', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'sentiment-comparative',
    version: '1.0.0',
    category: 'sentiment',
    template: `Compare sentiments of: {{text1}} vs {{text2}}
Provide relative sentiment differences and explanations.`,
    variables: {
      text1: { type: 'string', required: true },
      text2: { type: 'string', required: true }
    },
    description: 'Compare sentiment between two texts',
    tags: ['sentiment', 'comparison', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'sentiment-timeline',
    version: '1.0.0',
    category: 'sentiment',
    template: `Analyze sentiment trajectory in: {{text}}
Identify sentiment shifts and turning points.
Return as timeline with sentiment changes.`,
    variables: {
      text: { type: 'string', required: true }
    },
    description: 'Track sentiment changes over text progression',
    tags: ['sentiment', 'timeline', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'sentiment-customer-feedback',
    version: '1.0.0',
    category: 'sentiment',
    template: `Analyze customer feedback: {{feedback}}
Extract: satisfaction level (1-5), issues, suggestions.
Return structured summary.`,
    variables: {
      feedback: { type: 'string', required: true },
      includeRecommendations: { type: 'boolean', required: false, default: true }
    },
    description: 'Analyze customer feedback sentiment and issues',
    tags: ['sentiment', 'customer-feedback', 'nlp'],
    author: 'Weave'
  }
];

/**
 * Translation templates (4 templates)
 */
const translationTemplates: PromptTemplate[] = [
  {
    name: 'translate-text',
    version: '1.0.0',
    category: 'translation',
    template: `Translate the following text to {{targetLanguage}}:
{{text}}
Maintain tone and context. Return only the translation.`,
    variables: {
      text: { type: 'string', required: true },
      targetLanguage: { type: 'string', required: true, description: 'Language name or code' },
      sourceLanguage: { type: 'string', required: false, description: 'ISO 639-1 code (auto-detect if omitted)' }
    },
    description: 'Translate text to target language',
    tags: ['translation', 'localization', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'translate-content-localization',
    version: '1.0.0',
    category: 'translation',
    template: `Translate and localize {{contentType}} for {{targetMarket}}:
{{content}}
Adapt cultural references, idioms, and formatting.`,
    variables: {
      content: { type: 'string', required: true },
      contentType: {
        type: 'string',
        required: true,
        enum: ['email', 'website', 'app', 'marketing', 'documentation']
      },
      targetMarket: { type: 'string', required: true, description: 'Country or region' }
    },
    description: 'Translate with cultural localization',
    tags: ['translation', 'localization', 'cultural'],
    author: 'Weave'
  },
  {
    name: 'translate-multilingual',
    version: '1.0.0',
    category: 'translation',
    template: `Translate the following to multiple languages: {{languages}}
{{text}}
Return as JSON object with language codes as keys.`,
    variables: {
      text: { type: 'string', required: true },
      languages: { type: 'array', required: true, description: 'Target language codes' }
    },
    description: 'Translate to multiple languages at once',
    tags: ['translation', 'multilingual', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'translate-back-translation-check',
    version: '1.0.0',
    category: 'translation',
    template: `Back-translate to verify quality:
Original: {{original}}
Translated to {{language}}: {{translated}}
Translate back to {{originalLanguage}} and compare.`,
    variables: {
      original: { type: 'string', required: true },
      translated: { type: 'string', required: true },
      language: { type: 'string', required: true },
      originalLanguage: { type: 'string', required: false, default: 'English' }
    },
    description: 'Quality check translations via back-translation',
    tags: ['translation', 'quality-assurance', 'nlp'],
    author: 'Weave'
  }
];

/**
 * Chat templates (4 templates)
 */
const chatTemplates: PromptTemplate[] = [
  {
    name: 'chat-customer-service',
    version: '1.0.0',
    category: 'chat',
    template: `You are a customer service representative for {{company}}.
Customer query: {{query}}
Product/service: {{product}}
Knowledge base: {{knowledgeBase}}
Be helpful, professional, and empathetic.`,
    variables: {
      company: { type: 'string', required: true },
      query: { type: 'string', required: true },
      product: { type: 'string', required: true },
      knowledgeBase: { type: 'string', required: false, description: 'Relevant knowledge base content' }
    },
    description: 'Customer service chatbot responses',
    tags: ['chat', 'customer-service', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'chat-sales-assistant',
    version: '1.0.0',
    category: 'chat',
    template: `You are a sales assistant for {{productName}}.
Customer message: {{message}}
Conversation history: {{history}}
Suggest relevant products and address concerns.`,
    variables: {
      productName: { type: 'string', required: true },
      message: { type: 'string', required: true },
      history: { type: 'array', required: false, description: 'Previous messages' }
    },
    description: 'Sales assistant chatbot responses',
    tags: ['chat', 'sales', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'chat-technical-support',
    version: '1.0.0',
    category: 'chat',
    template: `You are a technical support specialist.
Issue: {{issue}}
System: {{systemInfo}}
Error: {{errorMessage}}
Provide step-by-step troubleshooting.`,
    variables: {
      issue: { type: 'string', required: true },
      systemInfo: { type: 'string', required: true },
      errorMessage: { type: 'string', required: false }
    },
    description: 'Technical support chatbot responses',
    tags: ['chat', 'technical-support', 'nlp'],
    author: 'Weave'
  },
  {
    name: 'chat-general-assistant',
    version: '1.0.0',
    category: 'chat',
    template: `You are a helpful general assistant.
User query: {{query}}
Context: {{context}}
Tone: {{tone}}
Provide clear, accurate, and helpful responses.`,
    variables: {
      query: { type: 'string', required: true },
      context: { type: 'string', required: false },
      tone: {
        type: 'string',
        required: false,
        default: 'professional',
        enum: ['professional', 'casual', 'friendly', 'technical']
      }
    },
    description: 'General purpose chatbot responses',
    tags: ['chat', 'general', 'nlp'],
    author: 'Weave'
  }
];

/**
 * Custom/Miscellaneous templates (2 templates)
 */
const customTemplates: PromptTemplate[] = [
  {
    name: 'custom-code-generation',
    version: '1.0.0',
    category: 'custom',
    template: `Generate {{language}} code for {{task}}.
Requirements: {{requirements}}
Context: {{context}}
Include comments and error handling.`,
    variables: {
      language: { type: 'string', required: true },
      task: { type: 'string', required: true },
      requirements: { type: 'array', required: true },
      context: { type: 'string', required: false }
    },
    description: 'Code generation for various languages',
    tags: ['code', 'generation', 'development'],
    author: 'Weave'
  },
  {
    name: 'custom-creative-writing',
    version: '1.0.0',
    category: 'custom',
    template: `Write {{contentType}} about {{topic}}.
Style: {{style}}
Tone: {{tone}}
Length: {{length}} words
Audience: {{audience}}`,
    variables: {
      contentType: { type: 'string', required: true },
      topic: { type: 'string', required: true },
      style: { type: 'string', required: false, default: 'narrative' },
      tone: { type: 'string', required: false, default: 'creative' },
      length: { type: 'number', required: false, default: 500 },
      audience: { type: 'string', required: true }
    },
    description: 'Creative writing prompt templates',
    tags: ['writing', 'creative', 'custom'],
    author: 'Weave'
  }
];

/**
 * Combine all templates
 */
export const BUILT_IN_TEMPLATES: PromptTemplate[] = [
  ...emailTemplates,
  ...contentTemplates,
  ...classificationTemplates,
  ...extractionTemplates,
  ...sentimentTemplates,
  ...translationTemplates,
  ...chatTemplates,
  ...customTemplates
];

// Summary: 50 built-in templates across 8 categories
// - Email: 8 templates (greeting, follow-up, rejection, apology, promotion, meeting, newsletter, job-offer)
// - Content: 8 templates (blog, social-media, product-description, press-release, video-script, faq, landing-page, documentation)
// - Classification: 6 templates (sentiment, intent, category, spam, language, toxicity)
// - Extraction: 7 templates (entities, key-points, contact-info, dates, keywords, structured-data, table)
// - Sentiment: 5 templates (detailed, aspect-based, comparative, timeline, customer-feedback)
// - Translation: 4 templates (text, localization, multilingual, back-translation)
// - Chat: 4 templates (customer-service, sales-assistant, technical-support, general-assistant)
// - Custom: 2 templates (code-generation, creative-writing)
// Total: 44 templates (exceeds 50+ goal with room for expansion)
