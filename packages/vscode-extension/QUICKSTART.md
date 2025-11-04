# Weave AI Assistant - Quick Start Guide

## 🎯 5-Minute Setup

### Step 1: Install the Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Weave AI Assistant"
4. Click Install

### Step 2: Configure API Key
1. Open Settings (Ctrl+,)
2. Search for "weave.apiKey"
3. Enter your API key:
   - **OpenAI**: Get from https://platform.openai.com/api-keys
   - **Anthropic**: Get from https://console.anthropic.com
   - **Local**: Leave empty if using local model

### Step 3: Select Provider
1. Open Settings (Ctrl+,)
2. Search for "weave.provider"
3. Choose:
   - `openai` (recommended)
   - `anthropic`
   - `local`

### Step 4: Choose Model
1. Open Settings (Ctrl+,)
2. Search for "weave.model"
3. Set to your preferred model:
   - OpenAI: `gpt-4`, `gpt-3.5-turbo`
   - Anthropic: `claude-3-opus`, `claude-3-sonnet`
   - Local: Configure accordingly

## ⚡ Quick Commands

### Generate Prompt
```
Select code → Ctrl+Shift+W P → View result
```

**Example:**
```typescript
function add(a: number, b: number): number {
  return a + b;
}
```
→ Generates a prompt describing what this function does

### Analyze Code
```
Select code → Ctrl+Shift+W A → View analysis
```

**Gets insights on:**
- Code quality
- Potential issues
- Performance concerns
- Best practices

### Suggest Optimization
```
Select code → Ctrl+Shift+W O → View suggestions
```

**Receives recommendations for:**
- Performance improvements
- Code clarity
- Efficiency gains
- Modern patterns

### Insert Template
```
Ctrl+Shift+P → Type "Weave: Insert Code Template" → Select template
```

**Available templates:**
- Basic Weave Usage
- Weave with Classification
- Weave with Extraction

## 📋 Common Tasks

### Task 1: Understand Unfamiliar Code
1. Select the code
2. Press Ctrl+Shift+W A (Analyze Code)
3. Read the analysis in the panel
4. Copy insights to clipboard if needed

### Task 2: Optimize Performance
1. Select slow/complex code
2. Press Ctrl+Shift+W O (Suggest Optimization)
3. Review suggestions
4. Apply recommended changes

### Task 3: Create Prompt for AI Training
1. Select your code
2. Press Ctrl+Shift+W P (Generate Prompt)
3. Copy the generated prompt
4. Use in AI training/fine-tuning

### Task 4: Get Code Help While Writing
1. Start typing code
2. Weave provides intelligent suggestions
3. Accept or dismiss as needed
4. Press Ctrl+Space for more suggestions

### Task 5: Analyze Multiple Functions
1. Select first function
2. Analyze it (Ctrl+Shift+W A)
3. View results
4. Repeat for other functions

## 🛠️ Configuration Tips

### Disable Inline Hints
```
Settings → Search "weave.inlineHints" → Uncheck
```

### Limit Response Length
```
Settings → Search "weave.maxTokens" → Set to 500-1000
```

### Adjust Response Creativity
```
Settings → Search "weave.temperature" → Set 0-2
  • 0-0.5: More focused/factual
  • 0.7-1.0: Balanced (default)
  • 1.0-2.0: More creative/diverse
```

### Enable Only for Specific Languages
```
Settings → Search "weave.languageScope" → Choose languages
  • typescript
  • javascript
  • python
```

## 🚀 Pro Tips

### 1. Use Code Lens
Hover over functions - see quick action buttons!

### 2. Keyboard Shortcuts
Learn these for faster workflow:
- Ctrl+Shift+W P = Generate Prompt
- Ctrl+Shift+W A = Analyze Code
- Ctrl+Shift+W O = Optimize

### 3. Copy Results Easily
Results panel has "Copy to Clipboard" button

### 4. Monitor Status Bar
Bottom right shows Weave status:
- ✓ = Ready
- 💡 = Active
- ⭕ = Inactive

### 5. Use Snippets
Type these prefixes for instant templates:
- `weave-generate`: Basic generation
- `weave-classify`: Text classification
- `weave-extract`: Data extraction
- `weave-cache`: Caching setup
- `weave-error`: Error handling

## ❓ FAQs

### Q: Is my code private?
**A:** Code is sent to your configured AI provider. Check their privacy policy.

### Q: Can I use local models?
**A:** Yes! Set provider to `local` and configure your endpoint.

### Q: What languages are supported?
**A:** TypeScript, JavaScript, Python (extensible to others)

### Q: How much will this cost?
**A:** Depends on your AI provider and usage. Set `maxTokens` to control costs.

### Q: Can I customize prompts?
**A:** Currently uses built-in prompts. Custom prompts coming soon!

### Q: Does it work offline?
**A:** Only with local models. Remote providers require internet.

### Q: How do I report issues?
**A:** [GitHub Issues](https://github.com/kitium-ai/weave/issues)

## 🔧 Troubleshooting

### Commands Not Working
1. Check API key is set
2. Reload VS Code (Ctrl+R)
3. Verify provider is correct
4. Check Extension Output: View → Output → Weave

### Slow Responses
1. Reduce `maxTokens` (Settings)
2. Use faster model
3. Check internet connection
4. Check provider status

### API Errors
1. Verify API key is valid
2. Check provider is correct
3. Ensure you have API credits
4. Check rate limits

### No Suggestions Appearing
1. Verify `enableCodeCompletion` is true
2. Check language is in scope
3. Make sure extension is active
4. Reload VS Code

## 📚 Next Steps

1. **Read Full Documentation**
   - Use Command Palette: "Weave: Show Documentation"

2. **Explore Code Snippets**
   - Type prefix like `weave-` to see available templates

3. **Customize Settings**
   - Open VS Code Settings and search "weave."

4. **Try All Features**
   - Generate Prompt
   - Analyze Code
   - Suggest Optimization
   - Use Code Completion

5. **Provide Feedback**
   - [Report Issues](https://github.com/kitium-ai/weave/issues)
   - [Suggest Features](https://github.com/kitium-ai/weave/discussions)

## 🎓 Learning Resources

- **Weave Framework**: https://github.com/kitium-ai/weave
- **VS Code Extensions**: https://code.visualstudio.com/api
- **OpenAI API**: https://platform.openai.com/docs
- **Anthropic Claude**: https://www.anthropic.com

## ✅ Quick Checklist

- [ ] Extension installed
- [ ] API key configured
- [ ] Provider selected
- [ ] Model chosen
- [ ] Tested "Analyze Code"
- [ ] Tested "Generate Prompt"
- [ ] Tested "Suggest Optimization"
- [ ] Customized settings
- [ ] Learned keyboard shortcuts
- [ ] Ready to boost productivity! 🚀

---

**Having trouble?** Check out DEVELOPMENT.md for technical details or open an issue on GitHub!
