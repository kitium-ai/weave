# Weave AI Assistant Extension - Development Guide

## Overview

This document provides information for developers working on or extending the Weave AI Assistant VS Code extension.

## Project Structure

```
packages/vscode-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── assistant/
│   │   └── weaveAssistant.ts     # Core AI assistant service
│   ├── commands/
│   │   └── commandHandler.ts     # Command implementations
│   ├── config/
│   │   └── configManager.ts      # Configuration management
│   ├── providers/
│   │   ├── completionProvider.ts # Code completion
│   │   └── codeLensProvider.ts   # Code lens implementation
│   └── ui/
│       └── statusBar.ts          # Status bar management
├── snippets/
│   ├── typescript.json           # TypeScript snippets
│   ├── javascript.json           # JavaScript snippets
│   └── python.json               # Python snippets
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── README.md                     # User documentation
├── CHANGELOG.md                  # Version history
└── LICENSE                       # Apache 2.0 License
```

## Getting Started

### Prerequisites
- Node.js 18+
- VS Code 1.90.0+
- TypeScript 5.0+

### Setup

1. Install dependencies:
```bash
cd packages/vscode-extension
npm install
```

2. Compile TypeScript:
```bash
npm run compile
```

3. Watch mode for development:
```bash
npm run watch
```

4. Run tests:
```bash
npm run test
```

## Development Workflow

### Building the Extension

```bash
# Compile TypeScript
npm run compile

# Package for distribution
npm run package

# Publish to VS Code Marketplace
npm run publish
```

### Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

### Linting

```bash
# Run ESLint
npm run lint

# Format code
npx prettier --write src/
```

## Architecture

### Core Components

#### 1. Extension (extension.ts)
- Entry point for the VS Code extension
- Handles activation and deactivation
- Registers commands, providers, and event listeners
- Manages the overall extension lifecycle

#### 2. Weave Assistant (assistant/weaveAssistant.ts)
- Core service for AI operations
- Provides methods for:
  - `generatePrompt()`: Generate optimized prompts
  - `analyzeCode()`: Analyze code quality
  - `suggestOptimization()`: Suggest improvements
  - `generateCompletion()`: AI code completion
  - `generateDocumentation()`: Generate code docs
- Handles API communication

#### 3. Configuration Manager (config/configManager.ts)
- Manages extension configuration
- Reads/writes VS Code settings
- Validates configuration
- Provides getters for all settings

#### 4. Command Handler (commands/commandHandler.ts)
- Implements all extension commands
- Handles user interactions
- Shows results to users
- Manages UI updates

#### 5. Providers
- **CodeCompletionProvider**: Registers completion items
- **CodeLensProvider**: Provides inline code actions

#### 6. UI Components
- **StatusBarManager**: Manages extension status display

### Data Flow

```
User Action
    ↓
Command Handler
    ↓
Weave Assistant
    ↓
API Call (OpenAI/Anthropic/Local)
    ↓
Result Processing
    ↓
UI Display (Panel/Inline/StatusBar)
```

## Adding New Features

### Adding a New Command

1. Add command to `package.json`:
```json
{
  "command": "weave.newCommand",
  "title": "Weave: New Command",
  "description": "Description of what it does"
}
```

2. Implement in CommandHandler:
```typescript
async newCommand(): Promise<void> {
  // Implementation
}
```

3. Register in extension.ts:
```typescript
context.subscriptions.push(
  vscode.commands.registerCommand(
    'weave.newCommand',
    () => commandHandler.newCommand()
  )
);
```

### Adding a New Provider

1. Create provider class implementing VS Code provider interface
2. Register in extension.ts:
```typescript
context.subscriptions.push(
  vscode.languages.registerXxxProvider(language, provider)
);
```

### Adding New Snippets

1. Add to appropriate file in `snippets/` directory:
```json
{
  "Snippet Name": {
    "prefix": "snippet-prefix",
    "body": ["line 1", "line 2"],
    "description": "What it does"
  }
}
```

2. Update `package.json` contributions if needed

## Configuration

### Settings Schema

Settings are defined in `package.json` under `contributes.configuration`:

```json
{
  "weave.setting": {
    "type": "string",
    "default": "value",
    "description": "Human-readable description"
  }
}
```

### Reading Settings

```typescript
const config = vscode.workspace.getConfiguration('weave');
const value = config.get<string>('setting', 'default');
```

## Testing

### Unit Tests
- Located in `src/test/` (to be created)
- Use Mocha test framework
- Run with `npm run test`

### Integration Tests
- Use VS Code's testing framework
- Test extension activation and commands

### Manual Testing
1. Open extension in VS Code
2. Press F5 to launch extension development window
3. Test features manually
4. Check debug console for logs

## API Integration

### Current Implementation
The extension currently uses mock API calls. To integrate with real Weave API:

1. Update `weaveAssistant.ts` `callWeaveAPI()` method
2. Add API client initialization
3. Implement actual API calls instead of mock responses

### Example Integration
```typescript
private async callWeaveAPI(...): Promise<WeaveAnalysisResult> {
  const response = await fetch('https://api.weave.ai/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ /* payload */ })
  });

  const data = await response.json();
  return {
    type: 'analysis',
    content: data.result,
    timestamp: new Date()
  };
}
```

## Debugging

### Enable Debug Logging
```typescript
console.log('Debug message'); // Visible in Extension Development Host console
```

### Launch Debugger
1. Set breakpoint in code
2. Press F5 to launch
3. Breakpoints will be hit in VS Code debugger

### VS Code Developer Tools
- View logs: View → Output → Weave AI Assistant
- Check performance: Command Palette → Developer: Show Running Extensions

## Dependencies

### Production
- `@weaveai/core`: Core Weave framework

### Development
- `@types/vscode`: VS Code API types
- `@typescript-eslint/*`: TypeScript linting
- `typescript`: TypeScript compiler
- `mocha`: Testing framework
- `vsce`: VS Code extension packaging

## Performance Considerations

1. **Async Operations**: All API calls are async to prevent UI blocking
2. **Caching**: Consider caching results for repeated requests
3. **Throttling**: Throttle real-time analysis to prevent overload
4. **Memory**: Clean up resources in dispose() methods

## Security

1. **API Keys**:
   - Never log API keys
   - Store in VS Code secure storage
   - Use environment variables in development

2. **User Input**:
   - Sanitize code before sending to API
   - Validate configuration values

3. **Network**:
   - Use HTTPS for API calls
   - Implement request timeouts
   - Handle error responses

## Publishing

### Prepare for Publishing
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Build extension: `npm run compile`
4. Create README documentation
5. Add icon and screenshots

### Publish to VS Code Marketplace
```bash
npm install -g @vscode/vsce
vsce publish
```

### Publish to OpenVSX (Open Source Marketplace)
```bash
npx ovsx publish
```

## Troubleshooting

### Extension Not Activating
- Check activation events in package.json
- Verify no errors in debug console
- Check language scope configuration

### Commands Not Appearing
- Verify command registration in extension.ts
- Check package.json contributes.commands
- Reload VS Code window

### API Calls Failing
- Check API key configuration
- Verify provider selection
- Check network connection
- Review API error responses

## Contributing

1. Create feature branch
2. Make changes following code style
3. Add tests for new features
4. Update documentation
5. Submit pull request

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Weave Framework Documentation](https://github.com/kitium-ai/weave)
- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## License

Apache License 2.0 - See LICENSE file
