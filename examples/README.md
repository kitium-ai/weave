# Weave Examples

Comprehensive examples demonstrating how to use Weave across different frameworks and platforms.

## 🎯 Featured Sample App

### [Weave Scaffolding Sample App](./scaffold-sample-app/) 🚀

A **complete, production-ready full-stack application** showcasing best practices:

- **Content Generation Platform** with multi-provider AI support
- Real-time streaming responses with progress tracking
- Cost tracking and budget management
- Prompt versioning and A/B testing
- Caching strategies and optimization
- Comprehensive error handling and retry logic
- Detailed documentation and quick reference guides

**Perfect for learning best practices!** Start here if you want to understand how to build a complete Weave application.

```bash
cd scaffold-sample-app
npm install
npm run dev
```

See [scaffold-sample-app/README.md](./scaffold-sample-app/README.md) and [scaffold-sample-app/QUICK_REFERENCE.md](./scaffold-sample-app/QUICK_REFERENCE.md) for details.

---

## 📚 Examples by Framework

### Frontend Frameworks

#### 🎨 [React Chat App](./react-chat-app/)

**Location**: `examples/react-chat-app/App.tsx`

A complete React chat application demonstrating:

- React hooks integration with Weave
- `useAIChat` hook for multi-turn conversations
- Context API for state management
- Real-time message streaming
- Error handling and loading states

**Key Features**:

- Auto-scroll to latest messages
- Keyboard shortcuts (Shift+Enter for newline)
- Typing indicator animation
- Responsive design

**Dependencies**: React 18.x, @weaveai/react

---

#### 🖖 [Vue 3 Chat App](./vue-chat-app/)

**Location**: `examples/vue-chat-app/`

A Vue 3 chat application using Composition API:

- `useAI` composable from @weaveai/vue
- Reactive state management with ref and computed
- Provide/inject for dependency injection
- Smooth animations and transitions

**Key Features**:

- Vue 3 Composition API patterns
- TypeScript support
- Responsive component architecture
- Real-time UI updates

**Files**:

- `main.ts` - Application entry point with Weave initialization
- `App.vue` - Main chat component

**Dependencies**: Vue 3.x, @weaveai/vue

---

#### ⚡ [Svelte Chat App](./svelte-chat-app/)

**Location**: `examples/svelte-chat-app/App.svelte`

A Svelte chat application demonstrating:

- Svelte stores for state management
- `createAIChat` store factory from @weaveai/svelte
- Reactive declarations and bindings
- Scoped styling with animations

**Key Features**:

- Minimal boilerplate
- Built-in reactivity
- Smooth component transitions
- Efficient DOM updates

**Dependencies**: Svelte 4.x, @weaveai/svelte

---

#### 🅰️ [Angular Chat App](./angular-chat-app/)

**Location**: `examples/angular-chat-app/chat.component.ts`

An Angular chat component featuring:

- AIService from @weaveai/angular
- RxJS Observables for async operations
- Angular dependency injection
- Component lifecycle management

**Key Features**:

- Observable-based state management
- Service-oriented architecture
- Type-safe RxJS patterns
- Proper memory management

**Files**:

- `chat.component.ts` - Chat component with service integration
- `chat.component.html` - Template (to be created)
- `chat.component.css` - Styles (to be created)

**Dependencies**: Angular 17.x+, @weaveai/angular, RxJS

---

### Mobile Frameworks

#### 📱 [React Native Chat App](./react-native-chat-app/)

**Location**: `examples/react-native-chat-app/ChatScreen.tsx`

A React Native mobile chat application:

- `useAI` hook adapted for mobile
- Native UI components (ScrollView, TextInput, etc.)
- Memory leak prevention with isMounted ref
- Touch-friendly interface

**Key Features**:

- Cross-platform iOS/Android support
- Optimized for mobile performance
- Gesture handling
- Platform-specific styling

**Dependencies**: React Native 0.71.x+, @weaveai/react-native

---

#### 🐦 [Flutter Chat App](./flutter-chat-app/)

**Location**: `examples/flutter-chat-app/lib/screens/chat_screen.dart`

A Flutter mobile chat application:

- Provider package for state management
- AI provider with ChangeNotifier pattern
- Material Design UI
- Dart async/await patterns

**Key Features**:

- Beautiful Material Design interface
- Smooth animations
- Responsive layout
- Cross-platform (iOS, Android, Web)

**Files**:

- `lib/screens/chat_screen.dart` - Main chat screen
- `lib/providers/ai_provider.dart` - State management provider
- `pubspec.yaml` - Package dependencies

**Dependencies**: Flutter SDK, Provider 6.x+, weave_flutter

---

### Backend Frameworks

#### 🟢 [Node.js/Express API](./nodejs-express-api/)

**Location**: `examples/nodejs-express-api/app.ts`

An Express.js REST API server:

- Weave middleware integration
- Multiple endpoints for different AI operations
- Error handling and validation
- Production-ready patterns

**Key Endpoints**:

- `POST /api/chat` - Multi-turn chat
- `POST /api/generate` - Text generation
- `POST /api/classify` - Text classification
- `POST /api/extract` - Data extraction
- `GET /health` - Health check

**Key Features**:

