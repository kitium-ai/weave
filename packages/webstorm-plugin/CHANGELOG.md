# Weave AI Assistant for WebStorm - Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-01-XX

### Added
- **Chat Interface**: Real-time conversation with Claude AI in WebStorm
- **Code Analysis**: Comprehensive code quality assessment
- **Inline Editing**: Edit selected code with natural language instructions
- **Optimization Suggestions**: AI-powered performance improvement recommendations
- **Prompt Generation**: Generate optimized prompts for selected code
- **Documentation Generation**: Auto-generate JSDoc/docstrings
- **Settings UI**: Comprehensive settings panel for configuration
  - API key configuration
  - Provider selection (Anthropic, OpenAI, Local)
  - Model selection
  - Temperature and token limit tuning
  - Language scope configuration
  - Feature toggles
- **Tool Window Integration**: Native WebStorm tool window for chat
- **Context Menu Integration**: Right-click actions for all features
- **Keyboard Shortcuts**: Full keyboard shortcut support
  - `Ctrl+Shift+/` for chat
  - `Ctrl+K, Ctrl+I` for inline edit
  - `Ctrl+Shift+W, A` for analyze
  - `Ctrl+Shift+W, O` for optimize
  - `Ctrl+Shift+W, P` for generate prompt
- **Language Support**: JavaScript, TypeScript, Python, Java, Kotlin
- **Error Handling**: Graceful error handling with user notifications
- **Logging**: Comprehensive logging for debugging
- **Documentation**: Full user and development documentation

### Technical Details
- Built with Kotlin
- Uses Anthropic API (v1)
- Async/await with Kotlin Coroutines
- OkHttp3 for HTTP requests
- Gson for JSON serialization
- IntelliJ Platform SDK for UI integration

### Compatibility
- WebStorm 2023.1+
- Java 17+
- All JetBrains IDEs based on IntelliJ IDEA 2023.1+

## Planned Features for Future Releases

### [1.1.0] - Planned
- [ ] Code inspections integration
- [ ] Intention actions for quick fixes
- [ ] Custom prompt templates
- [ ] Code refactoring suggestions
- [ ] Test generation
- [ ] Comments generation
- [ ] Git commit message suggestions
- [ ] Performance metrics tracking

### [1.2.0] - Planned
- [ ] OpenAI provider full integration
- [ ] Local model support
- [ ] Custom API endpoint support
- [ ] Batch operations
- [ ] Code diff visualization
- [ ] Undo/redo for edits
- [ ] Favorite prompts/templates
- [ ] Usage statistics

### [2.0.0] - Planned
- [ ] Fine-tuning support
- [ ] Code generation from descriptions
- [ ] Multi-file analysis
- [ ] Project-level insights
- [ ] Team collaboration features
- [ ] AI-powered git integration
- [ ] Code search with AI understanding
- [ ] Advanced analytics

## Installation & Setup

### Current Version: 1.0.0
- Available on JetBrains Marketplace
- Requires Anthropic API key
- No additional dependencies needed

## Migration Guide

### From Preview Builds
No breaking changes. Settings are preserved.

### Upgrading from 0.x
See migration guide in documentation.

## Known Issues

### Current Version (1.0.0)
- Chat history limited to current session
- Tool window may require restart after settings change
- Long responses may take time to display

### Workarounds
- Clear chat history between sessions if needed
- Restart IDE after changing API key
- Reduce max tokens for faster responses

## Support & Reporting

### Report Issues
- [GitHub Issues](https://github.com/kitium-ai/weave/issues)
- Include WebStorm version, plugin version, and reproduction steps
- Check existing issues before creating new ones

### Request Features
- [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)
- Use feature request template
- Vote on existing requests

### Get Help
- [Documentation](README.md)
- [Quick Start](QUICKSTART.md)
- [Development Guide](DEVELOPMENT.md)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow code standards
4. Write tests for new features
5. Submit a pull request

See [DEVELOPMENT.md](DEVELOPMENT.md) for technical details.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) - Claude API
- [JetBrains](https://www.jetbrains.com/) - IntelliJ Platform
- [Weave Framework](https://github.com/kitium-ai/weave)
- Community contributors

## Version History

| Version | Release Date | Status |
|---------|--------------|--------|
| 1.0.0 | 2024-01-XX | Current |
| 0.9.0 | 2024-01-XX | Preview |

---

**Latest Version**: 1.0.0
**Last Updated**: 2024-01-XX
**Maintainer**: KitiumAI Team
