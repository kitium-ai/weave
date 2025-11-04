# Changelog

All notable changes to the Weave AI Assistant extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-11-03

### Added
- Initial release of Weave AI Assistant extension
- Core features:
  - Generate optimized prompts for selected code
  - AI-powered code analysis
  - Code optimization suggestions
  - Smart code completion powered by Weave
  - Inline code lens for quick actions
- Support for multiple programming languages:
  - TypeScript
  - JavaScript
  - Python
- Configuration options:
  - API key management
  - Provider selection (OpenAI, Anthropic, local)
  - Model and temperature customization
  - Token limit configuration
- Code snippets for common Weave patterns
- Command palette integration
- Context menu integration
- Keyboard shortcuts for quick access
- Status bar indicator
- Documentation quick-links
- Result viewing panel

### Features
- **Generate Prompt**: Create optimized prompts for AI models (Ctrl+Shift+W P)
- **Analyze Code**: Get AI insights about code quality (Ctrl+Shift+W A)
- **Suggest Optimization**: Receive optimization recommendations (Ctrl+Shift+W O)
- **Code Completion**: AI-powered suggestions as you type
- **Code Lens**: Inline hints with quick actions
- **Templates**: Insert Weave code patterns quickly
- **Settings**: Comprehensive configuration options

### Settings
- `weave.enabled`: Enable/disable extension
- `weave.apiKey`: API key for AI provider
- `weave.provider`: Choose AI provider
- `weave.model`: Select model to use
- `weave.temperature`: Control response creativity
- `weave.maxTokens`: Limit response length
- `weave.inlineHints`: Toggle inline suggestions
- `weave.enableCodeCompletion`: Control code completion
- `weave.enableCodeLens`: Control code lens
- `weave.languageScope`: Languages to enable for

### Known Limitations
- Mock implementation for API calls (ready for integration)
- English language support only
- Limited to TypeScript, JavaScript, and Python

### Future Enhancements
- Real Weave API integration
- Support for additional languages
- Custom prompt templates
- History and favorites
- Batch operations
- Local model support improvements
- Real-time analysis
- Code refactoring suggestions
- Test generation
- Documentation generation

## [Unreleased]

### Planned
- Real integration with Weave API
- Additional language support
- Advanced caching features
- Custom API endpoint support
- Marketplace publishing
