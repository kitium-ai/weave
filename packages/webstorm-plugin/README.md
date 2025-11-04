# Weave AI Assistant for WebStorm

**Professional AI-Powered Code Assistant for WebStorm IDE**

A powerful IntelliJ-based plugin that brings AI-driven code analysis, editing, and optimization to WebStorm, powered by Anthropic's Claude models.

## ✨ Features

### 💬 Chat Interface
- Real-time conversation with Claude AI
- Full chat history management
- Context-aware responses
- Built-in tool window

### ✏️ Inline Code Editing
- Edit selected code with natural language instructions
- Automatic code replacement
- Preserves formatting and context
- Keyboard shortcut: `Ctrl+K, Ctrl+I`

### 🔍 Code Analysis
- Comprehensive code quality assessment
- Identify potential issues and bugs
- Performance analysis
- Best practice recommendations
- Keyboard shortcut: `Ctrl+Shift+W, A`

### 💡 Optimization Suggestions
- Performance improvement recommendations
- Code clarity enhancements
- Efficiency analysis
- Modern pattern suggestions
- Keyboard shortcut: `Ctrl+Shift+W, O`

### 📝 Prompt Generation
- Generate AI-optimized prompts for code
- Perfect for training and documentation
- One-click copy functionality
- Keyboard shortcut: `Ctrl+Shift+W, P`

### 📚 Documentation Generation
- Auto-generate comprehensive documentation
- JSDoc/docstring format support
- Function signature analysis

### ⚡ WebStorm Integration
- Native tool window integration
- Right-click context menu
- Editor popup menu actions
- Keyboard shortcuts for all actions

## 🚀 Installation

### From JetBrains Marketplace
1. Open WebStorm
2. Go to **Settings → Plugins → Marketplace**
3. Search for "Weave AI Assistant"
4. Click **Install**
5. Restart WebStorm

### Manual Installation
1. Download `weave-ai-assistant.jar` from releases
2. Open **Settings → Plugins**
3. Click gear icon → **Install Plugin from Disk...**
4. Select the `.jar` file
5. Restart WebStorm

## ⚙️ Configuration

