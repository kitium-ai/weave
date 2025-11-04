# Weave AI Assistant

A powerful VS Code extension for the [Weave AI Framework](https://github.com/kitium-ai/weave). Weave AI Assistant brings intelligent code assistance directly to your editor, powered by the Weave framework's AI capabilities.

## Features

### 🤖 AI-Powered Code Analysis
- **Generate Optimized Prompts**: Select code and generate optimized prompts for AI models
- **Code Analysis**: Get AI-powered insights about your code quality and potential issues
- **Optimization Suggestions**: Receive actionable suggestions for code optimization
- **Smart Code Completion**: AI-powered code completions based on context

### 🎯 Framework Integration
- Support for TypeScript, JavaScript, and Python
- Seamless integration with Weave operations (generate, classify, extract)
- Built-in code templates for common Weave patterns
- Real-time code lens insights

### ⚙️ Flexible Configuration
- Easy API key configuration (supports OpenAI, Anthropic, local models)
- Customizable temperature and token limits
- Per-language scope configuration
- Toggle inline hints and code lens features

### 📚 Productivity Features
- Quick template insertion for Weave code patterns
- Documentation quick-links
- Result panel with copy-to-clipboard functionality
- Configurable keyboard shortcuts

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Weave AI Assistant"
4. Click Install

Or install from the command line:
```bash
code --install-extension KitiumAI.weave-assistant
```

## Quick Start

### 1. Configure Your API Key

1. Open VS Code Settings (Ctrl+, / Cmd+,)
2. Search for "weave.apiKey"
3. Enter your API key for your chosen provider

### 2. Select a Provider

Configure your AI provider in VS Code settings:
- `weave.provider`: Choose between `openai`, `anthropic`, or `local`
- `weave.model`: Specify the model to use (e.g., `gpt-4`, `claude-3-opus`)

### 3. Use Weave Features

#### Generate Prompt
1. Select code in your editor
2. Use Ctrl+Shift+W P (Cmd+Shift+W P on Mac)
3. A prompt will be generated and displayed

#### Analyze Code
1. Select code in your editor
2. Use Ctrl+Shift+W A (Cmd+Shift+W A on Mac)
3. Get detailed analysis and insights

#### Suggest Optimization
1. Select code in your editor
2. Use Ctrl+Shift+W O (Cmd+Shift+W O on Mac)
3. Receive optimization suggestions

#### Insert Code Template
1. Use Ctrl+Shift+P to open command palette
2. Type "Weave: Insert Code Template"
3. Select a template to insert into your file

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Generate Prompt | Ctrl+Shift+W P | Generate optimized prompt for selected code |
| Analyze Code | Ctrl+Shift+W A | Get AI insights about code |
| Suggest Optimization | Ctrl+Shift+W O | Get optimization suggestions |
| Show Documentation | N/A | Open Weave documentation |
| Insert Code Template | N/A | Insert Weave code template |
| Toggle Inline Hints | N/A | Show/hide inline hints |

## Settings

Configure Weave AI Assistant in your VS Code settings:

```json
{
  "weave.enabled": true,
  "weave.apiKey": "your-api-key-here",
  "weave.provider": "openai",
  "weave.model": "gpt-4",
  "weave.temperature": 0.7,
  "weave.maxTokens": 1000,
  "weave.inlineHints": true,
  "weave.enableCodeCompletion": true,
  "weave.enableCodeLens": true,
  "weave.languageScope": ["typescript", "javascript", "python"]
}
```

### Configuration Options

- **weave.enabled**: Enable/disable the extension
- **weave.apiKey**: API key for your AI provider
- **weave.provider**: AI provider (`openai`, `anthropic`, `local`)
- **weave.model**: Model to use (e.g., `gpt-4`, `claude-3-opus`)
- **weave.temperature**: Response creativity (0-2, default: 0.7)
- **weave.maxTokens**: Maximum response length (default: 1000)
- **weave.inlineHints**: Show inline AI hints
- **weave.enableCodeCompletion**: Enable AI code completion
- **weave.enableCodeLens**: Enable code lens features
- **weave.languageScope**: Languages to enable Weave for

## Code Snippets

The extension includes helpful code snippets for quick Weave integration:

### TypeScript/JavaScript
- `weave-generate`: Basic generation operation
- `weave-classify`: Text classification
- `weave-extract`: Structured data extraction
- `weave-cache`: Weave with caching
- `weave-error`: Error handling example

### Python
- `weave-generate`: Basic generation operation
- `weave-classify`: Text classification
- `weave-extract`: Structured data extraction
- `weave-cache`: Weave with caching

## Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Generate Prompt | Ctrl+Shift+W P | Cmd+Shift+W P |
| Analyze Code | Ctrl+Shift+W A | Cmd+Shift+W A |
| Suggest Optimization | Ctrl+Shift+W O | Cmd+Shift+W O |

## Examples

### Generate a Prompt for Code

```typescript
// Select this code:
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Press Ctrl+Shift+W P to generate a prompt:
// "Write a function that generates the nth Fibonacci number recursively..."
```

### Get Code Analysis

```javascript
// Select code and press Ctrl+Shift+W A to get analysis:
// "This implementation has exponential time complexity..."
```

### Optimize Code

```python
# Select code and press Ctrl+Shift+W O:
# "Consider using dynamic programming or memoization..."
```

## Supported Languages

- TypeScript
- JavaScript
- Python

(Additional language support coming soon)

## Troubleshooting

### API Key Not Working
- Ensure your API key is correctly set in settings
- Verify you have the right provider selected
- Check that your API key has the necessary permissions

### No Completions Appearing
- Make sure `weave.enableCodeCompletion` is enabled
- Check that your language is in `weave.languageScope`
- Verify extension is activated

### Slow Responses
- Reduce `weave.maxTokens` for faster responses
- Check your internet connection
- Consider using a faster model

## Support

- [GitHub Issues](https://github.com/kitium-ai/weave/issues)
- [Weave Documentation](https://github.com/kitium-ai/weave#readme)
- [Report a Bug](https://github.com/kitium-ai/weave/issues/new)

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details

## Credits

Built with ❤️ by [KitiumAI](https://github.com/kitium-ai) for the [Weave Framework](https://github.com/kitium-ai/weave)
