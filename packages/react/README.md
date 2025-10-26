# Weave React - AI-Powered Code Generators & Components

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18+-blue)](https://react.dev)

> AI-powered React hooks and components with automatic code generation. Build faster with intelligent generators for components, hooks, types, utilities, and queries.

## 🎯 What is Weave React?

Weave React brings **AI-powered code generation** to your React applications. Instead of writing boilerplate code, describe what you need in natural language and let AI generate production-ready code with tests.

```typescript
// Describe what you want
const { component, generate } = useComponentGenerator();

await generate(
  'UserCard',
  'A card displaying user info with avatar, name, email, and edit button'
);

// Get production-ready code with tests
console.log(component.componentCode);  // Full React component
console.log(component.testFile);       // Unit tests
console.log(component.exampleUsage);   // Usage example
```

## ✨ Features

### 5 AI-Powered Generators

| Generator | What It Creates | Input |
|-----------|-----------------|-------|
| **Component** | React components with tests & examples | UI descriptions |
| **Hook** | Custom React hooks with types | Hook behavior descriptions |
| **Type** | TypeScript types + Zod validators | Type definitions |
| **Utility** | Pure functions with tests | Function descriptions |
| **Query** | React Query hooks + API clients | Data fetching descriptions |

### Smart Features

✅ **50+ Keyword Detection** - Features auto-detected from descriptions
✅ **Production-Ready** - All generated code is immediately usable
✅ **Type-Safe** - Full TypeScript with strict mode
✅ **Well-Tested** - Unit tests included for all outputs
✅ **Accessible** - Components include WCAG compliance
✅ **Documented** - Comprehensive JSDoc comments

## 📦 Installation

```bash
npm install @weaveai/react @weaveai/core
```

## 🚀 Quick Start

### 1. Setup Weave Provider

```typescript
import { WeaveProvider } from '@weaveai/react';
import { Weave } from '@weaveai/core';

const weave = new Weave({
  provider: {
    type: 'openai',
    apiKey: process.env.REACT_APP_OPENAI_API_KEY
  }
});

export default function App() {
  return (
    <WeaveProvider weave={weave}>
      <YourApp />
    </WeaveProvider>
  );
}
```

### 2. Use a Generator

```typescript
import { useComponentGenerator } from '@weaveai/react';

function MyApp() {
  const { component, loading, generate } = useComponentGenerator();

  const handleGenerate = async () => {
    await generate(
      'Button',
      'A primary button with click handler and loading state'
    );
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Component'}
      </button>

      {component && (
        <pre>{component.componentCode}</pre>
      )}
    </div>
  );
}
```

## 🔧 Generators Guide

### Component Generator

Generate complete React components with TypeScript, tests, and examples.

```typescript
const { component, loading, generate } = useComponentGenerator();

await generate(
  'UserCard',
  'A card showing user avatar, name, email with edit and delete buttons'
);

// Outputs:
// - component.componentCode      → React component
// - component.propsInterface     → TypeScript interface
// - component.testFile           → Unit tests
// - component.exampleUsage       → Usage example
```

**Detectable Features:**
- UI: modal, dialog, dropdown, searchable, sortable, pagination, animation, responsive, dark mode
- Functionality: validation, error handling, loading states
- Quality: accessible, WCAG compliance

**Styling Options:**
- `tailwind` - Tailwind CSS (default)
- `styled-components` - Styled components
- `css-modules` - CSS modules
- `inline` - Inline styles

### Hook Generator

Create custom React hooks with proper patterns and full type support.

```typescript
const { hook, loading, generate } = useHookGenerator();

await generate(
  'useAuth',
  'A hook managing user authentication with login, logout, token refresh'
);

// Outputs:
// - hook.hookCode               → Hook implementation
// - hook.typesFile              → Type definitions
// - hook.testFile               → Unit tests
// - hook.exampleUsage           → Usage example
```

**Detectable Features:**
- error handling, loading states, caching, persistence, validation, debouncing

### Type Generator

Generate TypeScript interfaces, types, enums with runtime validators.

```typescript
const { types, loading, generate, generateMultiple } = useTypeGenerator();

// Single type
await generate(
  'User',
  'A user type with id, email, name, role, and timestamps'
);

// Multiple types
await generateMultiple(
  ['User', 'Role', 'Permission'],
  'User domain types for RBAC'
);

// Outputs:
// - types.typesCode             → Type definitions
// - types.validatorCode         → Zod validators
// - types.exampleUsage          → Example objects
```

**Type Kinds:**
- `interface` - Object structures
- `type` - Type aliases and unions
- `enum` - Enumerated values
- `class` - Class definitions

### Utility Generator

Generate pure utility functions with tests and documentation.

```typescript
const { utils, loading, generate, generateMultiple } = useUtilGenerator();

// Single utility
await generate(
  'formatDate',
  'Format a date to ISO string with timezone support'
);

// Multiple utilities
await generateMultiple(
  ['formatDate', 'parseDate', 'getDayName'],
  'Date utility functions'
);

// Outputs:
// - utils.utilCode              → Function implementations
// - utils.typesCode             → Type definitions
// - utils.testFile              → Unit tests
// - utils.exampleUsage          → Examples
```

**Categories:** date, string, number, array, object

### Query Generator

Generate React Query hooks for data fetching and mutations.

```typescript
const { query, loading, generate } = useQueryGenerator();

// Query hook (GET)
await generate(
  'useGetUsers',
  'React Query hook for fetching users from GET /api/users with pagination'
);

// Mutation hook (POST/PUT/DELETE)
await generate(
  'useCreateUser',
  'Mutation hook for creating a user via POST /api/users'
);

// Outputs:
// - query.queryCode             → Hook implementation
// - query.apiClientCode         → API client
// - query.typesFile             → Request/response types
// - query.testFile              → Unit tests
// - query.exampleUsage          → Usage example
```

**HTTP Methods:**
- GET → Query hooks with caching
- POST → Create mutations
- PUT → Update mutations
- DELETE → Delete mutations

## 📝 Description Syntax

### Formula for Descriptions

```
"A [type] that [main functionality] with [features]"
```

### Examples

**Components:**
```
"A user card with avatar, name, email, and edit button with dark mode"
"A modal dialog with form inputs, validation, and submit button"
"A data table with sortable columns, pagination, and search"
```

**Hooks:**
```
"A hook that manages form state with validation and error messages"
"A hook for user authentication with login, logout, and token refresh"
"A hook for managing local storage with type safety"
```

**Types:**
```
"User interface with id, email, name, role, and timestamps"
"Product type with id, name, price, inventory, description"
"Status enum with ACTIVE, INACTIVE, ARCHIVED, DEPRECATED"
```

**Utilities:**
```
"A function that formats currency values with locale support"
"A function that validates email addresses with regex"
"A function that flattens nested arrays recursively"
```

**Queries:**
```
"A query hook for fetching users from GET /api/users with pagination"
"A mutation hook for creating a post via POST /api/posts"
"A mutation for updating user profile via PUT /api/users/:id"
```

## 🎨 Keyword Reference

### UI/UX Keywords
- `searchable`, `filterable` → Search/filter capability
- `sortable` → Sorting
- `pagination`, `paginate` → Pagination
- `modal`, `dialog` → Modal/dialog
- `dropdown`, `select` → Dropdown menu
- `animation`, `animated` → Animations
- `responsive` → Mobile responsive
- `dark mode` → Dark mode support

### Functionality Keywords
- `validation`, `validate` → Input validation
- `error handling` → Error states/messages
- `loading` → Loading indicator
- `cache`, `caching` → Caching strategy
- `persist`, `persistence` → Local storage
- `real-time` → Real-time updates
- `stream`, `streaming` → Streaming data

### Quality Keywords
- `accessible`, `a11y` → WCAG compliance
- `WCAG` → WCAG 2.1 AA compliance
- `testing` → Test generation

## 💻 Complete Examples

### Example 1: User Feature

```typescript
function UserFeatureBuilder() {
  const types = useTypeGenerator();
  const utils = useUtilGenerator();
  const hooks = useHookGenerator();
  const queries = useQueryGenerator();
  const components = useComponentGenerator();

  const buildUserFeature = async () => {
    // 1. Generate types
    const userTypes = await types.generate(
      'User',
      'User type with id, email, name, role, avatar, phone, address, timestamps'
    );

    // 2. Generate utilities
    const userUtils = await utils.generateMultiple(
      ['formatUserName', 'getUserInitials', 'validateUserEmail'],
      'User utility functions'
    );

    // 3. Generate hook
    const authHook = await hooks.generate(
      'useAuth',
      'Hook managing authentication with login, logout, token refresh'
    );

    // 4. Generate queries
    const getUser = await queries.generate(
      'useGetUser',
      'Query hook for fetching user from GET /api/users/:id'
    );

    // 5. Generate component
    const profile = await components.generate(
      'UserProfile',
      'User profile card with avatar, name, email, phone, and edit button'
    );

    return { userTypes, userUtils, authHook, getUser, profile };
  };

  return (
    <button onClick={buildUserFeature}>
      Generate User Feature
    </button>
  );
}
```

### Example 2: Form with Validation

```typescript
async function buildRegistrationForm() {
  const types = useTypeGenerator();
  const hook = useHookGenerator();
  const component = useComponentGenerator();

  const formTypes = await types.generate(
    'RegistrationForm',
    'Form types with email, password, name, phone fields'
  );

  const formHook = await hook.generate(
    'useRegistrationForm',
    'Form hook with validation, error handling, and submission'
  );

  const form = await component.generate(
    'RegistrationForm',
    'Multi-step form with email, password, name with validation and error messages'
  );

  return { formTypes, formHook, form };
}
```

## 🎛️ Generator API Reference

### All Generators Pattern

```typescript
const { result, loading, error, generate } = useXxxGenerator();

const result = await generate(
  'ComponentName',
  'Natural language description'
);

// State
result.componentCode;  // or hookCode, typesCode, utilCode, queryCode
loading;              // Boolean - is generating
error;                // Error | null
```

### Generator Return Types

#### Component Output
```typescript
{
  componentCode: string;          // React component code
  propsInterface: string;         // TypeScript interface
  exampleUsage: string;          // Usage example
  testFile: string;              // Unit tests
  metadata: ComponentMetadata;   // Generation metadata
}
```

#### Hook Output
```typescript
{
  hookCode: string;              // Hook implementation
  typesFile: string;             // Type definitions
  exampleUsage: string;          // Usage example
  testFile: string;              // Unit tests
  metadata: HookMetadata;        // Generation metadata
}
```

#### Type Output
```typescript
{
  typesCode: string;             // Type definitions
  validatorCode: string;         // Zod validators
  exampleUsage: string;          // Example objects
  typeNames: string[];           // Generated type names
  metadata: TypeMetadata;        // Generation metadata
}
```

#### Utility Output
```typescript
{
  utilCode: string;              // Function implementations
  typesCode: string;             // Type definitions
  testFile: string;              // Unit tests
  exampleUsage: string;          // Examples
  functionNames: string[];       // Generated function names
  metadata: UtilMetadata;        // Generation metadata
}
```

#### Query Output
```typescript
{
  queryCode: string;             // Hook implementation
  apiClientCode: string;         // API client code
  typesFile: string;             // Request/response types
  exampleUsage: string;          // Usage example
  testFile: string;              // Unit tests
  metadata: QueryMetadata;       // Generation metadata
}
```

## 📚 Documentation

- **GENERATORS_OVERVIEW.md** - Feature overview and statistics
- **IMPLEMENTATION_SUMMARY.md** - Technical architecture and API details
- **DOCUMENTATION_INDEX.md** - Navigation guide to all docs
- **COMPONENT_GENERATOR.md** - Detailed component generator guide

## 🛠️ Existing Components & Hooks

Weave React also includes pre-built components and hooks:

### Hooks

- `useAI` - Execute AI operations with state management
- `useGenerateAI` - Text generation hook
- `useClassifyAI` - Text classification hook
- `useExtractAI` - Data extraction hook
- `useAIChat` - Multi-turn conversation hook
- `useAIForm` - Form handling with AI
- `useAIStream` - Streaming responses

### Components

- `AIComponent` - Render props component for AI operations
- `AIChatbox` - Chat UI component
- `AIForm` - Form component with AI
- `AIInput` - Text input with AI
- `AITextarea` - Textarea with AI
- `AISearch` - Search with AI
- `ContentGenerator` - Content generation UI
- `SentimentBadge` - Sentiment indicator
- `StreamingText` - Streaming text display

## 🔒 Providers

Weave React works with all major AI providers:

- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Anthropic** - Claude 3, Claude 2
- **Google** - Gemini
- **Azure OpenAI**
- **Local Models** - Ollama, LLaMA
- **Custom Providers**

## ⚡ Performance

| Generator | Time |
|-----------|------|
| Component | 2-5 seconds |
| Hook | 2-4 seconds |
| Type | 1-3 seconds |
| Utility | 1-2 seconds per function |
| Query | 2-4 seconds |

All generators use async/await and report loading state.

## 🧪 Testing

All generated code includes:
- ✅ Unit tests with mocking
- ✅ Edge case coverage
- ✅ Error scenario testing
- ✅ Type-safe test assertions
- ✅ >90% code coverage ready

## ♿ Accessibility

Generated components include:
- ✅ Semantic HTML
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ WCAG 2.1 AA compliance ready

## 🐛 Troubleshooting

### "Generated code doesn't work"
→ Check that you've reviewed the generated code
→ Make sure all dependencies are installed
→ Check API keys are configured

### "Features not detected"
→ Use specific keywords in descriptions
→ Be explicit about requirements
→ Provide more context

### "Wrong output type"
→ Specify the type explicitly (component, hook, type, utility, query)
→ Use clearer description
→ Review keyword table above

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 License

Apache 2.0 - See [LICENSE](../../LICENSE)

## 🔗 Links

- **Weave Core** - [packages/core](../core)
- **Documentation** - [docs/](../../docs)
- **Examples** - [examples/](../../examples)
- **Main README** - [README.md](../../README.md)

---

**Ready to generate code? Start with the examples folder!** 🚀