### Get Your API Key
1. Visit [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys**
4. Create a new key
5. Copy the key

### Configure in WebStorm
1. Open **Settings → Tools → Weave AI Assistant**
2. Paste your API key
3. Verify provider is set to **Anthropic** (recommended)
4. Click **Apply** and **OK**

### Settings Overview

| Setting | Default | Description |
|---------|---------|-------------|
| **Enable Weave** | ✓ | Turn plugin on/off |
| **API Key** | Empty | Your Anthropic API key |
| **Provider** | Anthropic | AI provider (anthropic/openai/local) |
| **Model** | claude-3-opus | Claude model to use |
| **Temperature** | 0.7 | Response creativity (0-2) |
| **Max Tokens** | 2000 | Response length limit |
| **Languages** | javascript,typescript,python,java,kotlin | Supported languages |

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| **Open Chat** | `Ctrl+Shift+/` |
| **Inline Edit** | `Ctrl+K, Ctrl+I` |
| **Analyze Code** | `Ctrl+Shift+W, A` |
| **Optimize** | `Ctrl+Shift+W, O` |
| **Generate Prompt** | `Ctrl+Shift+W, P` |

## 📖 Usage Guide

### Opening the Chat
```
Press Ctrl+Shift+/
OR
Menu → Tools → Weave AI Assistant → Chat with Weave AI
```

**Chat Features:**
- Multi-turn conversations
- Full message history
- Clear history button
- Auto-scroll to latest message

### Inline Code Editing
```
1. Select code you want to edit
2. Press Ctrl+K, Ctrl+I
3. Enter your edit instruction
4. Code automatically updates
```

**Example Instructions:**
- "Add error handling"
- "Convert to async/await"
- "Add TypeScript types"
- "Optimize for performance"

### Code Analysis
```
1. Select code
2. Press Ctrl+Shift+W, A
3. Review analysis in tool window
```

**Analysis Includes:**
- Code quality score
- Potential bugs
- Performance issues
- Best practice suggestions

### Optimization Suggestions
```
1. Select code
2. Press Ctrl+Shift+W, O
3. Review suggestions
4. Apply recommendations
```

### Generate Prompt
```
1. Select code
2. Press Ctrl+Shift+W, P
3. Use generated prompt for documentation/training
```

### Generate Documentation
```
1. Right-click selected code
2. Select "Weave: Generate Documentation"
3. Copy generated documentation
```

## 🎯 Workflows

### Workflow 1: Code Review
```
1. Open code file
2. Select a function
3. Press Ctrl+Shift+W, A (Analyze)
4. Read insights
5. Ask follow-up questions in chat
6. Apply fixes with inline edit
```

### Workflow 2: Performance Optimization
```
1. Select slow/complex code
2. Press Ctrl+Shift+W, O (Optimize)
3. Review suggestions
4. Apply best ones with inline edit
5. Test changes
```

### Workflow 3: Learning Code
```
1. Select unfamiliar code
2. Press Ctrl+Shift+/ (Chat)
3. Ask "Explain this code"
4. Have follow-up conversation
5. Request code improvements
```

### Workflow 4: Documentation
```
1. Select function
2. Right-click → Generate Documentation
3. Copy generated JSDoc
4. Paste into code
5. Customize as needed
```

## 🛠️ Advanced Configuration

### Adjust Temperature (Creativity)
```
Settings → Tools → Weave AI Assistant
Temperature: 0.7 (default)
  • 0-0.5: Focused and deterministic
  • 0.7-1.0: Balanced (recommended)
  • 1.0-2.0: Creative and exploratory
```

### Change Response Length
```
Settings → Tools → Weave AI Assistant
Max Tokens: 2000 (default)
  • Lower = Faster responses, less detail
  • Higher = Slower responses, more detail
```

### Switch Language Support
```
Settings → Tools → Weave AI Assistant
Languages: Add or remove supported languages
```

## 🔒 Privacy & Security

### Data Handling
- Your code is sent to Anthropic's API
- No data is stored locally
- Check [Anthropic Privacy Policy](https://www.anthropic.com/privacy)

### API Key Security
- Keys stored in WebStorm's secure storage
- Never logged or transmitted insecurely
- Rotate regularly for security
- Use environment variables for CI/CD

## ❓ FAQ

### Q: How much does this cost?
**A:** You're charged per token by Anthropic. Use the `maxTokens` setting to control costs.

### Q: Is my code private?
**A:** Code is sent to Anthropic. Review their privacy policy for details.

### Q: Which languages are supported?
**A:** JavaScript, TypeScript, Python, Java, Kotlin (configurable).

### Q: Can I use OpenAI instead?
**A:** Yes! Change provider in settings, but Anthropic Claude is recommended for WebStorm.

### Q: What's the difference from VS Code extension?
**A:** WebStorm plugin integrates with JetBrains IDEs natively (tool windows, inspections, etc.) while VS Code extension is browser-based.

### Q: How do I report bugs?
**A:** [GitHub Issues](https://github.com/kitium-ai/weave/issues)

### Q: Can I request features?
**A:** Yes! [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)

## 📚 Getting Started

### 5-Minute Setup
1. Install plugin from marketplace
2. Get API key from Anthropic Console
3. Go to Settings → Tools → Weave
4. Paste API key
5. Press `Ctrl+Shift+/` to open chat
6. Start coding! 🚀

### Next Steps
- Read [development guide](DEVELOPMENT.md)
- Check [quick start guide](QUICKSTART.md)
- Explore keyboard shortcuts
- Customize settings to your preference

## 🆘 Troubleshooting

### Chat window not opening
```
1. Check Settings → Tools → Weave
2. Verify API key is entered
3. File → Invalidate Caches → Restart
4. Check Help → Show Log in Explorer
```

### Commands not showing in context menu
```
1. File → Invalidate Caches → Restart
2. Check if plugin is enabled
3. Open Settings → Plugins, search "Weave"
4. Ensure it's checked/enabled
```

### Slow responses
```
1. Settings → Reduce Max Tokens (try 1000)
2. Check internet connection
3. Try faster model: claude-3-sonnet
4. Check Anthropic API status
```

### API errors
```
1. Verify API key is correct
2. Check Anthropic console for quota
3. Ensure billing is active
4. Check rate limits
```

### Plugin won't load
```
1. File → Invalidate Caches → Restart
2. Check Help → Show Log
3. Look for error messages
4. Report to GitHub Issues
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kitium-ai/weave/issues)
- **Questions**: [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)
- **Documentation**: [Weave Framework](https://github.com/kitium-ai/weave)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Follow coding standards

See [DEVELOPMENT.md](DEVELOPMENT.md) for technical details.

## 📄 License

MIT License - See LICENSE for details

## 🔗 Resources

- **Weave Framework**: https://github.com/kitium-ai/weave
- **Anthropic API**: https://www.anthropic.com/
- **Claude Docs**: https://docs.anthropic.com/
- **JetBrains SDK**: https://plugins.jetbrains.com/docs/intellij/

## 📊 System Requirements

- **WebStorm**: 2023.1 or later
- **Java**: 17 or later
- **Internet**: Required for API access
- **Anthropic API Key**: Required

## ✅ Quick Checklist

- [ ] Plugin installed
- [ ] API key configured
- [ ] Chat opens successfully
- [ ] Inline edit works
- [ ] Code analysis works
- [ ] Keyboard shortcuts memorized
- [ ] Settings customized
- [ ] Ready to code! 🚀

---

**Enjoying Weave for WebStorm?** Share your feedback and help us improve!

**Questions?** Check the [FAQ](#-faq) or open an issue on GitHub.
