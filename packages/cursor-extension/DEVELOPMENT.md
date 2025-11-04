# Weave AI Assistant for Cursor - Development Guide

## Project Structure

```
packages/cursor-extension/
├── src/
│   ├── extension.ts                 # Main extension entry point
│   ├── assistant/
│   │   └── cursorWeaveAssistant.ts # Core AI service with chat support
│   ├── config/
│   │   └── configManager.ts        # Configuration management
│   ├── commands/
│   │   └── cursorCommandHandler.ts # Command handlers
│   ├── providers/
│   │   └── chatProvider.ts         # Chat webview provider
│   └── ui/
│       └── statusBar.ts            # Status bar UI
├── snippets/                        # Code snippets
│   ├── typescript.json
│   ├── javascript.json
│   └── python.json
├── media/                           # Extension media (icons, images)
├── package.json                     # Extension manifest
├── tsconfig.json                    # TypeScript configuration
├── README.md                        # User documentation
├── DEVELOPMENT.md                   # This file
└── .vscodeignore                    # Files to exclude from package
```

## Architecture

### Core Components

#### 1. **CursorWeaveAssistant** (`src/assistant/cursorWeaveAssistant.ts`)
The main AI service handling all Weave operations.

**Key Methods:**
- `initialize()` - Initialize the assistant with configuration
- `sendChatMessage(message)` - Send message to AI and get response
- `inlineEdit(code, instruction, context)` - Edit code with AI
- `analyzeCode(context)` - Analyze code quality
- `suggestOptimization(context)` - Get optimization suggestions
- `generatePrompt(context)` - Generate AI-optimized prompt
- `generateDocumentation(context)` - Generate code docs
- `refactorCode(code, pattern, context)` - Refactor with patterns

**Chat Management:**
- Maintains `chatHistory` with max 50 messages
- `getChatHistory()` - Retrieve conversation history
- `clearChatHistory()` - Clear all messages

#### 2. **ConfigurationManager** (`src/config/configManager.ts`)
Manages VS Code workspace configuration for Weave.

**Key Configuration:**
```typescript
interface CursorWeaveConfig {
  enabled: boolean;
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  enableChat: boolean;
  enableInlineEdit: boolean;
  languageScope: string[];
  cursorFeatures: {
    chat: boolean;
    inlineEdit: boolean;
    autoComplete: boolean;
    docGeneration: boolean;
    refactoring: boolean;
  };
}
```

**Default Settings (Cursor-Optimized):**
- Provider: `anthropic`
- Model: `claude-3-opus-20240229`
- maxTokens: `2000`
- temperature: `0.7`

#### 3. **CursorCommandHandler** (`src/commands/cursorCommandHandler.ts`)
Implements all user-triggered commands.

**Command Methods:**
- `openChat()` - Open native chat panel
- `inlineEdit()` - Edit selected code
- `generatePrompt()` - Generate prompt
- `analyzeCode()` - Analyze code
- `suggestOptimization()` - Get optimization suggestions
- `toggleAIFeatures()` - Enable/disable features

#### 4. **CursorChatProvider** (`src/providers/chatProvider.ts`)
Manages the webview-based chat interface.

**Key Features:**
- Real-time message handling
- Chat history management
- Message formatting
- Copy to clipboard
- Auto-scroll functionality

#### 5. **StatusBarManager** (`src/ui/statusBar.ts`)
Displays extension status in VS Code status bar.

**Status States:**
- `setReady()` - Extension ready (green check)
- `setLoading()` - Loading state
- `setActive()` - Active operation (lightbulb)
- `setInactive()` - Disabled state
- `setChatting()` - Chat in progress

### Extension Lifecycle

```typescript
activate(context)
  ├── Initialize ConfigurationManager
  ├── Create StatusBarManager
  ├── Initialize CursorWeaveAssistant
  ├── Create CursorChatProvider
  ├── Register CursorCommandHandler
  ├── Register all commands
  ├── Register webview provider
  ├── Register event listeners
  └── Set status to ready

deactivate()
  ├── Dispose assistant
  └── Dispose status bar
```

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- VS Code or Cursor IDE

### Installation

```bash
# From project root
cd packages/cursor-extension

# Install dependencies
npm install

# Build TypeScript
npm run compile

# Watch for changes
npm run watch
```

### Testing in Development

```bash
# Open in VS Code extension development environment
npm run vscode:prepublish

# Run tests
npm test

# Lint code
npm run lint
```

## API Integration

### Supported Providers

1. **Anthropic (Default)**
   - Model: `claude-3-opus-20240229`
   - Higher token limit: 2000
   - Optimized for Cursor IDE

2. **OpenAI**
   - Model: `gpt-4` or `gpt-3.5-turbo`
   - Token limit: 1000 (configurable)

3. **Local**
   - Custom endpoint support
   - No API key required
   - Full privacy

### API Call Flow

```
User Input
    ↓
Command Handler
    ↓
CursorWeaveAssistant
    ↓
Provider Router (configManager.getProvider())
    ↓
API Call
    ↓
Response Processing
    ↓
Display Result
```

## Configuration Schema

### Cursor-Specific Settings