- Middleware-based architecture
- Type-safe TypeScript implementation
- Comprehensive error handling
- Rate limit detection

**Dependencies**: Express 4.x, @weaveai/nodejs

**Running**:

```bash
cd examples/nodejs-express-api
npm install
npm run dev
```

---

#### ⚡ [Next.js API Routes](./nextjs-api/)

**Location**: `examples/nextjs-api/pages/api/chat.ts`

A Next.js serverless API:

- Next.js API route handlers
- Serverless deployment ready
- Automatic request/response handling
- Built-in middleware support

**Key Features**:

- Zero-configuration deployment
- Automatic scaling
- Built-in caching
- Edge function support

**Dependencies**: Next.js 14.x+, @weaveai/nextjs

---

#### 🔷 [Next.js Pages Router Chat](./nextjs-pages-app/)

**Location**: `examples/nextjs-pages-app/pages/chat.tsx`

A Next.js full-stack chat application:

- Client-side React component
- Server-side API integration
- Integrated styling with styled-jsx
- Server-side rendering support

**Key Features**:

- Full-stack TypeScript
- Integrated frontend and backend
- Built-in CSS support
- Incremental Static Regeneration

**Dependencies**: Next.js 14.x+, @weaveai/react

**Running**:

```bash
cd examples/nextjs-pages-app
npm install
npm run dev
# Open http://localhost:3000/chat
```

---

#### 🎯 [NestJS API](./nestjs-api/)

**Location**: `examples/nestjs-api/src/weave/weave.controller.ts`

A NestJS microservices API:

- Module-based architecture
- Dependency injection
- Service layer pattern
- OpenAPI/Swagger support

**Key Features**:

- Enterprise-grade structure
- Modular design
- Built-in validation pipes
- Comprehensive logging

**Dependencies**: NestJS 10.x+, @weaveai/nestjs

---

## 🚀 Running the Examples

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- API keys for your chosen provider (OpenAI, Anthropic, Google, etc.)

### Installation

```bash
# Install dependencies at the root
cd weave
npm install

# Or for specific example
cd examples/react-chat-app
npm install
```

### Environment Setup

Create a `.env.local` file in the example directory:

```bash
# For OpenAI
REACT_APP_OPENAI_API_KEY=sk_...
VITE_OPENAI_API_KEY=sk_...
OPENAI_API_KEY=sk_...

# For Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# For Google
GOOGLE_API_KEY=AIza...
```

### Running Examples

**React**:

```bash
cd examples/react-chat-app
npm install
npm run dev
```

**Vue**:

```bash
cd examples/vue-chat-app
npm install
npm run dev
```

**Svelte**:

```bash
cd examples/svelte-chat-app
npm install
npm run dev
```

**Angular**:

```bash
cd examples/angular-chat-app
npm install
ng serve
```

**Next.js**:

```bash
cd examples/nextjs-pages-app
npm install
npm run dev
```

**NestJS**:

```bash
cd examples/nestjs-api
npm install
npm run start:dev
```

**React Native**:

```bash
cd examples/react-native-chat-app
npm install
npm start
```

**Flutter**:

```bash
cd examples/flutter-chat-app
flutter pub get
flutter run
```

---

## 📖 Learning Path

1. **Start Here**: [Scaffolding Sample App](./scaffold-sample-app/) - Complete production example
2. **Start Simple**: React Chat App
3. **Explore Frontend**: Try Vue, Svelte, Angular
4. **Go Mobile**: React Native or Flutter
5. **Build Backend**: Node.js/Express or NestJS
6. **Full Stack**: Next.js Pages App

**Recommended**: Start with the Scaffolding Sample App to understand patterns, then explore specialized examples for your framework.

---

## 🔗 API Integration

All examples follow these patterns:

### Initialize Weave

```typescript
import { createWeave } from '@weaveai/core';
import { OpenAIProvider } from '@weaveai/core/providers';

const weave = createWeave({
  provider: new OpenAIProvider({
    apiKey: process.env.API_KEY,
    model: 'gpt-4',
  }),
});
```

### Use with Framework

Each framework has a specific integration pattern - see the example files for details.

### Make API Calls

```typescript
const response = await weave.generate(prompt);
const classified = await weave.classify(text, labels);
const extracted = await weave.extract(text, schema);
```

---

## 🐛 Troubleshooting

### API Key Errors

- Check that your API key is set in environment variables
- Ensure the key has the correct permissions
- Verify the API key hasn't expired

### Module Not Found Errors

- Run `npm install` or `yarn install`
- Ensure you're in the correct directory
- Check that all @weaveai/\* packages are installed

### TypeScript Errors

- Run `npm run type-check` to identify issues
- Ensure TypeScript is installed: `npm install -D typescript`
- Check tsconfig.json is properly configured

---

## 📚 Additional Resources

- [Main Documentation](../docs/GETTING_STARTED.md)
- [API Reference](../docs/API_REFERENCE.md)
- [Best Practices](../docs/BEST_PRACTICES.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)

---

## 🤝 Contributing

To add a new example:

1. Create a new directory: `examples/your-framework-app/`
2. Add implementation files
3. Create a README with setup instructions
4. Update this main README with a link to your example

---

## 📄 License

All examples are provided under the Apache 2.0 License.
