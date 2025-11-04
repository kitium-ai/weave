# Weave AI Assistant for Cursor IDE

**Cursor-Optimized AI Extension for Enhanced Coding with Anthropic Claude**

A powerful VS Code-based extension tailored specifically for Cursor IDE, providing seamless AI integration with native chat capabilities, inline editing, and code analysis powered by Anthropic's Claude models.

## ✨ Features

### 💬 Native Chat Interface
- Real-time conversation with Claude AI
- Full chat history management
- Context-aware responses
- Keyboard shortcut: **Ctrl+Shift+/** (Cmd+Shift+/ on Mac)

### ✏️ Inline Code Editing
- Edit selected code with AI instructions
- Maintains code context and language
- Automatic code replacement
- Keyboard shortcut: **Ctrl+K Ctrl+I** (Cmd+K Cmd+I on Mac)

### 🔍 Code Analysis
- Comprehensive code quality assessment
- Identify potential issues
- Performance insights
- Best practice recommendations

### 💡 Optimization Suggestions
- Performance improvement recommendations
- Code clarity enhancements
- Efficiency analysis
- Modern pattern suggestions

### 📝 Prompt Generation
- Generate optimized AI prompts for selected code
- Perfect for training and documentation
- One-click clipboard copy

### 📚 Code Documentation
- Auto-generate comprehensive documentation
- JSDoc/docstring format support
- Function signature analysis

### ♻️ Code Refactoring
- Pattern-based refactoring suggestions
- Multiple refactoring options
- Maintains code functionality

## 🚀 Quick Start

### 1. Install the Extension
```bash
# In Cursor IDE:
1. Open Extensions (Ctrl+Shift+X)
2. Search for "Weave AI Assistant for Cursor"
3. Click Install
```

### 2. Configure Anthropic API Key
```bash
1. Open Settings (Ctrl+,)
2. Search for "weave.apiKey"
3. Enter your Anthropic API key from https://console.anthropic.com
```

### 3. Verify Configuration
- Provider is pre-configured to **Anthropic**
- Model defaults to **claude-3-opus-20240229**
- Token limit set to **2000** for detailed responses

### 4. Start Using!
```bash
# Open chat
Ctrl+Shift+/

# Edit code inline
Select code → Ctrl+K Ctrl+I

# Analyze code
Select code → Right-click → "Weave: Analyze Code"
```

## ⌨️ Keyboard Shortcuts

| Command | Windows/Linux | Mac |
|---------|---------------|-----|
| Chat with AI | `Ctrl+Shift+/` | `Cmd+Shift+/` |
| Inline Edit | `Ctrl+K Ctrl+I` | `Cmd+K Cmd+I` |
| Generate Prompt | `Ctrl+Shift+W P` | `Cmd+Shift+W P` |
| Analyze Code | `Ctrl+Shift+W A` | `Cmd+Shift+W A` |
| Suggest Optimization | `Ctrl+Shift+W O` | `Cmd+Shift+W O` |
| Toggle Features | `Ctrl+Shift+W T` | `Cmd+Shift+W T` |

## 📋 Available Commands

### Chat with AI (`weave.cursorChat`)
Opens the native Weave chat panel for real-time conversation with Claude.

**Usage:**
```
Ctrl+Shift+/
```

**Features:**
- Multi-turn conversation
- Full message history
- Clear history option
- Auto-scroll to latest message

### Inline Edit (`weave.inlineEdit`)
Edit selected code with natural language instructions.

**Usage:**
1. Select code you want to edit
2. Press `Ctrl+K Ctrl+I`
3. Enter editing instruction
4. Code is replaced with edited version

**Example Instructions:**
- "Add error handling"
- "Optimize for performance"
- "Add type annotations"
- "Convert to async/await"

### Generate Prompt (`weave.generatePrompt`)
Generate an AI-optimized prompt describing selected code.

**Usage:**
1. Select code
2. Press `Ctrl+Shift+W P`
3. View or copy the generated prompt

### Analyze Code (`weave.analyzeCode`)
Get detailed AI analysis of selected code.

**Analysis Includes:**
- Code quality assessment
- Potential issues and bugs
- Performance considerations
- Best practice recommendations

### Suggest Optimization (`weave.suggestOptimization`)
Receive AI-powered optimization suggestions.

**Suggestions Include:**
- Performance improvements
- Code clarity enhancements
- Efficiency gains
- Modern pattern recommendations

### Toggle AI Features (`weave.cursorAI`)
Enable/disable specific AI features.

## ⚙️ Configuration

### API Settings

```json
{
  "weave.enabled": true,
  "weave.apiKey": "sk-ant-...",
  "weave.provider": "anthropic",
  "weave.model": "claude-3-opus-20240229"
}
```

### Response Settings

```json
{
  "weave.temperature": 0.7,
  "weave.maxTokens": 2000
}
```

**Temperature Tuning:**
- `0.0 - 0.5`: More focused and deterministic
- `0.7` (default): Balanced creativity and consistency
- `1.0 - 2.0`: More creative and exploratory

### Feature Settings

```json
{
  "weave.cursorFeatures": {
    "chat": true,
    "inlineEdit": true,
    "autoComplete": true,
    "docGeneration": true,
    "refactoring": true
  }
}
```

### Language Support

```json
{
  "weave.languageScope": [
    "typescript",
    "javascript",
    "python",
    "java",
    "cpp",
    "rust"
  ]
}
```

## 📚 Use Cases

### 1. Real-time Code Help
```bash
Ctrl+Shift+/
# Ask: "How do I optimize this database query?"
```

### 2. Quick Code Refactoring
```bash
# Select problematic code
Ctrl+K Ctrl+I
# Enter: "Refactor to use async/await"
```

### 3. Understanding Unfamiliar Code
```bash
# Select code section
Ctrl+Shift+W A
# Read comprehensive analysis
```

### 4. Performance Optimization
```bash
# Select code
Ctrl+Shift+W O
# Review optimization suggestions
# Apply recommended changes
```

### 5. Documentation Generation
```bash
# Select function
# Right-click → "Weave: Generate Documentation"
# Copy generated JSDoc
```

### 6. Creating Training Prompts
```bash
# Select code
Ctrl+Shift+W P
# Copy generated prompt for fine-tuning or documentation
```

## 🎯 Best Practices

### Chat Best Practices
- Be specific about context and requirements
- Reference code sections when needed
- Ask follow-up questions for clarification
- Review responses for accuracy

### Inline Edit Best Practices
- Start with small, focused edits
- Use clear, specific instructions
- Review changes before committing
- Test edited code thoroughly

### Analysis Best Practices
- Analyze functions and components individually
- Review all suggestions before implementing
- Test recommendations in development first
- Track improvements over time

## 🔒 Privacy & Security

### Data Handling
- Code is sent to Anthropic's API
- No data is stored locally in Cursor's extension server
- Refer to [Anthropic Privacy Policy](https://www.anthropic.com/privacy) for details

### API Key Security
- Store API keys in VS Code's secure storage
- Never commit API keys to version control
- Rotate keys regularly
- Use environment variables for automation

## 🛠️ Troubleshooting

### Chat Not Opening
**Solution:**
1. Check API key is configured: `Ctrl+,` → search "weave.apiKey"
2. Verify provider is "anthropic"
3. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"

### Slow Responses
**Solutions:**
1. Reduce `weave.maxTokens` in settings
2. Use faster model: `claude-3-sonnet-20240229`
3. Check internet connection
4. Check Anthropic API status

### API Errors
**Solutions:**
1. Verify API key is valid
2. Check API quota and billing
3. Ensure correct provider selected
4. Check Anthropic API documentation

### Features Not Available
**Solutions:**
1. Verify language is in scope: check `weave.languageScope`
2. Ensure extension is enabled: `weave.enabled = true`
3. Reload VS Code window
4. Check extension output: View → Output → Weave

## 📖 Documentation

- **Architecture**: See DEVELOPMENT.md for technical details
- **API Reference**: Refer to Weave Framework documentation
- **Examples**: Check embedded code examples in this README

## 🤝 Contributing

Found a bug or have a feature request?

- **Report Issues**: [GitHub Issues](https://github.com/kitium-ai/weave/issues)
- **Suggest Features**: [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)
- **Contributing Guide**: See DEVELOPMENT.md

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Resources

- **Weave Framework**: https://github.com/kitium-ai/weave
- **Anthropic API**: https://www.anthropic.com/
- **Claude Documentation**: https://docs.anthropic.com/
- **Cursor IDE**: https://www.cursor.com/

## 🎓 Learning Path

1. **Start**: Open chat and ask a question
2. **Explore**: Try inline editing with simple instructions
3. **Master**: Use analysis and optimization for complex tasks
4. **Extend**: Customize settings for your workflow
5. **Optimize**: Fine-tune model and token settings

## ✅ Quick Checklist

- [ ] Extension installed
- [ ] API key configured
- [ ] Anthropic provider selected
- [ ] Chat opens successfully
- [ ] Inline edit works
- [ ] Code analysis works
- [ ] Customized settings to preference
- [ ] Tested all features
- [ ] Ready to boost productivity! 🚀

---

**Questions?** Check out the [Weave documentation](https://github.com/kitium-ai/weave#readme) or open an issue on GitHub!

**Enjoying Weave for Cursor?** Share your feedback and improvements!