```json
{
  "weave.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable/disable Weave AI features"
  },
  "weave.provider": {
    "type": "string",
    "enum": ["anthropic", "openai", "local"],
    "default": "anthropic",
    "description": "AI provider (Cursor optimized for Anthropic)"
  },
  "weave.model": {
    "type": "string",
    "default": "claude-3-opus-20240229",
    "description": "Claude model to use"
  },
  "weave.apiKey": {
    "type": "string",
    "description": "Anthropic API key for Weave"
  },
  "weave.temperature": {
    "type": "number",
    "default": 0.7,
    "minimum": 0,
    "maximum": 2,
    "description": "Temperature for AI responses"
  },
  "weave.maxTokens": {
    "type": "number",
    "default": 2000,
    "minimum": 100,
    "description": "Maximum tokens per response"
  },
  "weave.cursorFeatures": {
    "type": "object",
    "default": {
      "chat": true,
      "inlineEdit": true,
      "autoComplete": true,
      "docGeneration": true,
      "refactoring": true
    },
    "description": "Enable/disable Cursor-specific features"
  }
}
```

## Webview Communication

### Message Types from Webview to Extension

```typescript
{
  command: 'sendMessage',
  text: string  // Chat message
}

{
  command: 'clearHistory'  // Clear chat history
}
```

### Message Types from Extension to Webview

```typescript
{
  command: 'messageReceived',
  response: string,
  history: ChatMessage[]
}

{
  command: 'error',
  message: string
}

{
  command: 'historyCleared'
}
```

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing API key
   - Invalid provider
   - Invalid model

2. **API Errors**
   - Network failures
   - Rate limiting
   - Invalid responses

3. **UI Errors**
   - No active editor
   - Empty selection
   - Invalid input

### Error Recovery

```typescript
try {
  const result = await this.weaveAssistant.sendChatMessage(userMessage);
  this.panel?.webview.postMessage({ command: 'messageReceived', response: result });
} catch (error) {
  this.panel?.webview.postMessage({
    command: 'error',
    message: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

Test file operations and command execution:
```typescript
// Test chat functionality
await weaveAssistant.initialize();
const response = await weaveAssistant.sendChatMessage('Hello');
assert(response.length > 0);

// Test inline editing
const edited = await weaveAssistant.inlineEdit(code, instruction, context);
assert(edited !== code);
```

### Manual Testing

1. **Chat Feature**
   - Open chat: `Ctrl+Shift+/`
   - Send multiple messages
   - Verify history displays
   - Test clear history

2. **Inline Edit**
   - Select code
   - Press `Ctrl+K Ctrl+I`
   - Enter instruction
   - Verify code replacement

3. **Code Analysis**
   - Select code
   - Run analyze command
   - Verify analysis displays

## Performance Considerations

### Token Management
- Default limit: 2000 tokens
- Higher for detailed responses
- Can be reduced to control costs

### Chat History
- Maximum 50 messages
- Auto-removes oldest when limit exceeded
- Can be manually cleared

### API Caching
- Currently not implemented
- Consider for frequently asked questions
- Balance between freshness and performance

## Security Considerations

### API Key Handling
```typescript
// ✅ Secure: Use VS Code's configuration storage
const apiKey = this.config.getApiKey();

// ❌ Avoid: Logging sensitive data
console.log('API Key:', apiKey);  // Don't do this!
```

### Code Transmission
- Code is sent to configured AI provider
- Refer to provider's privacy policy
- Users should be aware of data handling

### Input Validation
```typescript
// Validate user input before sending
const message = userMessage.trim();
if (!message || message.length === 0) {
  throw new Error('Empty message');
}
```

## Keyboard Shortcuts

### Custom Keybindings

Add to `keybindings.json`:
```json
{
  "key": "ctrl+shift+/",
  "command": "weave.cursorChat",
  "when": "editorTextFocus"
},
{
  "key": "ctrl+k ctrl+i",
  "command": "weave.inlineEdit",
  "when": "editorTextFocus && editorHasSelection"
}
```

## Code Snippets

### Chat Example

```typescript
// TypeScript snippet for Weave chat
import { CursorWeaveAssistant } from '@weaveai/cursor';

const assistant = new CursorWeaveAssistant(config);
await assistant.initialize();

const response = await assistant.sendChatMessage('How do I optimize this code?');
console.log(response);
```

### Inline Edit Example

```typescript
const edited = await assistant.inlineEdit(
  `function add(a, b) { return a + b; }`,
  'Add TypeScript types',
  context
);
// Result: function add(a: number, b: number): number { return a + b; }
```

## Debugging

### Enable Debug Mode

```typescript
// In extension.ts
const DEBUG = true;
if (DEBUG) {
  console.log('Weave assistant initialized');
}
```

### View Extension Output

```
View → Output → Weave
```

### Inspect Messages

```typescript
this.panel.webview.onDidReceiveMessage((message) => {
  console.log('Webview message:', message);
});
```

## Building for Distribution

```bash
# Install vsce
npm install -g vsce

# Build .vsix package
vsce package

# Publish to VS Code marketplace
vsce publish
```

## Versioning

- Major: New features breaking existing API
- Minor: New features, backward compatible
- Patch: Bug fixes

Current version: See `package.json`

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments to public APIs

### Testing
- Write tests for new features
- Maintain >80% code coverage
- Test error cases

### Documentation
- Update README for user-facing changes
- Update DEVELOPMENT.md for technical changes
- Include examples for new features

## Troubleshooting Development

### Extension won't activate
1. Check `activationEvents` in package.json
2. Verify extension context is created
3. Check console for errors

### Chat panel not responding
1. Check webview HTML content
2. Verify message event listeners
3. Check VS Code version compatibility

### Commands not working
1. Verify commands registered in activate()
2. Check `contributes.commands` in package.json
3. Reload extension (Ctrl+Shift+P → "Reload Window")

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Cursor IDE Documentation](https://www.cursor.com/)

## Support

For issues and feature requests:
- [GitHub Issues](https://github.com/kitium-ai/weave/issues)
- [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)

---

**Happy Coding with Weave!** 🚀
